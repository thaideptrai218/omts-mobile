import type { AreaReading, CornerReading } from "@/features/farming/models/ZoneBoundary";

import { DEFAULT_CENTRAL_MERIDIAN, vn2000ToGrid } from "@/features/farming/utils/vn2000";

/**
 * Đọc chữ OCR của bảng "Tọa độ các điểm góc khu N" trên sơ đồ cấp phép khu vực biển. Mỗi dòng có tên điểm (A1, B12…),
 * vĩ độ và kinh độ dạng độ-phút-giây, rồi X, Y (m) hệ VN-2000; có sơ đồ chỉ ghi X, Y kiểu "2.315.876,23". Lỗi đã gặp khi thử
 * tesseract trên bảng in (25/11/2026):
 * - ° thành 5, 7, 8, 9, 2 hoặc mất: "107830'41.04"", "21907'05.16"", "2150654 00";
 * - ' mất hoặc thành dấu khác: "21°0706.60"", "107°30:52.56"";
 * - dấu chấm thập phân thành khoảng trắng hoặc mất: "21°07'06 60"", "2335593 87", "47521472";
 * - ký tự rác ở đầu số ("12335593 87" là "|2335593.87") và tên điểm đọc nhầm ("AI", "lA2", "|B4").
 * Vì vậy mỗi ô được hiểu theo nhiều cách, rồi chọn cặp vĩ/kinh độ và X, Y chỉ cùng một chỗ (lệch không quá 3 m). Phần lẻ của
 * giây hay của mét chỉ vài chục cm nên đọc sai phần lẻ không làm hỏng ranh giới.
 */

/** Một cách hiểu một ô số; `cost` càng nhỏ càng ít phải đoán (ký hiệu đọc thành chữ số, ký tự rác…). */
type Reading = { value: number; end: number; cost: number };

/** Một nhóm chữ số (có thể có dấu chấm) và vị trí của nó trong dòng. */
type Token = { text: string; index: number; gap: string };

const LAT_DEGREES: [number, number] = [8, 23];
const LON_DEGREES: [number, number] = [102, 109];
const X_RANGE: [number, number] = [800000, 2800000];
const Y_RANGE: [number, number] = [100000, 900000];

/** Vĩ/kinh độ và X, Y được coi là khớp khi lệch không quá chừng này (m). */
const MATCH_M = 3;

/**
 * Bỏ dấu, viết hoa, gom các kiểu dấu nháy và ký hiệu độ, sửa chữ cái đọc nhầm nằm sát chữ số (l, I, | thành 1; O thành 0).
 * Không dùng lookbehind của regex: WebView iOS cũ (trước 16.4) báo lỗi cú pháp ngay khi tải file.
 */
function normalize(line: string): string {
  return line
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "D")
    .toUpperCase()
    .replace(/[’‘`´′]/g, "'")
    .replace(/[”“″]/g, '"')
    .replace(/[º˚]/g, "°")
    .replace(/(\d)[IL|](?=[\d°'".\s]|$)/g, (_, digit: string) => `${digit}1`)
    .replace(/(\d)O(?=[\d°'".])/g, (_, digit: string) => `${digit}0`)
    .replace(/(^|[^\d.,])(\d{1,3}(?:[.,]\d{3})+)(?:[.,](\d{1,2}))?(?!\d)/g, thousands)
    .replace(/(\d),(?=\d)/g, (_, digit: string) => `${digit}.`);
}

/**
 * Số viết kiểu Việt Nam, dấu chấm ngăn hàng nghìn và dấu phẩy thập phân: "2.315.876,23" → "2315876.23" (OCR có thể đọc dấu
 * phẩy thành dấu chấm và ngược lại). Chỉ áp cho số từ 6 chữ số phần nguyên (X, Y) để không đụng giây "06.660".
 */
function thousands(text: string, before: string, whole: string, fraction: string | undefined): string {
  const digits = whole.replace(/[.,]/g, "");
  return digits.length >= 6 ? `${before}${digits}${fraction ? `.${fraction}` : ""}` : text;
}

function tokens(text: string): Token[] {
  const list: Token[] = [];
  const pattern = /\d+(?:\.\d+)?/g;
  let end = 0;
  for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
    list.push({ text: match[0], index: match.index, gap: text.slice(end, match.index) });
    end = match.index + match[0].length;
  }
  return list;
}

const inRange = (value: number, [min, max]: [number, number]) => value >= min && value <= max;
const isDigit = (char: string | undefined) => !!char && char >= "0" && char <= "9";
const fractionOf = (digits: string) => (digits ? Number(`0.${digits}`) : 0);

/** Sau độ hoặc phút: ký hiệu đọc được (đã thành khoảng trắng), mất hẳn, hoặc đọc thành một chữ số. */
function separators(text: string, at: number): [number, number][] {
  if (text[at] === " " || text[at] === ".") return [[1, 0]];
  return isDigit(text[at]) ? [[0, 1], [1, 0.5]] : [];
}

/** Phần lẻ của giây: ".60", " 60" (dấu chấm thành khoảng trắng), "60" (mất dấu chấm) hoặc không có. */
function decimals(text: string, at: number): [number, number, number][] {
  const run = (from: number) => {
    let to = from;
    while (isDigit(text[to])) to += 1;
    return text.slice(from, to);
  };
  const options: [number, number, number][] = [[0, 0, 0.2]];
  if (text[at] === ".") {
    const digits = run(at + 1);
    if (digits) options.push([1 + digits.length, fractionOf(digits), 0]);
  }
  if (text[at] === " ") {
    const digits = run(at + 1);
    if (digits.length >= 1 && digits.length <= 2) options.push([1 + digits.length, fractionOf(digits), 0.3]);
  }
  if (isDigit(text[at])) {
    for (const length of [1, 2]) {
      const digits = text.slice(at, at + length);
      if (/^\d+$/.test(digits)) options.push([length, fractionOf(digits), 0.3]);
    }
  }
  return options;
}

/** Mọi cách hiểu một giá trị độ-phút-giây bắt đầu từ `from` (bỏ qua khoảng trắng và tối đa một chữ số rác ở đầu). */
function dmsReadings(text: string, from: number, degrees: [number, number]): Reading[] {
  const width = degrees[1] >= 100 ? 3 : 2;
  const result: Reading[] = [];
  let start = from;
  while (text[start] === " ") start += 1;
  for (const junk of [0, 1]) {
    if (junk && !isDigit(text[start])) continue;
    const at = start + junk;
    const degree = text.slice(at, at + width);
    if (!/^\d+$/.test(degree) || degree.length < width || !inRange(Number(degree), degrees)) continue;
    for (const [skip1, cost1] of separators(text, at + width)) {
      const minuteAt = at + width + skip1;
      const minute = text.slice(minuteAt, minuteAt + 2);
      if (!/^\d\d$/.test(minute) || Number(minute) >= 60) continue;
      for (const [skip2, cost2] of separators(text, minuteAt + 2)) {
        const secondAt = minuteAt + 2 + skip2;
        const second = text.slice(secondAt, secondAt + 2);
        if (!/^\d\d$/.test(second) || Number(second) >= 60) continue;
        for (const [length, fraction, cost3] of decimals(text, secondAt + 2)) {
          result.push({
            value: Number(degree) + Number(minute) / 60 + (Number(second) + fraction) / 3600,
            end: secondAt + 2 + length,
            cost: junk * 2 + cost1 + cost2 + cost3,
          });
        }
      }
    }
  }
  return result;
}

/** Các cặp vĩ độ, kinh độ đọc được trong đoạn chữ; chữ số còn thừa ở cuối làm tăng `cost`. */
function latLonReadings(text: string): { latitude: number; longitude: number; cost: number }[] {
  const result: { latitude: number; longitude: number; cost: number }[] = [];
  for (const latitude of dmsReadings(text, 0, LAT_DEGREES)) {
    for (const longitude of dmsReadings(text, latitude.end, LON_DEGREES)) {
      const leftover = text.slice(longitude.end).replace(/\D/g, "").length;
      result.push({ latitude: latitude.value, longitude: longitude.value, cost: latitude.cost + longitude.cost + leftover });
    }
  }
  return result;
}

/**
 * Các cách hiểu một số X hoặc Y (m): phần nguyên `lengths` chữ số, có thể thêm một chữ số rác ở đầu; phần lẻ sau dấu chấm,
 * sau khoảng trắng hoặc dính liền vì mất dấu chấm.
 */
function gridReadings(token: Token, next: Token | undefined, lengths: number[], range: [number, number]): Reading[] {
  const [whole, dotted = ""] = token.text.split(".");
  const loose = !dotted && next && /^\s{1,3}$/.test(next.gap) && /^\d{1,2}$/.test(next.text) ? next.text : "";
  const result: Reading[] = [];
  for (const length of lengths) {
    for (const junk of [0, 1]) {
      if (whole.length < junk + length) continue;
      const extra = whole.slice(junk + length);
      if (extra.length > 2) continue;
      const value = Number(whole.slice(junk, junk + length)) + fractionOf(extra || dotted || loose);
      if (inRange(value, range)) result.push({ value, end: token.index, cost: junk * 2 + (extra ? 0.3 : 0) });
    }
  }
  return result;
}

/** Một cách hiểu phần X, Y ở cuối dòng; ô không đọc được là null. `start` là vị trí bắt đầu của phần này trong dòng. */
type Grid = { x: number | null; y: number | null; cost: number };
type GridGuess = { start: number; grids: Grid[] };

/**
 * Các giả thuyết về phần X, Y ở cuối dòng, theo thứ tự ưu tiên: hai nhóm số dài cuối cùng là X rồi Y; chỉ còn X hoặc chỉ còn
 * Y (OCR bỏ mất một cột); không có X, Y. Kinh độ dính liền ("10753041") cũng là số dài, nên phải thử cả các giả thuyết sau.
 */
function gridGuesses(list: Token[], length: number): GridGuess[] {
  const big = list.map((token, index) => ({ token, index })).filter(({ token }) => token.text.split(".")[0].length >= 6);
  const guesses: GridGuess[] = [];
  if (big.length >= 2) {
    const [first, second] = big.slice(-2);
    const ys = gridReadings(second.token, list[second.index + 1], [6], Y_RANGE);
    const grids: Grid[] = [];
    gridReadings(first.token, list[first.index + 1], [7, 6], X_RANGE).forEach((x) => ys.forEach((y) => grids.push({ x: x.value, y: y.value, cost: x.cost + y.cost })));
    if (grids.length > 0) guesses.push({ start: first.token.index, grids });
  }
  if (big.length >= 1) {
    const last = big[big.length - 1];
    const next = list[last.index + 1];
    const grids: Grid[] = [
      ...gridReadings(last.token, next, [7, 6], X_RANGE).map((x) => ({ x: x.value, y: null, cost: x.cost + 1 })),
      ...gridReadings(last.token, next, [6], Y_RANGE).map((y) => ({ x: null, y: y.value, cost: y.cost + 1 })),
    ];
    if (grids.length > 0) guesses.push({ start: last.token.index, grids });
  }
  guesses.push({ start: length, grids: [] });
  return guesses;
}

/** Khoảng lệch (m) giữa vĩ/kinh độ và X, Y; chỉ có X hoặc Y thì so riêng ô đó (X kiểm vĩ độ, Y kiểm kinh độ là chính). */
function gridGap(point: { latitude: number; longitude: number }, grid: Grid, centralMeridian: number): number {
  const projected = vn2000ToGrid(point, centralMeridian);
  const dx = grid.x === null ? 0 : projected.x - grid.x;
  const dy = grid.y === null ? 0 : projected.y - grid.y;
  return Math.hypot(dx, dy);
}

/**
 * Tên điểm ở đầu dòng: một chữ cái rồi số, ví dụ A1, B12 ("AI", "Al", "|B4", "lA2" là đọc nhầm). Đường kẻ ô bên trái đôi khi
 * thành một chữ số rác đứng riêng trước tên ("7 K2", "1 K3").
 */
function label(line: string): { label: string; rest: string } {
  const match = line.match(/^[^A-Z0-9]*(?:\d\s+)?[|IL[\]()]?([A-Z])\s?([0-9IL|]{1,3})(?![\d.°'"A-Z])/);
  if (!match || !/^[0-9IL|]*\d|^[IL|]$/.test(match[2])) return { label: "", rest: line };
  return { label: `${match[1]}${match[2].replace(/[IL|]/g, "1")}`, rest: line.slice((match.index ?? 0) + match[0].length) };
}

function cheapest<T extends { cost: number }>(items: T[]): T | undefined {
  return items.reduce<T | undefined>((best, item) => (!best || item.cost < best.cost ? item : best), undefined);
}

/**
 * Một dòng của bảng; null khi dòng không có tọa độ nào. Thử mọi cách hiểu vĩ/kinh độ và X, Y rồi chọn cặp chỉ cùng một chỗ
 * (lệch không quá 3 m). Không cặp nào khớp thì lấy cách hiểu ít phải đoán nhất; màn hình sẽ báo "lệch" để người dùng sửa.
 */
export function readCornerLine(raw: string, centralMeridian = DEFAULT_CENTRAL_MERIDIAN): CornerReading | null {
  const { label: name, rest } = label(normalize(raw));
  const guesses = gridGuesses(tokens(rest), rest.length).map((guess) => ({
    ...guess,
    // Đoạn vĩ/kinh độ nằm trước X, Y: chỉ giữ chữ số, dấu chấm giữa hai chữ số, khoảng trắng thay cho mọi ký hiệu.
    geographic: latLonReadings(
      rest.slice(0, guess.start).replace(/[^\d.]+/g, " ").replace(/\.(?!\d)/g, " ").replace(/(^|[^\d])\./g, "$1 ").replace(/\s+/g, " ").trim(),
    ),
  }));
  // Giả thuyết đầu tiên có cặp khớp (lệch không quá 3 m) thắng; trong đó chọn cặp ít phải đoán nhất.
  for (const guess of guesses) {
    let best: { geo: (typeof guess.geographic)[number]; grid: Grid; score: number } | null = null;
    for (const geo of guess.geographic) {
      for (const grid of guess.grids) {
        const gap = gridGap(geo, grid, centralMeridian);
        const score = gap + geo.cost + grid.cost;
        if (gap <= MATCH_M && (!best || score < best.score)) best = { geo, grid, score };
      }
    }
    if (best) return { label: name, latitude: best.geo.latitude, longitude: best.geo.longitude, x: best.grid.x, y: best.grid.y };
  }
  // Không khớp được: giả thuyết đầu tiên đặt được điểm (có vĩ/kinh độ hoặc đủ X, Y), mỗi ô lấy cách hiểu ít phải đoán nhất.
  // Dòng chỉ có một số lẻ (OCR tách một cột ra riêng) không đặt được điểm nào nên bỏ.
  for (const guess of guesses) {
    const geo = cheapest(guess.geographic);
    const grid = cheapest(guess.grids.filter((item) => item.x !== null && item.y !== null));
    if (geo || grid) return { label: name, latitude: geo?.latitude ?? null, longitude: geo?.longitude ?? null, x: grid?.x ?? null, y: grid?.y ?? null };
  }
  return null;
}

/** Kinh tuyến trục ghi ở đầu bảng ("kinh tuyến trục 107°45'"), độ thập phân. */
function centralMeridian(line: string): number | null {
  const match = line.match(/KINH TUYEN TRUC\D{0,4}(\d+)\s*[°*']?\s*(\S{0,2})/);
  if (!match) return null;
  // "107°45'" → 107 và 45; "105°," → 105 và 0; ° mất hoặc đọc thành một chữ số: "10745", "107945". Phút bị nhòe ("107°4$'")
  // thì bỏ qua để dùng kinh tuyến trục mặc định, không đoán là 0 phút.
  const tail = match[2];
  const minutes = match[1].length === 3 ? (/^\d\d/.test(tail) ? tail.slice(0, 2) : /^\d/.test(tail) ? "" : "0") : match[1].length === 5 || match[1].length === 6 ? match[1].slice(-2) : "";
  const value = Number(match[1].slice(0, 3)) + Number(minutes) / 60;
  return minutes && Number(minutes) < 60 && inRange(value, [102, 110]) ? value : null;
}

/** Dòng tiêu đề "Tọa độ các điểm góc khu 1" mở một khu; dòng "Diện tích khu 1" ở chú thích thì không. */
function heading(line: string): string | null {
  const match = line.match(/\bKHU\s*(?:SO\s*)?([0-9IL|]{1,2})\b/);
  if (!match || /DIEN TICH/.test(line)) return null;
  if (!/TOA|GOC|DIEM/.test(line) && line.replace(/[^A-Z0-9]/g, "").length > 6) return null;
  return `Khu ${match[1].replace(/[IL|]/g, "1")}`;
}

/**
 * Điểm mất tên nằm sau một điểm có tên được đặt theo số liền sau (A2, ?, A4 → A3). Sau đó xếp theo số thứ tự khi mọi điểm
 * cùng một chữ cái; tên lạ thì giữ thứ tự dòng trên giấy.
 */
function ordered(corners: CornerReading[]): CornerReading[] {
  // Lấy tên vừa đặt của dòng trước, nên hai dòng mất tên liền nhau vẫn nối được (K1, ?, ? → K2, K3).
  const named = corners.reduce<CornerReading[]>((result, corner) => {
    const before = result[result.length - 1]?.label.match(/^([A-Z])(\d+)$/);
    result.push(corner.label || !before ? corner : { ...corner, label: `${before[1]}${Number(before[2]) + 1}` });
    return result;
  }, []);
  const parts = named.map((corner) => corner.label.match(/^([A-Z])(\d+)$/));
  if (parts.some((part) => !part) || new Set(parts.map((part) => part?.[1])).size > 1) return named;
  return named.map((corner, index) => ({ corner, number: Number(parts[index]?.[2]) })).sort((a, b) => a.number - b.number).map(({ corner }) => corner);
}

const filled = (corner: CornerReading) => [corner.latitude, corner.longitude, corner.x, corner.y].filter((value) => value !== null).length;

/**
 * Cả bảng: dòng "… góc khu N" mở một khu mới; không có dòng đó thì gom theo chữ cái của tên điểm (A…, B…). Điểm trùng
 * tên giữ dòng đọc được nhiều ô hơn.
 */
export function extractCornerTable(text: string): { areas: AreaReading[]; centralMeridian: number | null } {
  const groups = new Map<string, { name: string; corners: CornerReading[] }>();
  let meridian: number | null = null;
  let current: string | null = null;
  let lastKey = "";
  for (const raw of text.split(/\r?\n/)) {
    const line = normalize(raw);
    meridian = meridian ?? centralMeridian(line);
    const title = heading(line);
    if (title) {
      current = title;
      continue;
    }
    const corner = readCornerLine(raw, meridian ?? DEFAULT_CENTRAL_MERIDIAN);
    if (!corner) continue;
    // Không có tiêu đề khu: gom theo chữ cái; dòng mất tên đi theo nhóm của dòng ngay trước.
    const key = current ?? (corner.label ? `letter:${corner.label.replace(/\d+$/, "")}` : lastKey || "letter:");
    lastKey = key;
    const group = groups.get(key) ?? { name: current ?? "", corners: [] };
    const same = corner.label ? group.corners.findIndex((other) => other.label === corner.label) : -1;
    if (same < 0) group.corners.push(corner);
    else if (filled(corner) > filled(group.corners[same])) group.corners[same] = corner;
    groups.set(key, group);
  }
  const areas = [...groups.values()].map((group, index) => ({ name: group.name || `Khu ${index + 1}`, corners: ordered(group.corners) }));
  return { areas, centralMeridian: meridian };
}
