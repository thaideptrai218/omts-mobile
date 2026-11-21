/** Một ngân hàng trong danh sách chọn (`GET api/banks`, theo danh sách của VietQR). */
export type Bank = {
  bin: string;
  shortName: string;
  name: string;
};

/** Tài khoản nhận tiền của HTX; `bankName` là tên ngắn của ngân hàng, `acceptedAt` lúc dịch vụ báo nhận tiền chấp nhận. */
export type ReceivingBankAccountDetails = {
  bankBin: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  acceptedAt: string;
};

/** `GET api/cooperative/receiving-bank-account`: `account` null khi chưa đặt; `rowVersion` gửi kèm khi lưu. */
export type ReceivingBankAccountView = {
  account: ReceivingBankAccountDetails | null;
  rowVersion: string;
};

/** Thân `PUT api/cooperative/receiving-bank-account`. `confirmAccount` là câu trả lời Có cho MSG-DEBT-01. */
export type SaveReceivingBankAccount = {
  bankBin: string;
  accountNumber: string;
  accountHolderName: string;
  confirmAccount: boolean;
  rowVersion: string;
};

export type ReceivingBankAccountSaved = {
  receivingBankAccount: ReceivingBankAccountView;
  message: string;
  messageCode: string;
};

/** Các ô của form đổi tài khoản nhận tiền, dạng chữ người dùng gõ. */
export type BankAccountDraft = {
  bankBin: string;
  accountNumber: string;
  accountHolderName: string;
};
