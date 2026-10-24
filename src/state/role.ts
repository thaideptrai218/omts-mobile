import { atom } from "jotai";

import type { RoleKey } from "@/data/roles";

/**
 * Vai trò đang xem. Hiện chỉ dùng để xem thử giao diện từng role.
 * Khi có đăng nhập, giá trị này lấy từ quyền của tài khoản do backend trả về.
 * Không lưu vào localStorage vì Zalo Mini App không hỗ trợ.
 */
export const roleAtom = atom<RoleKey>("owner");
