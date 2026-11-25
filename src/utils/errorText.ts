import type { ProblemDetails } from "@/models/ProblemDetails";
import { ApiError, isNetworkError } from "@/services/errors";
import { FIELD, LINK, MESSAGES } from "@/constants/messages";
import { date, money } from "@/utils/format";

/** Tên trường backend gửi trong `field` của MSG01 (tiếng Anh) → tên hiện cho người dùng. */
const SERVER_FIELD: Record<string, string> = {
  "Work plan": "Kế hoạch ngày làm",
  "Work plan required": "Cần tạo kế hoạch và chọn người phụ trách trước khi phân công",
  "Work plan already assigned": "Kế hoạch đã phân công hoặc mời nhân viên; không thể sửa nội dung ca",
  "Work plan already answered": "Kế hoạch đã có phản hồi",
  "Work plan mismatch": "Bè, ngày và loại việc phải khớp kế hoạch đã duyệt",
  "Plan responsible": "Người phụ trách phải có quyền phân công tại vùng này và đã nhận kế hoạch",
  "Requested cages": "Số lồng đặt mua",
  "Accepted cages": "Số lồng chấp nhận",
  "Pickup date": "Ngày nhận hàng",
  "Pay later": "Cho trả sau",
  "Start date": "Ngày bắt đầu nuôi",
  "Expected seed quantity": "Lượng giống dự kiến",
  "Expected harvest date": "Ngày dự kiến thu hoạch",
  "Target yield": "Sản lượng mục tiêu",
  "Cultivation cycle": "Chu kỳ nuôi",
  "Seeding date": "Ngày thả giống",
  "Seed lot": "Lô giống",
  // Dùng chung cho lượng giống khi thả giống và số lượng vật tư sửa bè.
  "Quantity": "Số lượng",
  "Seeding session": "Phiên thả giống",
  "Visit date": "Ngày đi bè",
  // Ảnh bè của nhật ký nuôi và ảnh của khiếu nại: JPEG hoặc PNG, tối đa 10 MB mỗi ảnh.
  "Photos": "Ảnh (JPEG hoặc PNG, tối đa 10 MB mỗi ảnh)",
  "Cultivation log": "Nhật ký nuôi",
  "Assessment": "Đánh giá chu kỳ",
  "Product": "Sản phẩm",
  "Product unavailable": "Sản phẩm đã ngừng bán hoặc ngoài thời gian bán",
  "Customer profile": "Hồ sơ thương lái",
  "Client operation": "Lần gửi yêu cầu",
  "Purchase request status": "Trạng thái yêu cầu mua",
  "Purchase request": "Đơn hàng",
  "Answered purchase request": "Yêu cầu đã được phản hồi hoặc đã hủy",
  "Work date": "Ngày làm việc",
  "Staffing capacity": "Số lồng và năng suất nhân viên",
  "Shift invitations": "Danh sách nhân viên được mời ca",
  "Staffing plan already sent": "Ca đã gửi không thể sửa; hãy giữ nguyên nội dung và mời thêm người",
  "Shift already answered": "Bạn đã phản hồi ca này",
  "Insufficient approved staff": "Chưa đủ nhân viên đồng ý ca để nhận đơn",
  "Employee unavailable": "Nhân viên không còn khả dụng cho ngày này (nghỉ phép, trùng ca hoặc tài khoản không hoạt động)",
  "Staffing already sufficient": "Ca đã đủ nhân viên đồng ý",
  "Staffing plan mismatch": "Số lồng và ngày nhận phải khớp ca đã gửi, ngày làm chưa được qua hạn",
  "Work assignment": "Phân công",
  "Job type": "Loại công việc",
  "Approved leave": "Nhân viên đã được duyệt nghỉ phép trong ngày này",
  "Attendance already recorded": "Ngày này đã ghi nhận chấm công, không thể thay phân công",
  "Attendance QR": "Mã QR chấm công (mã hết hạn hoặc không đúng nhân viên)",
  "Check-in time": "Giờ vào ca",
  "Check-out time": "Giờ ra ca",
  "Job change time": "Thời điểm đổi việc",
  "Crew not checked in": "Đội chưa có người vào ca",
  "Leave request": "Ngày nghỉ và lý do",
  "Response": "Phản hồi",
  "Attendance settings": "Giờ nghỉ và đơn vị làm tròn",
  "Locked payroll period": "Kỳ công đã gửi hoặc chốt lương, không đổi cài đặt được",
  "Effective date already used": "Ngày áp dụng đã có cài đặt",
  "Job type already exists": "Tên loại việc đã tồn tại",
  // Phân công, chấm công, yêu cầu của nhân viên (OMTS-132: LABOR-02, LABOR-04, LABOR-05, LABOR-10).
  "Date (today or later)": "Ngày làm việc (chỉ từ hôm nay trở đi, trước khi vào ca)",
  "Date (today only)": "Ngày làm việc (chỉ ghi giờ cho hôm nay)",
  Employees: "Danh sách nhân viên",
  "Check-in": "Giờ vào ca (phải trước giờ ra)",
  "Check-out": "Giờ ra ca (phải sau giờ vào)",
  "Start time": "Giờ bắt đầu (không được sau giờ hiện tại)",
  Days: "Ngày nghỉ (đến ngày không được trước từ ngày)",
  "Day (today or earlier)": "Ngày quên chấm công (hôm nay hoặc trước đó)",
  "Requested time": "Giờ cần ghi (không được sau giờ hiện tại)",
  Type: "Loại yêu cầu",
  Approved: "Quyết định duyệt",
  Period: "Khoảng ngày (tối đa 62 ngày)",
  "QR code": "Mã QR chấm công",
  // Cài đặt chấm công (LABOR-15) và loại việc (LABOR-11).
  "Break start": "Giờ bắt đầu nghỉ",
  "Break end": "Giờ hết nghỉ (phải sau giờ bắt đầu nghỉ)",
  "Rounding unit": "Đơn vị làm tròn",
  "Hourly rate": "Tiền công mỗi giờ (số nguyên lớn hơn 0)",
  "Location token": "Vị trí Zalo",
  "Display name": FIELD.displayName,
  Reason: FIELD.reason,
  Note: "Lời nhắn",
  "Phone number": "Số điện thoại",
  Email: "Email",
  Page: "Trang",
  "Page size": "Số dòng mỗi trang",
  // Các màn quản lý của Chủ HTX.
  Code: "Mã",
  Name: "Tên",
  "Full name": "Họ tên",
  Username: "Tên đăng nhập",
  Location: "Vị trí",
  Area: "Diện tích",
  Latitude: "Vĩ độ",
  Longitude: "Kinh độ",
  // Ranh giới vùng theo sơ đồ cấp phép (PUT api/zones/{id}/boundary).
  Boundary: "Ranh giới vùng (số khu, số điểm góc hoặc điểm trùng nhau)",
  "Boundary coordinates": "Tọa độ điểm góc (phải nằm trong Việt Nam)",
  "Boundary name": "Tên khu",
  "Boundary corners": "Tên điểm góc",
  Lanes: "Các hàng của bè",
  Size: "Kích thước",
  Notes: "Ghi chú",
  Description: "Mô tả",
  Unit: "Đơn vị",
  Group: "Nhóm",
  Status: "Trạng thái",
  Zone: "Vùng nuôi",
  "Working zones": "Vùng làm việc",
  Raft: "Bè",
  "Condition notes": "Ghi chú tình trạng",
  "Water measurement point": "Điểm đo nước",
  "Measured at": "Thời điểm đo",
  pH: "Độ pH",
  "pH minimum": "pH thấp nhất",
  "pH maximum": "pH cao nhất",
  Salinity: "Độ mặn",
  "Salinity minimum": "Độ mặn thấp nhất",
  "Salinity maximum": "Độ mặn cao nhất",
  "Record version": "Phiên bản bản ghi",
  RowVersion: "Phiên bản bản ghi",
  Photo: "Ảnh",
  From: "Từ ngày",
  To: "Đến ngày",
  "From date": "Từ ngày",
  "To date": "Đến ngày",
  "Document number": "Số giấy tờ",
  "Document type": "Loại giấy tờ",
  "Issuing authority": "Cơ quan cấp",
  Holder: "Người đứng tên",
  "Legal scope": "Phạm vi pháp lý",
  Supplier: "Nhà cung cấp",
  "Supplier type": "Loại nhà cung cấp",
  "Other contacts": "Liên hệ khác",
  Receipt: "Phiếu nhập",
  "Purchase receipt": "Phiếu nhập",
  "Receipt date": "Ngày nhập",
  Lines: "Dòng hàng",
  "Farming input item": "Vật tư",
  Amount: "Số tiền",
  "Amount paid now": "Số tiền trả ngay",
  "Discount amount": "Tiền chiết khấu",
  "Payment date": "Ngày trả",
  Method: "Hình thức trả",
  "Paid now method": "Hình thức trả",
  "Reference code": "Mã tham chiếu",
  "Return date": "Ngày trả hàng",
  "Returned quantity": "Số lượng trả",
  "Refund amount": "Tiền hoàn lại",
  "Debt reduction amount": "Tiền trừ công nợ",
  "Refund amount + Debt reduction amount": "Tổng tiền trừ công nợ và tiền hoàn lại",
  "Refund method": "Hình thức hoàn tiền",
  "Effective date": "Ngày hiệu lực",
  "Expiry date": "Ngày hết hạn",
  Zones: "Vùng áp dụng",
  File: "Tệp giấy tờ",
  "Cancel payments": "Hủy các lần trả tiền",
  Employee: "Nhân viên",
  Birthday: "Ngày sinh",
  Address: "Địa chỉ",
  Ward: "Phường/xã",
  "Other information": "Thông tin khác",
  "Bank account": "Tài khoản ngân hàng",
  "End date": "Ngày nghỉ",
  Account: "Tài khoản",
  Role: "Vai trò",
  "Role name": "Tên vai trò",
  "Zone-role pair": "Cặp vùng và vai trò",
  "Effective to": "Hiệu lực đến",
  "Tax code": "Mã số thuế",
  "Office address": "Địa chỉ trụ sở",
  "Legal representative": "Người đại diện pháp luật",
  Logo: "Logo",
  // Khách hàng và công nợ thương lái (CustomerEntries, CustomerMergeService, CustomerDebtAdjustmentService).
  Customer: "Khách hàng",
  "Second phone number": "Số điện thoại thứ hai",
  "Customer type": "Loại khách hàng",
  Gender: "Giới tính",
  "Birth date": "Ngày sinh",
  Facebook: "Facebook",
  Province: "Tỉnh/thành phố",
  "Company name": "Tên công ty",
  "Identity number": "Số CCCD",
  Bank: "Ngân hàng",
  "Bank account number": "Số tài khoản ngân hàng",
  "Customer profile to merge": "Hồ sơ cần gộp",
  "Occurred at": "Thời điểm điều chỉnh",
  // Phiếu thu, trả lại tiền, tài khoản nhận tiền (CustomerPaymentRules, ReceivingBankAccountRules).
  "Collected by": "Người nhận hoặc trả tiền",
  "Cash account": "Tài khoản của HTX",
  "Bank reference": "Mã giao dịch ngân hàng",
  "Paid at": "Thời điểm trả tiền (không được sau hiện tại)",
  Allocations: "Số tiền trừ vào các hóa đơn",
  Payments: "Danh sách khoản cần xác nhận",
  "Deduplication key": "Lần gửi phiếu",
  "Account number": "Số tài khoản",
  "Account holder name": "Tên chủ tài khoản",
  // Khiếu nại chất lượng (QualityClaimResponseService).
  Offer: "Cách xử lý đề xuất",
  // Bảng lương và cài đặt lương (PayrollService, PayrollPaymentService, PayrollSettingsService).
  "Period type": "Loại kỳ lương",
  Scope: "Nhân viên được tính lương",
  Mode: "Cách tính lại",
  "Expense month": "Tháng ghi chi phí lương",
  "Pay period start day": "Ngày bắt đầu kỳ lương (từ 1 đến 28)",
  "Automatic payroll": "Tự tạo bảng lương",
  Kind: "Loại khoản trả",
  Search: "Từ khóa tìm kiếm",
  "Sort by": "Cách sắp xếp",
  "Sort direction": "Chiều sắp xếp",
  "Idempotency key": "Mã chống gửi trùng",
  // Vật tư sửa bè, cài đặt lô hàu, báo cáo sản lượng, lịch sử thao tác.
  "Repair date": "Ngày sửa bè",
  "Repair reason": "Lý do sửa bè",
  Items: "Danh sách vật tư đã dùng",
  Item: "Vật tư",
  "Average kg per cage": "Số kg trung bình mỗi lồng",
  "Days before automatic close": "Số ngày tự đóng lô (từ 1 đến 365)",
  Grouping: "Cách gom số liệu",
  Person: "Người thao tác (chỉ chọn một)",
  Action: "Thao tác",
  "Record type": "Loại bản ghi",
  "Record code": "Mã bản ghi",
};

/** Tên trường của MSG01, kể cả trường đánh số theo dòng ("Line 3 quantity", "Allocation 2"). */
function fieldName(d: ProblemDetails): string {
  const field = String(d.field ?? "");
  const line = /^Line (\d+) (item|quantity)$/.exec(field);
  if (line) return `Dòng ${line[1]}: ${line[2] === "item" ? "vật tư" : "số lượng"}`;
  if (/^Allocation \d+$/.test(field)) return "Số tiền trừ vào hóa đơn";
  return SERVER_FIELD[field] ?? "Thông tin đã nhập";
}

/** Lý do chưa chốt được bảng lương (MSG-LABOR-28), chỉ có trong `detail` tiếng Anh. */
function payrollNotReady(detail: string) {
  const reasons = [
    [/has not ended/i, "kỳ lương chưa kết thúc"],
    [/is incomplete/i, "có ngày chấm công của nhân viên thời vụ thiếu giờ vào hoặc ra"],
    [/no hourly rate/i, "có giờ công chưa có tiền công cho ngày đó"],
    [/no employee has hours/i, "không nhân viên nào có giờ công"],
  ] as const;
  const found = reasons.filter(([pattern]) => pattern.test(detail)).map(([, text]) => text);
  return `Chưa chốt được bảng lương${found.length ? `: ${found.join("; ")}` : ""}. Hãy xử lý rồi chốt lại.`;
}

/**
 * Chữ tiếng Việt cho từng mã lỗi backend (`UserMessages.cs`). Mã có tham số mà server chỉ đưa vào `detail`
 * (tên người sửa, danh sách bản ghi…) thì hiện câu chung không kèm tham số.
 */
const SERVER_TEXT: Record<string, string | ((details: ProblemDetails) => string)> = {
  MSG01: (d) =>
    d.field === "Period" && d.existingId
      ? "Khoảng ngày này trùng với một bảng lương khác. Hãy mở bảng lương đó hoặc chọn khoảng ngày khác."
      : d.field === "Cash account" && /payOS/i.test(String(d.hint ?? ""))
        ? "HTX chưa cài tài khoản nhận tiền cho thanh toán trong app. Vui lòng báo HTX hoặc trả theo cách khác."
        : MESSAGES.MSG01(fieldName(d)),
  MSG02: MESSAGES.MSG02,
  MSG03: "Bản ghi này đã tồn tại. Hệ thống mở bản ghi có sẵn để bạn kiểm tra, không tạo bản sao.",
  MSG04: (d) => {
    const detail = String(d.detail ?? "");
    return MESSAGES.MSG04(/Zalo/i.test(detail) ? "Zalo" : /payOS/i.test(detail) ? "thanh toán payOS" : "bên ngoài");
  },
  MSG05: "Không thực hiện được thao tác với tệp. Dữ liệu gốc không thay đổi; vui lòng thử lại.",
  MSG06: "Dữ liệu vừa được người khác cập nhật. Thay đổi của bạn chưa được lưu; vui lòng xem bản mới rồi lưu lại hoặc hủy.",
  MSG08: "Không có dữ liệu trong phạm vi đã chọn.",
  MSG11: "Không thể tiếp tục vì vẫn còn bản ghi liên quan đang sử dụng. Vui lòng xử lý các bản ghi đó trước.",
  MSG12: "Thông tin đăng nhập không đúng. Vui lòng kiểm tra và thử lại.",
  MSG13: MESSAGES.MSG13,
  MSG19: MESSAGES.MSG19,
  MSG20: MESSAGES.MSG20,
  MSG21: "Kênh thông báo này chưa được cấu hình hoặc chưa đủ điều kiện nên chưa bật được.",
  MSG22: MESSAGES.MSG22,
  MSG23: MESSAGES.MSG23,
  MSG24: "Tài khoản này đã gắn với một hồ sơ nhân viên khác.",
  MSG28: "Giá trị nhỏ nhất phải nhỏ hơn giá trị lớn nhất.",
  MSG41: "Số tiền phải là bội số của 1.000 đồng.",
  MSG45: (d) => {
    const field = SERVER_FIELD[String(d.field ?? "")];
    return field ? `${field} vượt quá giới hạn cho phép.` : "Giá trị vượt quá giới hạn cho phép.";
  },
  MSG58: "Có người khác đang sửa bản ghi này. Bạn vẫn có thể sửa; khi lưu, nếu bản ghi đã đổi app sẽ báo để bạn xem bản mới.",
  LICENSE_REPLACED: "Giấy tờ này đã được thay bằng giấy tờ mới nên không sửa được nữa.",
  MSG57: MESSAGES.MSG57,
  MSG59: "Số lượng phải lớn hơn 0 và đơn giá không được âm.",
  // Mã cũ của MSG-GEN-09. Khiếu nại và vật tư sửa bè nói rõ lý do; các trường hợp khác giữ câu chung.
  MSG61: (d) => {
    const detail = String(d.detail ?? "");
    if (d.reasonCode === "WEIGHING_NOT_AGREED") return `Thương lái chưa đồng ý số cân của lô ${String(d.lotCode ?? "")}, nên chưa lập hóa đơn được.`;
    if (d.cycleId) return "Ngày này thuộc chu kỳ nuôi đã đóng nên không ghi hay sửa được. Hãy chọn ngày khác.";
    if (/under a quality claim/i.test(detail)) return "Hóa đơn này đang có khiếu nại chờ HTX trả lời.";
    if (/^Sales invoice .* is returned/i.test(detail)) return "Hóa đơn này đã trả hàng nên không gửi khiếu nại được.";
    if (/^Quality claim is/i.test(detail)) return "Khiếu nại này đã được trả lời. Phản hồi không sửa được.";
    if (/^Sales invoice .* is Paid/i.test(detail)) return "Hóa đơn này đã trả đủ, không cần thanh toán thêm.";
    return "Không đổi được trạng thái: trạng thái hiện tại của bản ghi không cho phép thao tác này.";
  },
  MSG68: "Mật khẩu tạm đã hết hạn. Vui lòng nhờ Chủ HTX cấp lại.",
  "MSG-CYCLE-03": "Chưa có lô giống để chọn: cần hoàn tất phiếu nhập hàng của giống trước.",
  "MSG-CYCLE-07": "Đây là đóng sớm nên cần Chủ HTX đồng ý. Đánh dấu ô xác nhận khi Chủ HTX đã đồng ý rồi đóng lại.",
  MSG69: MESSAGES.MSG69,
  // OMTS-132 (WorkMessages.cs, UserMessages.PayrollLocksDate): `lockedUntil`, `date` là trường mở rộng của lỗi.
  "MSG-LABOR-04": (d) => `Kỳ lương chứa ngày này đã gửi duyệt hoặc đã chốt nên không thay đổi được.${d.lockedUntil ? ` Hãy chọn ngày sau ${date(String(d.lockedUntil))}.` : ""}`,
  "MSG-LABOR-06": "Có nhân viên đã được phân công bè khác trong ngày này và chưa vào ca. Hãy xác nhận chuyển sang bè mới rồi gửi lại.",
  "MSG-LABOR-07": "Nhân viên đã vào ca hôm nay nên không đổi hay gỡ phân công được. Muốn chuyển sang bè khác, dùng “Đổi việc cho đội”.",
  "MSG-LABOR-13": "Không nhận ra mã QR này hoặc mã đã hết hạn. Nhờ nhân viên mở mã chấm công mới, hoặc ghi thủ công.",
  "MSG-LABOR-14": (d) => `Nhân viên này đã có giờ ${/check-out/i.test(String(d.detail ?? "")) ? "ra" : "vào"} hôm nay. Giờ đã ghi được giữ nguyên.`,
  "MSG-LABOR-16": "Không duyệt được yêu cầu này: kỳ lương của ngày đó đã gửi duyệt hoặc đã chốt, hoặc giờ vào và giờ ra sẽ không đúng thứ tự. Bạn có thể từ chối kèm lời nhắn.",
  "MSG-LABOR-25": (d) => `Lương ngày ${date(String(d.date ?? ""))} đã chốt. Bạn không gửi yêu cầu cho ngày này được.`,
  "MSG-LABOR-26": (d) => `Chủ HTX đã ${/rejected/i.test(String(d.detail ?? "")) ? "từ chối" : "duyệt"} yêu cầu này nên không hủy được nữa.`,
  // Khiếu nại (CLAIM-02).
  "MSG-CLAIM-03": (d) =>
    /sales return/i.test(`${String(d.cause ?? "")} ${String(d.detail ?? "")}`)
      ? "Hóa đơn này đã có phiếu trả hàng nên không chấp nhận được khiếu nại. Bạn vẫn từ chối được, kèm lý do."
      : "Hóa đơn này đã hủy nên không chấp nhận được khiếu nại. Bạn vẫn từ chối được, kèm lý do.",
  // Khách hàng (SALE-04): gộp hồ sơ.
  "MSG-SALE-04": "Cần Chủ HTX đồng ý trước khi gộp hai hồ sơ. Đánh dấu ô xác nhận khi Chủ HTX đã đồng ý rồi gộp lại.",
  "MSG-SALE-05": "Không gộp được: hồ sơ cần gộp có tài khoản thương lái còn hồ sơ giữ lại thì không. Hãy giữ hồ sơ có tài khoản và gộp hồ sơ kia vào.",
  // Phiếu thu, trả lại tiền, tài khoản nhận tiền. MSG-DEBT-01/04/05 là câu hỏi xác nhận, màn phiếu thu tự hỏi bằng tiếng Việt.
  "MSG-DEBT-01": "Cần xác nhận lại trước khi lưu.",
  "MSG-DEBT-02": "Dịch vụ báo nhận tiền không chấp nhận tài khoản này hoặc chưa trả lời. Tài khoản nhận tiền chưa đổi; vui lòng kiểm tra lại hoặc thử lại sau.",
  "MSG-DEBT-04": "Cần xác nhận lại trước khi lưu.",
  "MSG-DEBT-05": "Cần xác nhận lại trước khi lưu.",
  "MSG-DEBT-06": (d) =>
    typeof d.owedBackAmount === "number"
      ? `Số tiền trả lại không được lớn hơn số HTX đang nợ lại thương lái (${money(d.owedBackAmount)}).`
      : "Số tiền trả lại không được lớn hơn số HTX đang nợ lại thương lái.",
  // Trả tiền nhà cung cấp (PURCHASE-05): câu hỏi xác nhận, sheet ghi trả tiền tự hỏi lại bằng câu đầy đủ.
  "MSG-PURCHASE-05": "Số tiền trả nhiều hơn số HTX đang nợ, phần dư sẽ thành tiền trả trước. Cần xác nhận lại trước khi lưu.",
  "MSG-PURCHASE-06": "Mã giao dịch ngân hàng này đã được ghi cho một lần trả khác. Cần xác nhận lại trước khi lưu.",
  // Phiếu xuất vật tư: màn lập phiếu nói rõ vật tư nào thiếu (issueErrorText); đây là câu chung.
  "MSG-INPUT-01": "Không đủ vật tư trong kho để xuất. Hãy giảm số lượng hoặc chọn lô giống khác.",
  // Bảng lương (PayrollMessages).
  "MSG-LABOR-28": (d) => payrollNotReady(String(d.detail ?? "")),
  "MSG-LABOR-31": "Chưa chốt được bảng lương: còn yêu cầu của nhân viên cho các ngày trong kỳ đang chờ duyệt. Hãy duyệt hoặc từ chối các yêu cầu đó rồi chốt lại.",
  "MSG-LABOR-34": (d) =>
    typeof d.outstanding === "number"
      ? `Số tiền trả không được lớn hơn số còn phải trả (${money(d.outstanding)}).`
      : "Số tiền trả không được lớn hơn số còn phải trả.",
  // Lịch sử thao tác: bản ghi gốc đã không còn.
  "MSG-ACCOUNT-22": "Bản ghi này không còn nữa. Thao tác vẫn được giữ trong lịch sử.",
  NOT_FOUND: "Bản ghi không tồn tại.",
  UNEXPECTED_ERROR: MESSAGES.UNEXPECTED,
  TOO_MANY_REQUESTS: "Bạn thao tác quá nhanh. Vui lòng đợi một phút rồi thử lại.",
  PASSWORD_CHANGE_REQUIRED: "Tài khoản cần đổi mật khẩu tạm trên bản web trước khi dùng tiếp.",
  MSG67: "Tài khoản cần số điện thoại đã xác minh. Vui lòng liên kết lại bằng số điện thoại Zalo.",
  ZALO_TOKEN_INVALID: "Không xác minh được tài khoản Zalo. Vui lòng mở OMTS từ Zalo và thử lại.",
  ZALO_PHONE_TOKEN_INVALID: "Không đọc được số điện thoại từ Zalo. Vui lòng thử lại.",
  ZALO_PHONE_UNSUPPORTED: "OMTS chỉ dùng số điện thoại Việt Nam. Vui lòng dùng tài khoản Zalo có số Việt Nam.",
  ZALO_ALREADY_LINKED: "Tài khoản Zalo này đã liên kết với một tài khoản OMTS khác.",
  ZALO_ACCOUNT_EXISTS: "Số điện thoại này đã có tài khoản OMTS. Vui lòng bấm liên kết tài khoản.",
  ZALO_NOT_LINKED: "Tài khoản Zalo này chưa liên kết với OMTS.",
  ZALO_APPROVAL_PENDING: "Yêu cầu của bạn đã được gửi. Vui lòng chờ HTX duyệt.",
  ZALO_REQUEST_REJECTED: (d) => LINK.rejected((d.reason as string | null) ?? null),
};

/** Chữ hiện cho người dùng khi một lời gọi API thất bại: luôn tiếng Việt, theo mã lỗi server trả. */
export function errorText(error: unknown): string {
  if (error instanceof ApiError) {
    const text = SERVER_TEXT[error.code];
    if (typeof text === "function") return text({ ...error.details, detail: error.message });
    if (text) return text;
    return error.status === 401 ? MESSAGES.MSG19 : error.status === 403 ? MESSAGES.MSG02 : MESSAGES.UNEXPECTED;
  }
  if (isNetworkError(error)) return MESSAGES.MSG07;
  return MESSAGES.UNEXPECTED;
}
