import type { AuditActor, AuditChange, AuditValue } from "@/features/audit/models/AuditEvent";
import { date, dateTime, num } from "@/utils/format";

/** Tên tiếng Việt của loại bản ghi (tên entity của backend, xem `RelatedRecordTypes`). Loại chưa có tên thì tách chữ tiếng Anh. */
const RECORD_TYPE: Record<string, string> = {
  AccessGrant: "Vai trò theo vùng",
  Account: "Tài khoản",
  Attendance: "Chấm công",
  AttendanceSettings: "Cài đặt chấm công",
  AttendanceSettingsVersion: "Cài đặt chấm công",
  CashAccount: "Tài khoản quỹ",
  CashParty: "Đối tượng thu chi",
  CashVoucher: "Phiếu thu chi",
  CashVoucherType: "Loại phiếu thu chi",
  Cooperative: "Hồ sơ HTX",
  CooperativeCertification: "Chứng nhận của HTX",
  CultivationCycle: "Chu kỳ nuôi",
  CultivationLog: "Nhật ký nuôi",
  Customer: "Khách hàng",
  CustomerDebtAdjustment: "Điều chỉnh công nợ khách hàng",
  CustomerPayment: "Phiếu thu của khách hàng",
  Development: "Bản thử nghiệm",
  Employee: "Nhân viên",
  EmployeeRequest: "Yêu cầu của nhân viên",
  FarmingInputItem: "Vật tư",
  FarmingZone: "Vùng nuôi",
  HarvestLot: "Lô thu hoạch",
  InputIssue: "Phiếu xuất vật tư",
  InputIssueType: "Loại phiếu xuất vật tư",
  InputItemGroup: "Nhóm hàng",
  InputUnit: "Đơn vị tính",
  JobType: "Loại công việc",
  MaterialUsage: "Vật tư sử dụng",
  Payroll: "Bảng lương",
  PayrollSettings: "Cài đặt lương",
  PortWeighing: "Phiếu cân tại cảng",
  Product: "Sản phẩm",
  PurchaseReceipt: "Phiếu nhập hàng",
  PurchaseRequest: "Đơn đặt mua",
  PurchaseReturn: "Phiếu trả hàng",
  PurchaseShift: "Ca thu mua",
  PurchaseShiftInvitation: "Lời mời ca thu mua",
  PushDevice: "Thiết bị nhận thông báo",
  QualityClaim: "Khiếu nại chất lượng",
  Raft: "Bè",
  Role: "Vai trò",
  SalesInvoice: "Hóa đơn bán",
  SeedingRecord: "Phiên thả giống",
  Supplier: "Nhà cung cấp",
  SupplierPayment: "Phiếu chi nhà cung cấp",
  WagePayment: "Phiếu trả lương",
  WaterMeasurement: "Chỉ số nước",
  WaterThreshold: "Ngưỡng nước",
  WorkAssignment: "Phân công",
  WorkDayPlan: "Kế hoạch ngày làm",
  ZoneLicense: "Giấy tờ vùng nuôi",
};

/** Động từ của phần sau dấu chấm trong mã thao tác ("Raft.Updated" → "Sửa bè"). */
const VERB: Record<string, string> = {
  Accepted: "Chấp nhận",
  Approved: "Duyệt",
  Cancelled: "Hủy",
  Changed: "Đổi",
  Closed: "Đóng",
  Confirmed: "Xác nhận",
  Corrected: "Điều chỉnh",
  Created: "Tạo",
  Deactivated: "Ngừng dùng",
  Declined: "Từ chối",
  Deleted: "Xóa",
  Discontinued: "Ngừng dùng",
  Edited: "Sửa",
  Finalized: "Chốt",
  Granted: "Cấp",
  Hidden: "Ẩn",
  Locked: "Khóa",
  Merged: "Gộp",
  Moved: "Chuyển",
  Published: "Công bố",
  RateChanged: "Đổi tiền công",
  Reactivated: "Dùng lại",
  Recorded: "Ghi",
  Registered: "Đăng ký",
  Rejected: "Từ chối",
  Reloaded: "Tải lại",
  Removed: "Xóa",
  Renamed: "Đổi tên",
  Reopened: "Mở lại",
  Reordered: "Sắp xếp lại",
  Replaced: "Thay",
  Republished: "Công bố lại",
  Responded: "Phản hồi",
  Resumed: "Dùng lại",
  Revoked: "Thu hồi",
  Sent: "Gửi",
  Started: "Bắt đầu",
  StatusChanged: "Đổi trạng thái",
  Submitted: "Gửi",
  TraceCorrected: "Sửa thông tin truy xuất",
  Unlocked: "Mở khóa",
  Updated: "Sửa",
  Voided: "Hủy",
  Withdrawn: "Thu hồi",
};

/** Thao tác không ghép được từ động từ và loại bản ghi. */
const ACTION: Record<string, string> = {
  "AccessGrant.Granted": "Cấp vai trò theo vùng",
  "Account.AccessRequested": "Gửi yêu cầu tài khoản",
  "Account.ContactChanged": "Đổi thông tin liên hệ",
  "Account.OwnerRightsRefused": "Từ chối quyền Chủ HTX",
  "Account.PasswordChanged": "Đổi mật khẩu",
  "Account.PasswordReset": "Cấp lại mật khẩu",
  "Account.PhoneVerified": "Xác minh số điện thoại",
  "Account.ProfileUpdated": "Sửa hồ sơ cá nhân",
  "Account.ZaloLinked": "Liên kết tài khoản Zalo",
  "Account.ZaloUnlinked": "Gỡ liên kết Zalo",
  "Attendance.AppliedFromRequest": "Ghi chấm công theo yêu cầu",
  "Attendance.CheckedIn": "Ghi giờ vào ca",
  "Attendance.CheckedOut": "Ghi giờ ra ca",
  "Cooperative.CoverPhotoChanged": "Đổi ảnh bìa HTX",
  "Cooperative.CustomerSettingsChanged": "Đổi cài đặt khách hàng",
  "Cooperative.HarvestSettingsChanged": "Đổi cài đặt lô hàu",
  "Cooperative.InputInventorySettingsChanged": "Đổi cài đặt kho vật tư",
  "Cooperative.LogoChanged": "Đổi logo HTX",
  "Cooperative.ReceivingBankAccountChanged": "Đổi tài khoản nhận tiền",
  "CultivationCycle.SeedingCompleted": "Đánh dấu thả giống xong",
  "CustomerPayment.PendingTransferCreated": "Tạo phiếu thu chờ chuyển khoản",
  "CustomerPayment.TransferReceived": "Nhận tiền chuyển khoản",
  "Development.TestRoleSwitched": "Đổi vai trò thử nghiệm",
  "Employee.EmploymentEnded": "Cho nhân viên nghỉ việc",
  "Employee.EmploymentResumed": "Nhận nhân viên làm lại",
  "Employee.WorkingZoneAdded": "Thêm vùng làm việc cho nhân viên",
  "PurchaseRequest.HarvestDone": "Đánh dấu đã thu hoạch đơn đặt mua",
  "PurchaseRequest.HarvestDoneCleared": "Bỏ đánh dấu đã thu hoạch",
  "PurchaseRequest.StaffInvited": "Mời nhân viên vào ca thu mua",
  "Raft.LanesChanged": "Đổi bố trí hàng của bè",
  "Raft.PhotosChanged": "Đổi ảnh bè",
  "SalesInvoice.CodeUnused": "Bỏ mã hóa đơn chưa dùng",
  "SalesInvoice.SaleFinished": "Kết thúc bán",
  "SalesInvoice.SaleStopped": "Dừng bán",
  "WorkAssignment.JobChanged": "Đổi việc cho đội",
};

/** Tên trường trong giá trị trước và sau (PascalCase như backend lưu). Trường chưa có tên thì tách chữ tiếng Anh. */
const FIELD: Record<string, string> = {
  AcceptedCages: "Số lồng chấp nhận",
  AccountId: "Mã tài khoản",
  Address: "Địa chỉ",
  AgreedPickupDate: "Ngày nhận hàng đã hẹn",
  Amount: "Số tiền",
  Approved: "Đã duyệt",
  Area: "Diện tích",
  Assessment: "Đánh giá",
  AverageKgPerCage: "Kg trung bình mỗi lồng",
  BankReference: "Mã giao dịch ngân hàng",
  CageCount: "Số lồng",
  Cages: "Số lồng",
  CagesPerEmployeePerDay: "Số lồng mỗi người một ngày",
  CashAmount: "Số tiền mặt",
  Certificates: "Giấy chứng nhận",
  Channel: "Kênh gửi",
  CheckInAt: "Giờ vào ca",
  CheckOutAt: "Giờ ra ca",
  CheckedInAt: "Giờ vào ca",
  CheckedOutAt: "Giờ ra ca",
  CloseDate: "Ngày đóng",
  Code: "Mã",
  CollectedByAccountId: "Mã tài khoản người nhận tiền",
  ConditionNotes: "Ghi chú tình trạng",
  ConfirmedAt: "Thời điểm xác nhận",
  CostPrice: "Giá vốn",
  CoverPhotoUrl: "Ảnh bìa",
  CreatedByAccountId: "Mã tài khoản người tạo",
  Customer: "Khách hàng",
  CustomerId: "Mã khách hàng",
  CustomerType: "Loại khách hàng",
  Date: "Ngày",
  DaysBeforeAutoClose: "Số ngày tự đóng lô",
  Deducted: "Số đã trừ",
  Description: "Mô tả",
  DisplayName: "Tên hiển thị",
  DocumentNumber: "Số giấy tờ",
  EffectiveDate: "Ngày hiệu lực",
  EffectiveFrom: "Áp dụng từ",
  Email: "Email",
  EmployeeId: "Mã nhân viên",
  EmployeeIds: "Mã các nhân viên",
  EndDate: "Ngày kết thúc",
  EstimatedKg: "Kg ước tính",
  ExpectedHarvestDate: "Ngày dự kiến thu hoạch",
  ExpectedSeedQuantity: "Lượng giống dự kiến",
  ExpenseMonth: "Tháng ghi chi phí",
  ExpiryDate: "Ngày hết hạn",
  FullName: "Họ tên",
  Gender: "Giới tính",
  Group: "Nhóm",
  HarvestCompletedAt: "Thời điểm thu hoạch xong",
  HarvestDate: "Ngày thu hoạch",
  HarvestedCages: "Số lồng đã thu hoạch",
  HasPhoto: "Có ảnh",
  HourlyRate: "Tiền công mỗi giờ",
  InvoiceCode: "Mã hóa đơn",
  InvoiceFound: "Tìm thấy hóa đơn",
  InvoiceId: "Mã hóa đơn (nội bộ)",
  IsActive: "Đang dùng",
  Item: "Vật tư",
  JobTypeId: "Mã loại việc",
  KeptName: "Tên hồ sơ giữ lại",
  KeptPhoneNumber: "Số điện thoại hồ sơ giữ lại",
  Kind: "Loại",
  LaneCount: "Số hàng",
  LaneNumber: "Hàng số",
  LaneNumbers: "Các hàng",
  Lanes: "Các hàng",
  LastWorkingDay: "Ngày làm việc cuối",
  Latitude: "Vĩ độ",
  Length: "Chiều dài",
  Lines: "Các dòng",
  LinkedExistingCustomer: "Gắn với hồ sơ khách hàng có sẵn",
  Location: "Vị trí",
  LogoUrl: "Logo",
  Longitude: "Kinh độ",
  LotCode: "Mã lô",
  Lots: "Các lô",
  MeasuredAt: "Thời điểm đo",
  MergedAccountLocked: "Khóa tài khoản của hồ sơ bị gộp",
  MergedIntoCustomerId: "Gộp vào hồ sơ",
  Method: "Hình thức",
  Mode: "Cách tính lại",
  Moved: "Số bản ghi đã chuyển",
  MustChangePassword: "Phải đổi mật khẩu",
  Name: "Tên",
  NewLanes: "Các hàng mới",
  Note: "Ghi chú",
  Notes: "Ghi chú",
  OccurredAt: "Thời điểm",
  Offer: "Cách xử lý đề xuất",
  OldDocumentsHidden: "Ẩn giấy tờ cũ",
  Order: "Thứ tự",
  OriginState: "Trạng thái nguồn gốc",
  OwnerApproved: "Chủ HTX đã đồng ý",
  PaidAt: "Thời điểm trả tiền",
  ParentId: "Mã nhóm cha",
  PayLaterAgreed: "Đồng ý cho trả sau",
  PaymentCode: "Mã phiếu thu",
  PaymentDate: "Ngày trả",
  PayrollLineId: "Mã dòng bảng lương",
  PeriodEnd: "Cuối kỳ",
  PeriodStart: "Đầu kỳ",
  PeriodType: "Loại kỳ lương",
  Ph: "Độ pH",
  PhMax: "pH cao nhất",
  PhMin: "pH thấp nhất",
  PhoneNumber: "Số điện thoại",
  PhoneVerifiedAt: "Thời điểm xác minh số điện thoại",
  PhotoCount: "Số ảnh",
  Photos: "Ảnh",
  PickupDate: "Ngày nhận hàng",
  PlannedCages: "Số lồng dự kiến",
  Product: "Sản phẩm",
  ProductId: "Mã sản phẩm",
  ProductName: "Tên sản phẩm",
  Proof: "Chứng từ",
  PublishedAt: "Thời điểm công bố",
  PublishedLots: "Các lô đã công bố",
  PurchaseRequest: "Yêu cầu mua",
  PurchaseRequestId: "Mã yêu cầu mua",
  PurchaseReturnId: "Mã phiếu trả hàng",
  QrCodeCreated: "Đã tạo mã QR",
  Quantity: "Số lượng",
  Raft: "Bè",
  RaftId: "Mã bè",
  Reason: "Lý do",
  ReceiptDate: "Ngày nhập",
  RemovedLanes: "Các hàng đã bỏ",
  RepairReason: "Lý do sửa bè",
  ReplacedDocumentId: "Mã giấy tờ bị thay",
  ReplacedDocumentNumber: "Số giấy tờ bị thay",
  RequestedCages: "Số lồng đặt mua",
  RequestedSubjectType: "Loại tài khoản xin cấp",
  ResponseReason: "Lý do phản hồi",
  ResponsibleAccountId: "Mã tài khoản người phụ trách",
  RestoredLanes: "Các hàng dùng lại",
  Role: "Vai trò",
  SalesInvoiceCode: "Mã hóa đơn bán",
  Salinity: "Độ mặn",
  SalinityMax: "Độ mặn cao nhất",
  SalinityMin: "Độ mặn thấp nhất",
  Scope: "Phạm vi",
  SeededCount: "Số đã thả giống",
  SeedingCompletedOn: "Ngày thả giống xong",
  SeedingDate: "Ngày thả giống",
  SessionsRevoked: "Số phiên đăng nhập đã thu hồi",
  Size: "Kích thước",
  Slips: "Số phiếu lương",
  SortOrder: "Thứ tự",
  StartDate: "Ngày bắt đầu",
  Status: "Trạng thái",
  StatusId: "Mã trạng thái",
  SubjectType: "Loại tài khoản",
  Supplier: "Nhà cung cấp",
  SupplierId: "Mã nhà cung cấp",
  TargetYieldKg: "Sản lượng mục tiêu",
  TaxCode: "Mã số thuế",
  TemporaryPasswordIssuedAt: "Thời điểm cấp mật khẩu tạm",
  ToPayAmount: "Số tiền phải trả",
  Total: "Tổng tiền",
  TotalKg: "Tổng kg",
  TransferredAt: "Thời điểm chuyển khoản",
  Unit: "Đơn vị",
  UnitPrice: "Đơn giá",
  UsageDate: "Ngày sửa bè",
  Username: "Tên đăng nhập",
  Value: "Giá trị",
  VisitDate: "Ngày đi bè",
  VoucherId: "Mã phiếu chi",
  WantsQrCode: "Muốn tạo mã QR",
  Ward: "Phường/xã",
  WorkDate: "Ngày làm việc",
  WrittenOff: "Đã xóa sổ",
  ZaloLinked: "Đã liên kết Zalo",
  Zone: "Vùng nuôi",
  ZoneId: "Mã vùng nuôi",
};

/** Mã trạng thái (`StatusCatalogSeed`) mà thao tác đổi trạng thái lưu trong trường "Status". */
const STATUS_CODE: Record<string, string> = {
  ACCEPTED: "Đã chấp nhận",
  ACTIVE: "Đang hoạt động",
  APPROVED: "Đã duyệt",
  AWAITING_CONFIRMATION: "Chờ xác nhận",
  AWAITING_FINALIZATION: "Chờ chốt",
  AWAITING_RESPONSE: "Chờ phản hồi",
  AWAITING_REVIEW: "Chờ duyệt",
  AWAITING_STAFF: "Chờ nhân viên xác nhận",
  CANCELLED: "Đã hủy",
  CLOSED: "Đã đóng",
  COMPLETED: "Hoàn tất",
  CREATING: "Đang tạo",
  DECLINED: "Đã từ chối",
  DRAFT: "Nháp",
  EFFECTIVE: "Đang hiệu lực",
  FINALIZED: "Đã chốt",
  IN_USE: "Đang dùng",
  LEFT: "Đã nghỉ",
  LOCKED: "Đã khóa",
  NOT_SENT: "Chưa gửi được",
  OPEN: "Đang mở",
  OUT_OF_USE: "Ngừng dùng",
  PENDING_APPROVAL: "Chờ duyệt",
  PENDING_TRANSFER: "Chờ chuyển khoản",
  RECORDED: "Đã ghi nhận",
  REJECTED: "Đã từ chối",
  REMOVED: "Đã gỡ",
  REOPENED: "Mở lại",
  REVOKED: "Đã thu hồi",
  SENDING: "Đang gửi",
  SENT: "Đã gửi",
  SENT_BACK: "Bị trả lại",
  VOIDED: "Đã hủy",
  WORKING: "Đang làm",
};

/**
 * Giá trị dạng mã của backend (enum ghi bằng chữ) theo từng trường. Chỉ dịch theo trường, vì cùng một chữ như "All",
 * "Other" ở trường khác có thể là tên do người dùng nhập.
 */
const SUBJECT_TYPE_VALUE: Record<string, string> = { CooperativeOwner: "Chủ HTX", Staff: "Nhân viên", Trader: "Thương lái" };
const FIELD_VALUE: Record<string, Record<string, string>> = {
  Channel: { InApp: "Thông báo trong ứng dụng", Sms: "Tin nhắn SMS", ZaloOa: "Zalo OA" },
  CustomerType: { Individual: "Cá nhân", Company: "Công ty" },
  Gender: { Male: "Nam", Female: "Nữ", Other: "Khác" },
  Kind: { Wage: "Trả lương", Advance: "Tạm ứng", Payment: "Thu tiền", PaidBack: "Trả lại tiền" },
  Method: { Cash: "Tiền mặt", BankTransfer: "Chuyển khoản", OtherTransfer: "Chuyển khoản", VietQrInvoice: "VietQR của hóa đơn", EWallet: "Ví điện tử", Other: "Khác" },
  Mode: { All: "Tính lại cả danh sách nhân viên", WorkingDaysOnly: "Chỉ tính lại giờ công" },
  Offer: { ReturnAllGoods: "Trả lại toàn bộ hàng", PriceCutWholeInvoice: "Giảm giá cả hóa đơn" },
  OriginState: { NotPublished: "Chưa công bố", Published: "Đã công bố", Withdrawn: "Đã thu hồi" },
  PeriodType: { Monthly: "Trọn tháng", Custom: "Khoảng ngày" },
  RequestedSubjectType: SUBJECT_TYPE_VALUE,
  Scope: { All: "Mọi nhân viên có giờ công", Selected: "Nhân viên được chọn" },
  SubjectType: SUBJECT_TYPE_VALUE,
};

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

export function recordTypeLabel(recordType: string): string {
  // Loại chưa có tên tiếng Việt thì hiện câu chung, không hiện tên tiếng Anh của backend.
  return RECORD_TYPE[recordType] ?? "Bản ghi khác";
}

/** "Raft.Updated" → "Sửa bè"; thao tác lạ thì hiện câu chung theo loại bản ghi, không hiện mã tiếng Anh. */
export function actionLabel(action: string): string {
  if (ACTION[action]) return ACTION[action];
  const [type, verb] = action.split(".");
  if (verb && VERB[verb]) return `${VERB[verb]} ${lowerFirst(recordTypeLabel(type))}`;
  return `Thao tác trên ${lowerFirst(recordTypeLabel(type))}`;
}

/** Hệ thống, hoặc tên người kèm tên đăng nhập; tên dự phòng tiếng Anh của server đổi sang tiếng Việt. */
export function actorLabel(actor: AuditActor): string {
  if (actor.kind === "System") return "Hệ thống";
  if (actor.kind === "Employee") return `${actor.name === "Employee" ? "Nhân viên" : actor.name} (nhân viên)`;
  const name = actor.name === "Account" ? "Tài khoản" : actor.name;
  return actor.username ? `${name} (${actor.username})` : name;
}

export function fieldLabel(field: string): string {
  const key = field.charAt(0).toUpperCase() + field.slice(1);
  return FIELD[key] ?? "Thông tin khác";
}

/** Một giá trị để đọc: ngày theo kiểu Việt Nam, có/không, danh sách nối bằng dấu chấm phẩy. */
export function valueText(value: AuditValue | undefined): string {
  if (value === undefined || value === null || value === "") return "Trống";
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (typeof value === "number") return num(value);
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return date(value);
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return dateTime(value);
    if (/^\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(value)) return value.slice(0, 5);
    return value;
  }
  if (Array.isArray(value)) return value.length ? value.map(valueText).join("; ") : "Trống";
  const entries = Object.entries(value);
  return entries.length ? entries.map(([k, v]) => `${fieldLabel(k)}: ${valueText(v)}`).join(", ") : "Trống";
}

/** Giá trị của một trường: trường trạng thái đổi mã sang chữ tiếng Việt. */
export function fieldValueText(field: string, value: AuditValue | undefined): string {
  if (/^status$/i.test(field) && typeof value === "string" && STATUS_CODE[value]) return STATUS_CODE[value];
  const key = field.charAt(0).toUpperCase() + field.slice(1);
  if (typeof value === "string" && FIELD_VALUE[key]?.[value]) return FIELD_VALUE[key][value];
  return valueText(value);
}

const isObject = (value: AuditValue | null): value is { [field: string]: AuditValue } => !!value && typeof value === "object" && !Array.isArray(value);

/**
 * Các trường của giá trị trước và sau, theo thứ tự xuất hiện. Khi sửa, server chỉ lưu trường đã đổi; khi tạo chỉ có giá
 * trị sau. Giá trị không phải object thì hiện thành một dòng "Giá trị".
 */
export function changesOf(before: AuditValue | null, after: AuditValue | null): AuditChange[] {
  if (before === null && after === null) return [];
  if (!isObject(before) && !isObject(after)) return [{ field: "Value", before: before ?? undefined, after: after ?? undefined }];
  const b = isObject(before) ? before : {};
  const a = isObject(after) ? after : {};
  const fields = [...Object.keys(a), ...Object.keys(b).filter((k) => !(k in a))];
  return fields.map((field) => ({ field, before: b[field], after: a[field] }));
}

/** Màn trên app mở được bản ghi của thao tác; null khi app chưa có màn cho loại này. */
export function recordPath(recordType: string, recordId: string, action: string): string | null {
  if (action === "Cooperative.HarvestSettingsChanged") return "/manage/harvest-settings";
  switch (recordType) {
    case "FarmingZone": return `/manage/zones/${recordId}`;
    case "Raft": return `/manage/rafts/${recordId}`;
    case "ZoneLicense": return `/manage/licenses/${recordId}`;
    case "CultivationCycle": return `/manage/cycles/${recordId}`;
    case "WaterMeasurement": return `/manage/water/${recordId}`;
    case "MaterialUsage": return `/manage/material-usages/${recordId}`;
    case "Supplier": return `/manage/suppliers/${recordId}`;
    case "PurchaseReceipt": return `/manage/purchases/${recordId}`;
    case "SalesInvoice": return `/manage/invoices/${recordId}`;
    case "Employee": return `/manage/employees/${recordId}`;
    case "Account": return `/manage/accounts/${recordId}`;
    case "Role": return `/manage/roles/${recordId}`;
    case "Cooperative": return action === "Cooperative.CustomerSettingsChanged" ? null : "/manage/cooperative";
    case "Customer": return `/manage/customers/${recordId}`;
    case "CustomerPayment": return `/manage/customer-payments/${recordId}`;
    case "QualityClaim": return `/manage/quality-claims/${recordId}`;
    case "Payroll": return `/manage/payrolls/${recordId}`;
    case "PayrollSettings": return "/manage/payroll-settings";
    case "JobType": return `/manage/pay-rates/${recordId}`;
    default: return null;
  }
}
