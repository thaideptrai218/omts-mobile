/** Loại yêu cầu của nhân viên (LABOR-10): nghỉ phép, quên giờ vào, quên giờ ra. */
export type EmployeeRequestType = "Leave" | "MissedCheckIn" | "MissedCheckOut";

/**
 * Một yêu cầu của nhân viên (`EmployeeRequestView`). Nghỉ phép: `from` đến `to` là các ngày nghỉ. Quên giờ: `from` và `to`
 * cùng là ngày đó, `requestedTime` ("HH:mm:ss", giờ HTX) là giờ cần ghi. `approved`: true đã duyệt, false bị từ chối, null khi
 * chờ duyệt hoặc đã hủy. `response` là lời nhắn của Chủ HTX. `statusId`: 3801 chờ duyệt, 3802 đã duyệt, 3803 từ chối,
 * 3804 đã hủy. `messageCode` chỉ có trong trả lời khi gửi: MSG-LABOR-22.
 */
export type EmployeeRequest = {
  id: string;
  employeeId: string;
  employeeName: string;
  type: EmployeeRequestType;
  from: string;
  to: string;
  requestedTime: string | null;
  reason: string;
  approved: boolean | null;
  response: string | null;
  rowVersion: string;
  cancelledAt: string | null;
  statusId: number;
  status: string;
  sentAt: string;
  reviewedAt: string | null;
  message?: string;
  messageCode?: string;
};

/**
 * LABOR-10.0: nghỉ phép gửi `from`, `to`; quên giờ vào hoặc ra gửi `day` (hôm nay hoặc trước đó) và `requestedTime` ("HH:mm").
 * Gửi lại cùng `clientOperationId` thì server trả yêu cầu đã lưu, không tạo bản thứ hai.
 */
export type SubmitEmployeeRequest = {
  type: EmployeeRequestType;
  from?: string;
  to?: string;
  day?: string;
  requestedTime?: string;
  reason: string;
  clientOperationId: string;
};

/**
 * LABOR-05: Chủ HTX duyệt hoặc từ chối (khi từ chối thì `response` bắt buộc). `jobTypeId`, `raftId`: khi duyệt quên giờ vào
 * của lao động thời vụ chưa có phân công ngày đó, là loại việc và bè của ngày đó (LABOR-05.3).
 */
export type ReviewEmployeeRequest = {
  approved: boolean;
  response: string | null;
  rowVersion: string;
  jobTypeId?: string;
  raftId?: string;
};
