/** `GET api/trader-requests` (Chủ HTX): một yêu cầu tài khoản thương lái gửi từ Mini App. */
export type TraderRequestView = {
  accountId: string;
  displayName: string;
  phoneNumber: string | null;
  note: string | null;
  requestedAt: string | null;
  /** PENDING_APPROVAL, REJECTED, hoặc ACTIVE ngay sau khi duyệt. */
  status: string;
  rejectionReason: string | null;
};
