/** Còn phải trả của một phiếu hoàn tất: phải trả (đã trừ giảm giá) − trả hàng − phần tiền trả đã tính vào phiếu, không âm. */
export function receiptRemaining(receipt: { payable: number; returned: number; paid: number }): number {
  return Math.max(0, receipt.payable - receipt.returned - receipt.paid);
}
