import type { CheckoutOrderParams } from "@/models/Zalo";

/** Đơn của server thử thanh toán (`payment-sandbox`), không gắn hóa đơn OMTS. */
export type SandboxOrder = {
  id: string;
  code: string;
  amount: number;
  status: "PENDING" | "PAID" | "EXPIRED";
  expiresAt: string;
  zaloOrderId: string | null;
  paidAt: string | null;
  zaloReport: {
    err: number | null;
    msg: string | null;
  } | null;
  qr: {
    content: string;
    bankBin: string;
    accountNumber: string;
    accountName: string;
    description: string;
  };
};

export type CreatedSandboxOrder = {
  order: SandboxOrder;
  /** null khi server chưa có phương thức riêng: màn thử chỉ kiểm tra phần payOS. */
  checkout: CheckoutOrderParams | null;
};

export type SandboxLogLine = {
  at: string;
  text: string;
};
