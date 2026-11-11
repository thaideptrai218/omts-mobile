import type { MockModule } from "@/features/mock/models/MockModule";

const CUSTOMERS = ["Đại lý Đức Phát", "Bà Năm Hải Sản", "Công ty Hải sản Vân Đồn"];
const LOTS = ["LO-2611-01", "LO-2611-02"];

/** Khách hàng, hóa đơn tại cảng, khiếu nại và các màn của thương lái. Số tiền khớp với phần công nợ ở `money.ts`. */
export const SALES_MODULES: MockModule[] = [
  {
    key: "customers",
    title: "Khách hàng",
    useCases: "SALE-04",
    summary: [{ label: "Số khách hàng", kind: "count" }],
    create: {
      label: "Thêm khách hàng",
      who: ["zoneManager"],
      idPrefix: "KH",
      titleField: "name",
      metaFields: ["phone"],
      done: "Đã thêm khách hàng.",
      fields: [
        { key: "name", label: "Tên khách hàng", type: "text", required: true },
        { key: "phone", label: "Số điện thoại", type: "text", required: true },
        { key: "address", label: "Địa chỉ", type: "text" },
      ],
    },
    actions: [
      {
        label: "Sửa thông tin",
        who: ["zoneManager"],
        done: "Đã sửa khách hàng.",
        updatesFacts: true,
        fields: [{ key: "address", label: "Địa chỉ", type: "text", required: true }],
      },
      {
        label: "Gộp với hồ sơ khác",
        who: ["zoneManager"],
        danger: true,
        done: "Đã gộp hồ sơ khách hàng.",
        fields: [{ key: "into", label: "Gộp vào hồ sơ", type: "select", options: CUSTOMERS, required: true }],
      },
    ],
    records: [
      {
        id: "KH-01",
        title: "Đại lý Đức Phát",
        meta: "0912 345 678",
        amount: 85500000,
        facts: [
          ["Số điện thoại", "0912 345 678"],
          ["Địa chỉ", "Cảng Cái Rồng, Vân Đồn"],
          ["Thanh toán", "Trả sau"],
        ],
        sections: [
          {
            title: "Hóa đơn",
            rows: [
              { title: "HD-20261102-01", meta: "02/11/2026", value: "77.500.000 đ", link: { module: "portWeighing", id: "HD-20261102-01" } },
              { title: "HD-20261028-04", meta: "28/10/2026", value: "48.000.000 đ", link: { module: "portWeighing", id: "HD-20261028-04" } },
            ],
          },
        ],
      },
      {
        id: "KH-02",
        title: "Bà Năm Hải Sản",
        meta: "0987 111 222",
        amount: 0,
        facts: [
          ["Số điện thoại", "0987 111 222"],
          ["Địa chỉ", "Chợ Cái Rồng, Vân Đồn"],
          ["Thanh toán", "Trả ngay"],
        ],
        sections: [{ title: "Hóa đơn", rows: [{ title: "HD-20261103-02", meta: "03/11/2026", value: "49.600.000 đ", link: { module: "portWeighing", id: "HD-20261103-02" } }] }],
      },
      {
        id: "KH-03",
        title: "Công ty Hải sản Vân Đồn",
        meta: "0203 388 999",
        amount: 85000000,
        facts: [
          ["Số điện thoại", "0203 388 999"],
          ["Địa chỉ", "Khu kinh tế Vân Đồn"],
          ["Thanh toán", "Trả sau"],
        ],
        sections: [{ title: "Hóa đơn", rows: [{ title: "HD-20261104-03", meta: "04/11/2026", value: "85.000.000 đ", link: { module: "portWeighing", id: "HD-20261104-03" } }] }],
      },
    ],
  },
  {
    key: "portWeighing",
    title: "Hóa đơn bán tại cảng",
    useCases: "SALE-05 đến SALE-09",
    statuses: {
      unpaid: { label: "Chưa thu", tone: "danger" },
      partial: { label: "Thu một phần", tone: "warning" },
      paid: { label: "Đã thu đủ", tone: "success" },
      cancelled: { label: "Đã hủy", tone: "neutral" },
    },
    summary: [
      { label: "Doanh thu", kind: "sum", statuses: ["unpaid", "partial", "paid"] },
      { label: "Chưa thu xong", kind: "count", statuses: ["unpaid", "partial"], tone: "danger" },
    ],
    create: {
      label: "Lập hóa đơn",
      who: ["zoneManager"],
      idPrefix: "HD",
      titleField: "customer",
      metaFields: ["lot", "kg"],
      amountField: "amount",
      status: "unpaid",
      done: "Đã lập hóa đơn.",
      fields: [
        { key: "customer", label: "Khách hàng", type: "select", options: CUSTOMERS, required: true },
        { key: "lot", label: "Lô thu hoạch", type: "select", options: LOTS, required: true },
        { key: "product", label: "Sản phẩm", type: "select", options: ["Hàu sữa", "Hàu béo"], required: true },
        { key: "kg", label: "Số kg đã cân", type: "number", required: true },
        { key: "amount", label: "Thành tiền", type: "number", required: true },
        { key: "method", label: "Thanh toán", type: "select", options: ["Tiền mặt", "Chuyển khoản", "Trả sau"], required: true },
      ],
    },
    actions: [
      {
        label: "Sửa hóa đơn",
        from: ["unpaid", "partial"],
        who: [],
        done: "Đã sửa hóa đơn.",
        fields: [
          { key: "reason", label: "Lý do sửa", type: "select", options: ["Nhập sai số liệu", "Giảm giá cả hóa đơn"], required: true },
          { key: "note", label: "Nội dung sửa", type: "textarea", required: true },
        ],
      },
      {
        label: "Hủy hóa đơn",
        from: ["unpaid", "partial"],
        to: "cancelled",
        who: [],
        danger: true,
        done: "Đã hủy hóa đơn.",
        fields: [{ key: "reason", label: "Lý do hủy", type: "textarea", required: true }],
      },
    ],
    records: [
      {
        id: "HD-20261102-01",
        title: "Đại lý Đức Phát",
        meta: "HD-20261102-01 · 1.250 kg Hàu sữa",
        amount: 77500000,
        status: "partial",
        facts: [
          ["Ngày", "02/11/2026"],
          ["Sản phẩm", "Hàu sữa"],
          ["Số kg × đơn giá", "1.250 kg × 62.000 đ"],
          ["Đã thu", "40.000.000 đ"],
          ["Còn nợ", "37.500.000 đ"],
          ["Người lập", "Lê Minh Tuấn"],
        ],
        sections: [
          { title: "Lô hàng", rows: [{ title: "LO-2611-01", meta: "Bè B3-01, Vùng nuôi Minh Châu", value: "1.250 kg", link: { module: "harvest", id: "LO-2611-01" } }] },
          { title: "Thanh toán", rows: [{ title: "PT-2611-01", meta: "03/11/2026 · Chuyển khoản", value: "40.000.000 đ", link: { module: "receipts", id: "PT-2611-01" } }] },
        ],
      },
      {
        id: "HD-20261103-02",
        title: "Bà Năm Hải Sản",
        meta: "HD-20261103-02 · 800 kg Hàu sữa",
        amount: 49600000,
        status: "paid",
        facts: [
          ["Ngày", "03/11/2026"],
          ["Sản phẩm", "Hàu sữa"],
          ["Số kg × đơn giá", "800 kg × 62.000 đ"],
          ["Đã thu", "49.600.000 đ"],
          ["Người lập", "Lê Minh Tuấn"],
        ],
        sections: [
          { title: "Lô hàng", rows: [{ title: "LO-2611-01", meta: "Bè B3-01, Vùng nuôi Minh Châu", value: "800 kg", link: { module: "harvest", id: "LO-2611-01" } }] },
          { title: "Thanh toán", rows: [{ title: "PT-2611-02", meta: "03/11/2026 · Tiền mặt", value: "49.600.000 đ", link: { module: "receipts", id: "PT-2611-02" } }] },
        ],
      },
      {
        id: "HD-20261104-03",
        title: "Công ty Hải sản Vân Đồn",
        meta: "HD-20261104-03 · 1.000 kg Hàu béo",
        amount: 85000000,
        status: "unpaid",
        facts: [
          ["Ngày", "04/11/2026"],
          ["Sản phẩm", "Hàu béo"],
          ["Số kg × đơn giá", "1.000 kg × 85.000 đ"],
          ["Còn nợ", "85.000.000 đ"],
          ["Người lập", "Phạm Thị Lan"],
        ],
        sections: [{ title: "Lô hàng", rows: [{ title: "LO-2611-02", meta: "Bè BS-02, Vùng nuôi Bản Sen", value: "1.000 kg", link: { module: "harvest", id: "LO-2611-02" } }] }],
      },
      {
        id: "HD-20261028-04",
        title: "Đại lý Đức Phát",
        meta: "HD-20261028-04 · 600 kg Hàu béo",
        amount: 48000000,
        status: "unpaid",
        facts: [
          ["Ngày", "28/10/2026"],
          ["Sản phẩm", "Hàu béo"],
          ["Số kg × đơn giá", "600 kg × 80.000 đ"],
          ["Còn nợ", "48.000.000 đ"],
          ["Tuổi nợ", "8 ngày"],
          ["Người lập", "Lê Minh Tuấn"],
        ],
        sections: [{ title: "Lô hàng", rows: [{ title: "LO-2610-05", meta: "Bè MC-04, Vùng nuôi Minh Châu", value: "600 kg", link: { module: "harvest", id: "LO-2610-05" } }] }],
      },
      {
        id: "HD-20261020-05",
        title: "Công ty Hải sản Vân Đồn",
        meta: "HD-20261020-05 · 400 kg Hàu béo",
        amount: 30000000,
        status: "cancelled",
        facts: [
          ["Ngày", "20/10/2026"],
          ["Số kg × đơn giá", "400 kg × 75.000 đ"],
          ["Lý do hủy", "Khách đổi lịch, không nhận hàng"],
        ],
      },
    ],
  },
  {
    key: "claims",
    title: "Khiếu nại",
    useCases: "CLAIM-01 đến CLAIM-03",
    statuses: {
      waiting: { label: "Chờ phản hồi", tone: "warning" },
      accepted: { label: "Đã chấp nhận", tone: "success" },
      rejected: { label: "Đã từ chối", tone: "neutral" },
      returned: { label: "Đã trả hàng", tone: "neutral" },
    },
    summary: [{ label: "Chờ phản hồi", kind: "count", statuses: ["waiting"], tone: "warning" }],
    create: {
      label: "Gửi khiếu nại",
      who: ["trader"],
      idPrefix: "KN",
      titleField: "invoice",
      metaFields: ["problem"],
      status: "waiting",
      done: "Đã gửi khiếu nại.",
      fields: [
        { key: "invoice", label: "Hóa đơn", type: "select", options: ["HD-20261102-01", "HD-20261028-04"], required: true },
        { key: "problem", label: "Vấn đề", type: "select", options: ["Hàu chết nhiều", "Sai cỡ", "Thiếu số kg"], required: true },
        { key: "note", label: "Mô tả", type: "textarea", required: true },
        { key: "photo", label: "Chụp ảnh hàng", type: "photo" },
      ],
    },
    actions: [
      {
        label: "Chấp nhận",
        from: ["waiting"],
        to: "accepted",
        who: [],
        done: "Đã chấp nhận khiếu nại.",
        fields: [
          { key: "offer", label: "Cách xử lý", type: "select", options: ["Trả lại toàn bộ hàng", "Giảm giá cả hóa đơn"], required: true },
          { key: "note", label: "Ghi chú", type: "textarea" },
        ],
      },
      {
        label: "Từ chối",
        from: ["waiting"],
        to: "rejected",
        who: [],
        danger: true,
        done: "Đã từ chối khiếu nại.",
        fields: [{ key: "note", label: "Lý do từ chối", type: "textarea", required: true }],
      },
      {
        label: "Lập phiếu trả hàng",
        from: ["accepted"],
        to: "returned",
        who: ["zoneManager"],
        done: "Đã lập phiếu trả hàng.",
        fields: [{ key: "resell", label: "Hàu trả về", type: "select", options: ["Bán lại được", "Không bán lại được"], required: true }],
      },
    ],
    records: [
      {
        id: "KN-2611-01",
        title: "HD-20261028-04",
        meta: "Đại lý Đức Phát · Hàu chết nhiều",
        status: "waiting",
        facts: [
          ["Ngày gửi", "30/10/2026"],
          ["Mô tả", "Khoảng 6% hàu chết khi về tới kho."],
        ],
        sections: [{ title: "Hóa đơn", rows: [{ title: "HD-20261028-04", meta: "600 kg Hàu béo", value: "48.000.000 đ", link: { module: "portWeighing", id: "HD-20261028-04" } }] }],
      },
      {
        id: "KN-2610-02",
        title: "HD-20261020-05",
        meta: "Công ty Hải sản Vân Đồn · Sai cỡ",
        status: "rejected",
        facts: [
          ["Ngày gửi", "21/10/2026"],
          ["Lý do từ chối", "Hóa đơn đã hủy, không có hàng giao."],
        ],
      },
    ],
  },
  {
    key: "payment",
    title: "Công nợ của tôi",
    useCases: "DEBT-04",
    summary: [{ label: "Còn nợ", kind: "sum", tone: "danger" }],
    emptyText: "Bạn không còn khoản nợ nào",
    records: [
      {
        id: "HD-20261102-01",
        title: "HD-20261102-01",
        meta: "02/11/2026 · 1.250 kg Hàu sữa",
        amount: 37500000,
        facts: [
          ["Tổng hóa đơn", "77.500.000 đ"],
          ["Đã trả", "40.000.000 đ"],
          ["Cách trả", "Khi có chức năng thật sẽ trả qua Zalo"],
        ],
      },
      {
        id: "HD-20261028-04",
        title: "HD-20261028-04",
        meta: "28/10/2026 · 600 kg Hàu béo",
        amount: 48000000,
        facts: [
          ["Tổng hóa đơn", "48.000.000 đ"],
          ["Đã trả", "0 đ"],
          ["Tuổi nợ", "8 ngày"],
          ["Cách trả", "Khi có chức năng thật sẽ trả qua Zalo"],
        ],
      },
    ],
  },
  {
    key: "weighSlips",
    title: "Phiếu cân của tôi",
    useCases: "SALE-10",
    records: [
      { id: "HD-20261102-01", title: "HD-20261102-01", meta: "02/11/2026 · Cảng Cái Rồng", value: "1.250 kg", facts: [["Sản phẩm", "Hàu sữa"], ["Lô hàng", "LO-2611-01"], ["Người cân", "Lê Minh Tuấn"]] },
      { id: "HD-20261028-04", title: "HD-20261028-04", meta: "28/10/2026 · Cảng Cái Rồng", value: "600 kg", facts: [["Sản phẩm", "Hàu béo"], ["Lô hàng", "LO-2610-05"], ["Người cân", "Lê Minh Tuấn"]] },
    ],
  },
  {
    key: "pickup",
    title: "Lịch nhận hàng",
    useCases: "SALE-10",
    statuses: {
      upcoming: { label: "Sắp tới", tone: "warning" },
      done: { label: "Đã nhận", tone: "success" },
    },
    records: [
      { id: "LH-01", title: "07/11/2026, 07:00", meta: "Cảng Cái Rồng · khoảng 30 lồng", status: "upcoming", facts: [["Sản phẩm", "Hàu sữa"], ["Liên hệ tại cảng", "Lê Minh Tuấn, 0900 000 011"]] },
      { id: "LH-02", title: "02/11/2026, 06:30", meta: "Cảng Cái Rồng · 25 lồng", status: "done", facts: [["Sản phẩm", "Hàu sữa"], ["Hóa đơn", "HD-20261102-01"]] },
    ],
  },
];
