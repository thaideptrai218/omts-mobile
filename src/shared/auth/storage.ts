import { nativeStorage } from "zmp-sdk/apis";

/**
 * Lưu trữ bền trên máy. Zalo Mini App không có localStorage nên dùng `nativeStorage`; quyền này phải
 * được Zalo duyệt, chưa duyệt thì mọi lệnh ném lỗi và app chỉ giữ dữ liệu trong bộ nhớ (CLAUDE.md mục 5, 7).
 */
export function readJson<T>(key: string): T | null {
  try {
    const raw = nativeStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown) {
  try {
    nativeStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Chưa được cấp quyền native storage: bỏ qua, dữ liệu vẫn còn trong bộ nhớ của lần mở app này.
  }
}

export function removeKey(key: string) {
  try {
    nativeStorage.removeItem(key);
  } catch {
    // Không có gì để xóa hoặc chưa được cấp quyền.
  }
}
