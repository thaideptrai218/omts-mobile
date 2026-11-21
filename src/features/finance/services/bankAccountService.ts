import type { Bank, ReceivingBankAccountSaved, ReceivingBankAccountView, SaveReceivingBankAccount } from "@/features/finance/models/ReceivingBankAccount";

import { api } from "@/services/httpClient";

/** DEBT-01 bước 2: danh sách ngân hàng của form (chỉ Chủ HTX). */
export function listBanks() {
  return api<Bank[]>("/api/banks");
}

export function getReceivingBankAccount() {
  return api<ReceivingBankAccountView>("/api/cooperative/receiving-bank-account");
}

/**
 * DEBT-01 bước 3-7: máy chủ hỏi dịch vụ báo nhận tiền có chấp nhận tài khoản không (MSG-DEBT-02 khi không), rồi trả 409
 * MSG-DEBT-01 để hỏi lại; gửi lại cùng nội dung với `confirmAccount` thì mới lưu.
 */
export function saveReceivingBankAccount(body: SaveReceivingBankAccount) {
  return api<ReceivingBankAccountSaved>("/api/cooperative/receiving-bank-account", { method: "PUT", body });
}
