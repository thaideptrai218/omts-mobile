import { atom } from "jotai";

/** Số thông báo chưa đọc của tài khoản đang liên kết, cho huy hiệu trên chuông; 0 khi chưa liên kết. */
export const unreadCountAtom = atom(0);
