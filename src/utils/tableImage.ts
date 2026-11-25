import type { GrayImage } from "@/models/GrayImage";

/**
 * Làm sạch ảnh bảng số trước khi đưa cho tesseract. Thử trên bảng tọa độ in có kẻ ô (25/11/2026): ảnh chỉ nghiêng 0,7° hoặc
 * còn đường kẻ ô là tesseract bỏ gần hết các dòng; chỉnh nghiêng rồi xóa đường kẻ thì đọc được đủ các dòng.
 */

/** Ngưỡng Otsu tách chữ (tối) khỏi nền giấy (sáng). */
export function otsu({ data }: GrayImage): number {
  const histogram = new Array<number>(256).fill(0);
  for (let i = 0; i < data.length; i += 1) histogram[data[i]] += 1;
  const total = data.length;
  const sumAll = histogram.reduce((sum, count, value) => sum + count * value, 0);
  let weightBack = 0;
  let sumBack = 0;
  let best = 0;
  let threshold = 128;
  for (let value = 0; value < 256; value += 1) {
    weightBack += histogram[value];
    const weightFore = total - weightBack;
    if (weightBack === 0) continue;
    if (weightFore === 0) break;
    sumBack += value * histogram[value];
    const between = weightBack * weightFore * (sumBack / weightBack - (sumAll - sumBack) / weightFore) ** 2;
    if (between > best) { best = between; threshold = value; }
  }
  return threshold;
}

/**
 * Góc (độ) cần xoay theo chiều kim đồng hồ để các dòng nằm ngang, trong khoảng ±5°. Cách chiếu: xoay thử từng góc 0,1°,
 * góc đúng là góc mà điểm tối dồn vào ít hàng nhất (tổng bình phương số điểm tối của từng hàng lớn nhất).
 */
export function skewAngle(image: GrayImage, threshold: number): number {
  const { width, height, data } = image;
  const step = Math.max(1, Math.round(Math.max(width, height) / 800));
  const xs: number[] = [];
  const ys: number[] = [];
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      if (data[y * width + x] < threshold) { xs.push(x); ys.push(y); }
    }
  }
  if (xs.length < 50) return 0;
  // Mỗi ô đếm rộng đúng bằng bước lấy mẫu; ô hẹp hơn thì lưới lấy mẫu tự tạo đỉnh giả ở góc 0°.
  const offset = Math.ceil(width / step) + 1;
  const bins = new Float64Array(Math.ceil((height + 2 * width) / step) + 4);
  let bestScore = -1;
  let best = 0;
  for (let tenth = -50; tenth <= 50; tenth += 1) {
    const radians = (tenth / 10) * (Math.PI / 180);
    const sin = Math.sin(radians);
    const cos = Math.cos(radians);
    bins.fill(0);
    for (let i = 0; i < xs.length; i += 1) bins[Math.round((ys[i] * cos - xs[i] * sin) / step) + offset] += 1;
    let score = 0;
    for (let i = 0; i < bins.length; i += 1) score += bins[i] * bins[i];
    if (score > bestScore) { bestScore = score; best = tenth / 10; }
  }
  return -best;
}

/** Độ dài loạt điểm tối liên tiếp ở phân vị 95 theo một hướng: gần bằng cỡ chữ, vì nét chữ nhiều hơn hẳn đường kẻ. */
function runLengths(image: GrayImage, threshold: number, vertical: boolean): number[] {
  const { width, height, data } = image;
  const runs: number[] = [];
  const outer = vertical ? width : height;
  const inner = vertical ? height : width;
  for (let a = 0; a < outer; a += 1) {
    let run = 0;
    for (let b = 0; b <= inner; b += 1) {
      const dark = b < inner && data[vertical ? b * width + a : a * width + b] < threshold;
      if (dark) run += 1;
      else if (run > 0) { runs.push(run); run = 0; }
    }
  }
  return runs;
}

function percentile95(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * 0.95)];
}

/**
 * Xóa (tô trắng) đường kẻ ô: loạt điểm tối ngang hoặc dọc dài hơn hẳn chữ (gấp 3 lần cỡ chữ ước lượng) và dài ít nhất 1/12
 * cạnh ảnh, để không xóa nhầm các chữ dính liền nhau trong một từ. Sửa trực tiếp trên ảnh.
 */
export function removeLines(image: GrayImage, threshold: number): void {
  const { width, height, data } = image;
  const source = data.slice();
  const limitH = Math.max(40, Math.round(width / 12), 3 * percentile95(runLengths(image, threshold, false)));
  const limitV = Math.max(40, Math.round(height / 12), 3 * percentile95(runLengths(image, threshold, true)));
  const erase = (vertical: boolean, limit: number) => {
    const outer = vertical ? width : height;
    const inner = vertical ? height : width;
    for (let a = 0; a < outer; a += 1) {
      let run = 0;
      for (let b = 0; b <= inner; b += 1) {
        const dark = b < inner && source[vertical ? b * width + a : a * width + b] < threshold;
        if (dark) { run += 1; continue; }
        if (run >= limit) for (let k = b - run; k < b; k += 1) data[vertical ? k * width + a : a * width + k] = 255;
        run = 0;
      }
    }
  };
  erase(false, limitH);
  erase(true, limitV);
}
