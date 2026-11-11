import type { MockModule } from "@/features/mock/models/MockModule";

const CUSTOMERS = ["Đại lý Đức Phát", "Bà Năm Hải Sản", "Công ty Hải sản Vân Đồn"];
const METHODS = ["Tiền mặt", "Chuyển khoản"];
const JOBS = ["Thu hoạch", "Treo giống", "Vệ sinh bè"];

/** Công nợ, thu tiền, đối soát, tài khoản nhận tiền và lương. */
export const MONEY_MODULES: MockModule[] = [
  {
    key: "receivables",
    title: "Công nợ khách hàng",
    useCases: "DEBT-03",
    summary: [{ label: "Tổng phải thu", kind: "sum", tone: "danger" }],
    records: [
      {
        id: "KH-01",
        title: "Đại lý Đức Phát",
        meta: "Tuổi nợ 8 ngày",
        amount: 85500000,
        facts: [
          ["Đầu kỳ 01/10/2026", "0 đ"],
          ["Cuối kỳ 05/11/2026", "85.500.000 đ"],
        ],
        sections: [
          {
            title: "Phát sinh trong kỳ",
            rows: [
              { title: "HD-20261028-04", meta: "28/10/2026 · Dư nợ 48.000.000 đ", value: "+48.000.000 đ", link: { module: "portWeighing", id: "HD-20261028-04" } },
              { title: "HD-20261102-01", meta: "02/11/2026 · Dư nợ 125.500.000 đ", value: "+77.500.000 đ", link: { module: "portWeighing", id: "HD-20261102-01" } },
              { title: "PT-2611-01", meta: "03/11/2026 · Dư nợ 85.500.000 đ", value: "-40.000.000 đ", link: { module: "receipts", id: "PT-2611-01" } },
            ],
          },
        ],
      },
      {
        id: "KH-03",
        title: "Công ty Hải sản Vân Đồn",
        meta: "Tuổi nợ 1 ngày",
        amount: 85000000,
        facts: [
          ["Đầu kỳ 01/10/2026", "0 đ"],
          ["Cuối kỳ 05/11/2026", "85.000.000 đ"],
        ],
        sections: [{ title: "Phát sinh trong kỳ", rows: [{ title: "HD-20261104-03", meta: "04/11/2026 · Dư nợ 85.000.000 đ", value: "+85.000.000 đ", link: { module: "portWeighing", id: "HD-20261104-03" } }] }],
      },
    ],
  },
  {
    key: "receipts",
    title: "Thu tiền khách hàng",
    useCases: "DEBT-02",
    statuses: {
      pending: { label: "Chờ xác nhận", tone: "warning" },
      confirmed: { label: "Đã xác nhận", tone: "success" },
      cancelled: { label: "Đã hủy", tone: "neutral" },
    },
    summary: [
      { label: "Đã xác nhận", kind: "sum", statuses: ["confirmed"], tone: "success" },
      { label: "Chờ xác nhận", kind: "sum", statuses: ["pending"], tone: "warning" },
    ],
    create: {
      label: "Ghi khoản thu",
      who: ["accountant"],
      idPrefix: "PT",
      titleField: "customer",
      metaFields: ["date", "method"],
      amountField: "amount",
      status: "confirmed",
      done: "Đã ghi khoản thu.",
      fields: [
        { key: "customer", label: "Khách hàng", type: "select", options: CUSTOMERS, required: true },
        { key: "amount", label: "Số tiền", type: "number", required: true },
        { key: "date", label: "Ngày thu", type: "date", required: true },
        { key: "method", label: "Hình thức", type: "select", options: METHODS, required: true },
        { key: "reference", label: "Mã giao dịch ngân hàng", type: "text" },
      ],
    },
    actions: [
      {
        label: "Xác nhận đã nhận tiền",
        from: ["pending"],
        to: "confirmed",
        who: ["accountant"],
        confirm: "Xác nhận bộ phận kế toán đã nhận đủ số tiền này?",
        done: "Đã xác nhận khoản thu.",
      },
      {
        label: "Hủy khoản thu",
        from: ["pending", "confirmed"],
        to: "cancelled",
        who: ["accountant"],
        danger: true,
        done: "Đã hủy khoản thu.",
        fields: [{ key: "reason", label: "Lý do hủy", type: "textarea", required: true }],
      },
    ],
    records: [
      {
        id: "PT-2611-01",
        title: "Đại lý Đức Phát",
        meta: "03/11/2026 · Chuyển khoản",
        amount: 40000000,
        status: "confirmed",
        facts: [
          ["Mã giao dịch", "FT26307112233"],
          ["Người ghi", "Trần Thu Hà"],
        ],
        sections: [{ title: "Trừ vào", rows: [{ title: "HD-20261102-01", value: "40.000.000 đ", link: { module: "portWeighing", id: "HD-20261102-01" } }] }],
      },
      {
        id: "PT-2611-02",
        title: "Bà Năm Hải Sản",
        meta: "03/11/2026 · Tiền mặt",
        amount: 49600000,
        status: "confirmed",
        facts: [["Người nhận tại cảng", "Lê Minh Tuấn"], ["Người xác nhận", "Trần Thu Hà"]],
        sections: [{ title: "Trừ vào", rows: [{ title: "HD-20261103-02", value: "49.600.000 đ", link: { module: "portWeighing", id: "HD-20261103-02" } }] }],
      },
      {
        id: "PT-2611-03",
        title: "Công ty Hải sản Vân Đồn",
        meta: "05/11/2026 · Tiền mặt",
        amount: 20000000,
        status: "pending",
        facts: [["Người nhận tại cảng", "Phạm Thị Lan"], ["Hóa đơn", "HD-20261104-03"]],
      },
    ],
  },
  {
    key: "reconcile",
    title: "Đối soát chuyển khoản",
    useCases: "DEBT-02",
    statuses: {
      unmatched: { label: "Chưa khớp", tone: "warning" },
      matched: { label: "Đã khớp", tone: "success" },
    },
    summary: [{ label: "Chưa khớp", kind: "sum", statuses: ["unmatched"], tone: "warning" }],
    actions: [
      {
        label: "Khớp với khách hàng",
        from: ["unmatched"],
        to: "matched",
        who: ["accountant"],
        done: "Đã khớp khoản tiền.",
        fields: [{ key: "customer", label: "Khách hàng", type: "select", options: CUSTOMERS, required: true }],
      },
    ],
    records: [
      { id: "GD-01", title: "chuyen tien hau", meta: "04/11/2026, 09:12 · Vietcombank", amount: 15000000, status: "unmatched", facts: [["Mã giao dịch", "FT26308556677"], ["Người chuyển", "NGUYEN VAN A"], ["Lý do chưa khớp", "Nội dung không có mã hóa đơn"]] },
      { id: "GD-02", title: "HD-20261102-01", meta: "03/11/2026, 14:30 · MB Bank", amount: 40000000, status: "matched", facts: [["Mã giao dịch", "FT26307112233"], ["Khách hàng", "Đại lý Đức Phát"]] },
    ],
  },
  {
    key: "refunds",
    title: "Hoàn tiền khách hàng",
    useCases: "DEBT-02, CLAIM-03",
    statuses: {
      waiting: { label: "Chờ hoàn", tone: "warning" },
      done: { label: "Đã hoàn", tone: "success" },
    },
    actions: [
      {
        label: "Ghi đã hoàn tiền",
        from: ["waiting"],
        to: "done",
        who: ["accountant"],
        done: "Đã ghi hoàn tiền.",
        fields: [
          { key: "method", label: "Hình thức", type: "select", options: METHODS, required: true },
          { key: "date", label: "Ngày hoàn", type: "date", required: true },
        ],
      },
    ],
    records: [
      { id: "HT-01", title: "Bà Năm Hải Sản", meta: "Giảm giá sau khiếu nại · HD-20261103-02", amount: 2000000, status: "waiting", facts: [["Lý do", "Giảm giá cả hóa đơn, khách đã trả đủ"], ["Người đề nghị", "Chủ HTX"]] },
    ],
  },
  {
    key: "bankAccount",
    title: "Tài khoản nhận tiền",
    useCases: "DEBT-01",
    actions: [
      {
        label: "Đổi tài khoản",
        who: [],
        done: "Đã đổi tài khoản nhận tiền.",
        updatesFacts: true,
        fields: [
          { key: "bank", label: "Ngân hàng", type: "select", options: ["MB Bank", "Vietcombank", "BIDV"], required: true },
          { key: "number", label: "Số tài khoản", type: "text", required: true },
          { key: "holder", label: "Chủ tài khoản", type: "text", required: true },
        ],
      },
    ],
    records: [
      {
        id: "TK-1",
        title: "Tài khoản đang dùng",
        facts: [
          ["Ngân hàng", "MB Bank"],
          ["Số tài khoản", "0000 1111 2222"],
          ["Chủ tài khoản", "HTX NUOI HAU VAN DON"],
        ],
      },
    ],
  },
  {
    key: "supplierStatement",
    title: "Sao kê công nợ theo kỳ",
    useCases: "PURCHASE-04",
    records: [
      {
        id: "SK-1",
        title: "Trại giống Đồng Rui",
        meta: "01/10/2026 đến 05/11/2026",
        amount: 6500000,
        facts: [
          ["Đầu kỳ", "5.000.000 đ"],
          ["Cuối kỳ", "6.500.000 đ"],
          ["Tuổi nợ", "20 ngày"],
        ],
        sections: [
          {
            title: "Phát sinh, theo ngày",
            rows: [
              { title: "Phiếu nhập PN-2610-08", meta: "16/10/2026 · Dư nợ 17.000.000 đ", value: "+12.000.000 đ" },
              { title: "Trả hàng TH-2610-02", meta: "20/10/2026 · Dư nợ 16.500.000 đ", value: "-500.000 đ" },
              { title: "Trả tiền chuyển khoản", meta: "02/11/2026 · Dư nợ 6.500.000 đ", value: "-10.000.000 đ" },
            ],
          },
        ],
      },
    ],
  },
  {
    key: "payroll",
    title: "Bảng lương",
    useCases: "LABOR-12 đến LABOR-14",
    statuses: {
      draft: { label: "Đang lập", tone: "warning" },
      sent: { label: "Chờ Chủ HTX chốt", tone: "warning" },
      final: { label: "Đã chốt", tone: "success" },
      paid: { label: "Đã trả đủ", tone: "neutral" },
    },
    actions: [
      { label: "Gửi Chủ HTX chốt", from: ["draft"], to: "sent", who: ["accountant"], confirm: "Gửi bảng lương này cho Chủ HTX xem và chốt?", done: "Đã gửi bảng lương." },
      { label: "Chốt bảng lương", from: ["sent"], to: "final", who: [], confirm: "Sau khi chốt, chấm công của kỳ này bị khóa.", done: "Đã chốt bảng lương." },
      {
        label: "Trả lại để sửa",
        from: ["sent"],
        to: "draft",
        who: [],
        danger: true,
        done: "Đã trả lại bảng lương.",
        fields: [{ key: "reason", label: "Cần sửa gì", type: "textarea", required: true }],
      },
      {
        label: "Ghi trả lương",
        from: ["final"],
        who: ["accountant"],
        done: "Đã ghi trả lương.",
        fields: [
          { key: "employee", label: "Nhân viên", type: "select", options: ["Nguyễn Văn Hải", "Trần Văn Bình", "Lê Thị Hoa"], required: true },
          { key: "amount", label: "Số tiền", type: "number", required: true },
          { key: "method", label: "Hình thức", type: "select", options: METHODS, required: true },
        ],
      },
    ],
    records: [
      {
        id: "BL-2611",
        title: "Tháng 11/2026",
        meta: "3 nhân viên · tính tới 05/11/2026",
        amount: 3300000,
        status: "draft",
        facts: [["Kỳ lương", "01/11/2026 đến 30/11/2026"]],
        sections: [
          {
            title: "Chi tiết",
            rows: [
              { title: "Nguyễn Văn Hải", meta: "40 giờ Treo giống × 30.000 đ", value: "1.200.000 đ" },
              { title: "Trần Văn Bình", meta: "36 giờ Thu hoạch × 35.000 đ", value: "1.260.000 đ" },
              { title: "Lê Thị Hoa", meta: "30 giờ Vệ sinh bè × 28.000 đ", value: "840.000 đ" },
            ],
          },
        ],
      },
      {
        id: "BL-2610",
        title: "Tháng 10/2026",
        meta: "3 nhân viên · còn nợ 3.650.000 đ",
        amount: 13650000,
        status: "final",
        facts: [
          ["Kỳ lương", "01/10/2026 đến 31/10/2026"],
          ["Đã trả", "10.000.000 đ"],
          ["Còn nợ", "3.650.000 đ"],
        ],
        sections: [
          {
            title: "Chi tiết",
            rows: [
              { title: "Nguyễn Văn Hải", meta: "168 giờ Treo giống × 30.000 đ", value: "5.040.000 đ" },
              { title: "Trần Văn Bình", meta: "150 giờ Thu hoạch × 35.000 đ", value: "5.250.000 đ" },
              { title: "Lê Thị Hoa", meta: "120 giờ Vệ sinh bè × 28.000 đ", value: "3.360.000 đ" },
            ],
          },
        ],
      },
    ],
  },
  {
    key: "payRates",
    title: "Bảng giá công",
    useCases: "LABOR-11",
    create: {
      label: "Thêm giá công",
      who: ["accountant"],
      idPrefix: "GC",
      titleField: "job",
      metaFields: ["from"],
      amountField: "rate",
      done: "Đã thêm giá công.",
      fields: [
        { key: "job", label: "Loại việc", type: "select", options: JOBS, required: true },
        { key: "rate", label: "Giá mỗi giờ", type: "number", required: true },
        { key: "from", label: "Áp dụng từ ngày", type: "date", required: true },
      ],
    },
    records: [
      { id: "GC-01", title: "Thu hoạch", meta: "Từ 01/01/2026", amount: 35000, facts: [["Ngày lễ", "Gấp 2 lần"]] },
      { id: "GC-02", title: "Treo giống", meta: "Từ 01/01/2026", amount: 30000, facts: [["Ngày lễ", "Gấp 2 lần"]] },
      { id: "GC-03", title: "Vệ sinh bè", meta: "Từ 01/01/2026", amount: 28000, facts: [["Ngày lễ", "Gấp 2 lần"]] },
    ],
  },
  {
    key: "payslips",
    title: "Phiếu lương của tôi",
    useCases: "LABOR-09",
    statuses: {
      provisional: { label: "Tạm tính", tone: "warning" },
      final: { label: "Đã chốt", tone: "success" },
    },
    records: [
      {
        id: "PL-2611",
        title: "Tháng 11/2026",
        meta: "40 giờ làm",
        amount: 1200000,
        status: "provisional",
        facts: [["Giờ công", "40 giờ Treo giống × 30.000 đ"], ["Đã trả", "0 đ"]],
      },
      {
        id: "PL-2610",
        title: "Tháng 10/2026",
        meta: "168 giờ làm · còn nhận 1.040.000 đ",
        amount: 5040000,
        status: "final",
        facts: [["Giờ công", "168 giờ Treo giống × 30.000 đ"], ["Đã trả", "4.000.000 đ"], ["Còn nhận", "1.040.000 đ"]],
      },
    ],
  },
  {
    key: "payrollSettings",
    title: "Cài đặt lương",
    useCases: "LABOR-16",
    actions: [
      {
        label: "Sửa cài đặt",
        who: [],
        done: "Đã lưu cài đặt lương.",
        updatesFacts: true,
        fields: [
          { key: "day", label: "Ngày bắt đầu kỳ lương", type: "number", required: true, value: "1" },
          { key: "auto", label: "Tự tạo bảng lương hằng tháng", type: "select", options: ["Có", "Không"], required: true, value: "Có" },
        ],
      },
    ],
    records: [
      {
        id: "CL-1",
        title: "Cài đặt đang dùng",
        facts: [
          ["Ngày bắt đầu kỳ lương", "1"],
          ["Tự tạo bảng lương hằng tháng", "Có"],
        ],
      },
    ],
  },
];
