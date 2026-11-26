import type { AreaDraft, CornerDraft, CornerTableReading } from "@/features/farming/models/ZoneBoundary";
import { useMemo, useState } from "react";

import { DEFAULT_CENTRAL_MERIDIAN, dmsText, parseDms } from "@/features/farming/utils/vn2000";
import { areaDraft, areaPositions, boundaryOf, checkCorner, cornerDraft, emptyCorner, ringAreaHa, selfIntersects, strayCorners } from "@/features/farming/utils/zoneBoundary";

/** Kinh tuyến trục hiển thị "107°45'". */
const meridianText = (value: number) => dmsText(value).replace(/'00\.00"$/, "'");

/** Điều backend từ chối khi lưu ranh giới: điểm chưa có số, khu quá ít hoặc quá nhiều điểm, hai điểm trùng một chỗ, quá nhiều khu. */
function blockingProblem(areas: AreaDraft[], meridian: number): string {
  if (areas.length > 10) return "Một vùng có tối đa 10 khu. Bỏ bớt các khu không thuộc vùng này.";
  for (const area of areas) {
    const name = area.name.trim() || "Khu chưa đặt tên";
    const bad = area.corners.findIndex((corner) => {
      const state = checkCorner(corner, meridian).state;
      return state === "missing" || state === "outside";
    });
    if (bad >= 0) return `${name}: điểm ${area.corners[bad].label || bad + 1} chưa có tọa độ hợp lệ. Sửa hoặc xóa điểm này.`;
    const placed = areaPositions(area, meridian);
    if (placed.length < 3) return `${name} cần ít nhất 3 điểm góc.`;
    if (placed.length > 100) return `${name} có quá 100 điểm góc.`;
    // Backend làm tròn 6 chữ số thập phân (khoảng 0,1 m) rồi mới so trùng.
    const seen = new Map<string, string>();
    for (const [index, { label, position }] of placed.entries()) {
      const spot = `${position.latitude.toFixed(6)},${position.longitude.toFixed(6)}`;
      const twin = seen.get(spot);
      if (twin !== undefined) return `${name}: điểm ${label || index + 1} trùng vị trí với điểm ${twin}. Xóa một trong hai điểm.`;
      seen.set(spot, label || String(index + 1));
    }
  }
  return "";
}

/**
 * Các khu và điểm góc đang đối chiếu của một ranh giới vùng, dùng chung cho màn ranh giới của vùng đã có và bước sơ đồ khi
 * thêm vùng: kinh tuyến trục, nhập tay, nhận kết quả đọc ảnh, rồi kiểm tra trước khi lưu. Chưa lưu hay gọi gì lên máy chủ.
 * Lệch X, Y, chưa đối chiếu và đường tự cắt chỉ hỏi lại (`concerns`); lỗi chặn lưu nằm ở `blocking`.
 */
export function useBoundaryDraft(initial: () => AreaDraft[]) {
  const [meridian, setMeridian] = useState(DEFAULT_CENTRAL_MERIDIAN);
  const [meridianInput, setMeridianInput] = useState(meridianText(DEFAULT_CENTRAL_MERIDIAN));
  const [areas, setAreas] = useState<AreaDraft[]>(initial);
  const [editing, setEditing] = useState<{ area: string; corner: CornerDraft } | null>(null);

  const boundary = useMemo(() => boundaryOf(areas, meridian), [areas, meridian]);
  const totalHa = useMemo(() => areas.reduce((sum, area) => {
    const positions = areaPositions(area, meridian).map(({ position }) => position);
    return positions.length >= 3 ? sum + ringAreaHa(positions) : sum;
  }, 0), [areas, meridian]);
  const concerns = useMemo(() => {
    const count = (states: string[]) => areas.reduce((sum, area) => sum + area.corners.filter((corner) => states.includes(checkCorner(corner, meridian).state)).length, 0);
    return {
      doubts: count(["mismatch"]),
      unchecked: count(["dmsOnly", "gridOnly"]),
      strays: areas.reduce((sum, area) => sum + strayCorners(area, meridian).size, 0),
      crossing: areas.filter((area) => selfIntersects(areaPositions(area, meridian).map(({ position }) => position))).map((area) => area.name.trim() || "Khu chưa đặt tên"),
    };
  }, [areas, meridian]);

  const updateArea = (key: string, change: (area: AreaDraft) => AreaDraft) => setAreas((current) => current.map((area) => (area.key === key ? change(area) : area)));

  /**
   * Đưa các khu đọc được vào danh sách: khu trùng tên thì thay điểm góc, khu mới thì thêm vào. Trả tên các khu và số điểm vừa
   * nhận, hoặc null khi ảnh không có dòng tọa độ nào (danh sách giữ nguyên, trừ kinh tuyến trục).
   */
  const applyReading = (result: Pick<CornerTableReading, "areas" | "centralMeridian">) => {
    if (result.centralMeridian !== null) {
      setMeridian(result.centralMeridian);
      setMeridianInput(meridianText(result.centralMeridian));
    }
    const found = result.areas.filter((area) => area.corners.length > 0);
    if (found.length === 0) return null;
    setAreas((current) => {
      const next = [...current];
      for (const area of found) {
        const corners = area.corners.map(cornerDraft);
        const same = next.findIndex((existing) => existing.name.trim().toLowerCase() === area.name.toLowerCase());
        if (same >= 0) next[same] = { ...next[same], corners };
        else next.push(areaDraft(area.name, corners));
      }
      return next;
    });
    return { names: found.map((area) => area.name), corners: found.reduce((sum, area) => sum + area.corners.length, 0) };
  };

  const addArea = () => {
    const corner = emptyCorner();
    const area = areaDraft(`Khu ${areas.length + 1}`, [corner]);
    setAreas((current) => [...current, area]);
    setEditing({ area: area.key, corner });
  };

  const addCorner = (area: AreaDraft) => {
    const corner = emptyCorner();
    updateArea(area.key, (current) => ({ ...current, corners: [...current.corners, corner] }));
    setEditing({ area: area.key, corner });
  };

  const changeMeridian = (text: string) => {
    setMeridianInput(text);
    const value = parseDms(text);
    if (value !== null && value >= 102 && value <= 110) setMeridian(value);
  };

  return {
    meridian,
    meridianInput,
    changeMeridian,
    areas,
    setAreas,
    updateArea,
    editing,
    setEditing,
    applyReading,
    addArea,
    addCorner,
    boundary,
    totalHa,
    concerns,
    blocking: () => blockingProblem(areas, meridian),
  };
}

export type BoundaryDraft = ReturnType<typeof useBoundaryDraft>;
