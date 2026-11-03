/** Thông báo hiện một lần (snackbar) sau khi điều hướng, ví dụ "Đã liên kết tài khoản" sau khi liên kết xong. */
export type FlashMessage = {
  text: string;
  type?: "success" | "warning" | "error" | "info";
  duration?: number;
};
