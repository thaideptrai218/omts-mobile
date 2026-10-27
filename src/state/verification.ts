import { atom } from "jotai";

import type { VerificationChannel, VerificationStarted } from "@/services/acs/types";

export type VerificationPurpose =
  | "Registration"
  | "AccountRecovery"
  | "VerifyPhone"
  | "VerifyEmail"
  | "ChangePhone"
  | "ChangeEmail"
  | "ChangePassword";

/** Hàm điều hướng của ZaUI, truyền vào callback để luồng gọi tự đi tiếp sau khi xác minh xong. */
export type Navigate = (to: string, options?: { replace?: boolean; animate?: boolean; state?: unknown }) => void;

/**
 * Yêu cầu xác minh đang chờ nhập mã (ACS-06). Luồng gọi (đăng ký, khôi phục, cổng số điện thoại, đổi
 * liên hệ, đổi mật khẩu bằng email) đặt vào atom này rồi mở `/verify`; màn xác minh dùng chung đọc ra.
 * Giữ trong bộ nhớ, không lưu xuống máy vì có chứa dữ liệu nhập dở (mật khẩu lúc đăng ký).
 */
export type PendingVerification = {
  purpose: VerificationPurpose;
  channel: VerificationChannel;
  /** Nơi nhận đã che: 09******89 hoặc n***@mail.com. */
  maskedTarget: string;
  verificationId: string;
  /** Thời điểm gửi mã gần nhất theo đồng hồ máy; đếm ngược 60 giây tính từ đây. */
  sentAt: number;
  /** Số lần còn được gửi lại (server trả); 0 thì ẩn nút gửi lại. */
  sendsLeft: number;
  /** Dòng thông báo kèm theo (MSG15, MSG62…) hiện trên màn xác minh. */
  notice?: string;
  /** Gửi mã mới; trả về yêu cầu mới (id có thể đổi, ví dụ khôi phục mật khẩu gọi lại bước 1). */
  resend: () => Promise<VerificationStarted>;
  /** Bước tiếp theo khi mã đúng; tự điều hướng. Lỗi ném ra sẽ hiện trên màn xác minh. */
  onVerified: (verificationToken: string, navigate: Navigate) => Promise<void>;
  /** Đường dẫn của "Đổi cách nhận mã" (khôi phục mật khẩu). */
  changeMethodTo?: string;
};

export const pendingVerificationAtom = atom<PendingVerification | null>(null);

/** Token xác minh dành cho đổi mật khẩu bằng mã email (ACS-04), đặt bởi màn xác minh, đọc bởi màn đổi mật khẩu. */
export const passwordCodeTokenAtom = atom<string | null>(null);

/** Token xác minh của khôi phục mật khẩu (ACS-03) cho bước đặt mật khẩu mới. */
export const recoveryTokenAtom = atom<string | null>(null);
