import { atom } from "jotai";
import { nativeStorage } from "zmp-sdk/apis";

/** Cỡ chữ của app. Mặc định đã là chữ lớn cho người lớn tuổi; "xlarge" phóng thêm khoảng 12%. */
export type TextSize = "large" | "xlarge";

export const TEXT_SIZES: { key: TextSize; label: string; hint: string }[] = [
  { key: "large", label: "Chữ lớn", hint: "Mặc định, vừa đủ cho hầu hết mọi người" },
  { key: "xlarge", label: "Chữ rất lớn", hint: "Dễ đọc hơn nếu mắt kém, trang sẽ dài hơn" },
];

const STORAGE_KEY = "textSize";

/**
 * Lưu bằng nativeStorage vì Zalo Mini App không có localStorage.
 * Quyền native storage phải được Zalo duyệt; chưa duyệt thì lệnh sẽ lỗi,
 * khi đó chỉ giữ lựa chọn trong lần mở app hiện tại.
 */
function readSaved(): TextSize {
  try {
    return nativeStorage.getItem(STORAGE_KEY) === "xlarge" ? "xlarge" : "large";
  } catch {
    return "large";
  }
}

const savedAtom = atom<TextSize>(readSaved());

export const textSizeAtom = atom(
  (get) => get(savedAtom),
  (_get, set, value: TextSize) => {
    set(savedAtom, value);
    try {
      nativeStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Chưa được cấp quyền: bỏ qua, lựa chọn vẫn áp dụng cho phiên này.
    }
  },
);
