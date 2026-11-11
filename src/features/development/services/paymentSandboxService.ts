import type { CreatedSandboxOrder, SandboxOrder } from "@/features/development/models/PaymentSandbox";

import { PAYMENT_SANDBOX_URL } from "@/constants/env";

/** Gọi server thử thanh toán. Lỗi trả về chữ để hiện nguyên trên màn thử, giúp đọc được nguyên nhân khi chạy trên điện thoại. */
async function call<T>(path: string, body?: unknown): Promise<T> {
  if (!PAYMENT_SANDBOX_URL) throw new Error("Chưa đặt VITE_PAYMENT_SANDBOX_URL.");
  let response: Response;
  try {
    response = await fetch(PAYMENT_SANDBOX_URL + path, {
      method: body === undefined ? "GET" : "POST",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error("Không kết nối được server thử thanh toán.");
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`Server thử trả ${response.status}: ${JSON.stringify(data)}`);
  return data as T;
}

export const createSandboxOrder = (amount: number) => call<CreatedSandboxOrder>("/orders", { amount });

export const linkSandboxOrder = (id: string, zaloOrderId: string, method?: string) => call<SandboxOrder>(`/orders/${id}/link`, { zaloOrderId, method });

export const getSandboxOrder = (id: string) => call<SandboxOrder>(`/orders/${id}`);
