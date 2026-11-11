import type { MockModule } from "@/features/mock/models/MockModule";

const ZONES = ["Vùng nuôi Minh Châu", "Vùng nuôi Bản Sen"];
const RAFTS = ["B3-01", "B3-02", "MC-04", "BS-02"];
const SEED_LOTS = ["Lô giống LG-2605-03", "Lô giống LG-2606-01"];

/** Chu kỳ nuôi, thả giống, nhật ký, vật tư, thu hoạch và lô. Các bản ghi trỏ qua lại bằng mã giống nhau. */
export const FARMING_MODULES: MockModule[] = [
  {
    key: "cycles",
    title: "Chu kỳ nuôi",
    useCases: "CYCLE-01, CYCLE-05, CYCLE-06",
    statuses: {
      open: { label: "Đang nuôi", tone: "success" },
      harvesting: { label: "Đang thu hoạch", tone: "warning" },
      closed: { label: "Đã đóng", tone: "neutral" },
    },
    summary: [
      { label: "Đang nuôi", kind: "count", statuses: ["open", "harvesting"], tone: "success" },
      { label: "Đã đóng", kind: "count", statuses: ["closed"] },
    ],
    create: {
      label: "Bắt đầu chu kỳ mới",
      who: ["zoneManager"],
      idPrefix: "CK",
      titleField: "raft",
      metaFields: ["zone", "start"],
      status: "open",
      done: "Đã bắt đầu chu kỳ.",
      fields: [
        { key: "zone", label: "Vùng nuôi", type: "select", options: ZONES, required: true },
        { key: "raft", label: "Bè", type: "select", options: RAFTS, required: true },
        { key: "start", label: "Ngày bắt đầu", type: "date", required: true },
        { key: "seed", label: "Số giống dự kiến (dây)", type: "number" },
        { key: "harvest", label: "Ngày thu hoạch dự kiến", type: "date" },
        { key: "target", label: "Sản lượng mục tiêu (kg)", type: "number" },
      ],
    },
    actions: [
      {
        label: "Đóng chu kỳ",
        from: ["open", "harvesting"],
        to: "closed",
        who: ["zoneManager"],
        danger: true,
        done: "Đã đóng chu kỳ.",
        fields: [{ key: "assessment", label: "Đánh giá vụ nuôi", type: "textarea", required: true }],
      },
    ],
    records: [
      {
        id: "CK-2605-01",
        title: "Bè B3-01 · CK-2605-01",
        meta: "Vùng nuôi Minh Châu · từ 12/05/2026",
        value: "8/10 hàng",
        status: "harvesting",
        facts: [
          ["Vùng nuôi", "Vùng nuôi Minh Châu"],
          ["Bè", "B3-01"],
          ["Ngày bắt đầu", "12/05/2026"],
          ["Giống đã treo", "1.200 dây"],
          ["Thu hoạch dự kiến", "01/11/2026"],
          ["Sản lượng mục tiêu", "5.000 kg"],
          ["Đã thu hoạch", "2.100 kg"],
        ],
        sections: [
          {
            title: "Tình trạng các hàng ngày 05/11/2026",
            rows: [
              { title: "Hàng 1 đến 2", meta: "Đã thu hoạch xong" },
              { title: "Hàng 3 đến 8", meta: "Đang nuôi, hàu đạt cỡ" },
              { title: "Hàng 9 đến 10", meta: "Còn trống" },
            ],
          },
          {
            title: "Thả giống",
            rows: [
              { title: "Hàng 1 đến 5, 600 dây", meta: "12/05/2026 · Lô giống LG-2605-03", link: { module: "seeding", id: "TG-2605-01" } },
              { title: "Hàng 6 đến 8, 600 dây", meta: "20/05/2026 · Lô giống LG-2605-03", link: { module: "seeding", id: "TG-2605-02" } },
            ],
          },
          {
            title: "Nhật ký gần đây",
            rows: [{ title: "Kiểm tra tháng 10", meta: "28/10/2026 · Lê Minh Tuấn", link: { module: "cultivationLog", id: "NK-2610-01" } }],
          },
          {
            title: "Thu hoạch",
            rows: [{ title: "Lô LO-2611-01", meta: "01/11/2026", value: "2.100 kg", link: { module: "harvest", id: "LO-2611-01" } }],
          },
        ],
      },
      {
        id: "CK-2606-02",
        title: "Bè BS-02 · CK-2606-02",
        meta: "Vùng nuôi Bản Sen · từ 03/06/2026",
        value: "6/8 hàng",
        status: "open",
        facts: [
          ["Vùng nuôi", "Vùng nuôi Bản Sen"],
          ["Bè", "BS-02"],
          ["Ngày bắt đầu", "03/06/2026"],
          ["Giống đã treo", "900 dây"],
          ["Thu hoạch dự kiến", "15/12/2026"],
          ["Sản lượng mục tiêu", "4.000 kg"],
        ],
        sections: [{ title: "Thả giống", rows: [{ title: "Hàng 1 đến 6, 900 dây", meta: "03/06/2026 · Lô giống LG-2606-01", link: { module: "seeding", id: "TG-2606-01" } }] }],
      },
      {
        id: "CK-2511-07",
        title: "Bè MC-04 · CK-2511-07",
        meta: "Vùng nuôi Minh Châu · 10/11/2025 đến 30/10/2026",
        value: "620 kg",
        status: "closed",
        facts: [
          ["Vùng nuôi", "Vùng nuôi Minh Châu"],
          ["Bè", "MC-04"],
          ["Số ngày nuôi", "354 ngày"],
          ["Giống đã treo", "300 dây"],
          ["Đã thu hoạch", "620 kg"],
          ["So với mục tiêu", "Đạt 103% (mục tiêu 600 kg)"],
          ["Đánh giá", "Hàu đều cỡ, tỷ lệ hao thấp."],
        ],
        sections: [{ title: "Thu hoạch", rows: [{ title: "Lô LO-2610-05", meta: "26/10/2026", value: "620 kg", link: { module: "harvest", id: "LO-2610-05" } }] }],
      },
    ],
  },
  {
    key: "seeding",
    title: "Thả giống",
    useCases: "CYCLE-02",
    summary: [{ label: "Số lần thả", kind: "count" }],
    create: {
      label: "Ghi lần thả giống",
      who: ["zoneManager"],
      idPrefix: "TG",
      titleField: "lanes",
      metaFields: ["date", "lot"],
      done: "Đã ghi lần thả giống.",
      fields: [
        { key: "cycle", label: "Chu kỳ", type: "select", options: ["CK-2605-01", "CK-2606-02"], required: true },
        { key: "lot", label: "Lô giống", type: "select", options: SEED_LOTS, required: true },
        { key: "lanes", label: "Các hàng thả", type: "text", required: true, value: "Hàng 9 đến 10" },
        { key: "quantity", label: "Số dây", type: "number", required: true },
        { key: "date", label: "Ngày thả", type: "date", required: true },
      ],
    },
    actions: [
      {
        label: "Sửa lần thả",
        who: ["zoneManager"],
        done: "Đã sửa lần thả.",
        updatesFacts: true,
        fields: [
          { key: "quantity", label: "Số dây", type: "number", required: true },
          { key: "reason", label: "Lý do sửa", type: "text", required: true },
        ],
      },
    ],
    records: [
      {
        id: "TG-2605-01",
        title: "Hàng 1 đến 5",
        meta: "12/05/2026 · Lô giống LG-2605-03",
        value: "600 dây",
        facts: [
          ["Chu kỳ", "CK-2605-01"],
          ["Bè", "B3-01"],
          ["Lô giống", "LG-2605-03"],
          ["Số dây", "600"],
          ["Người ghi", "Lê Minh Tuấn"],
        ],
        sections: [{ title: "Nguồn giống", rows: [{ title: "Trại giống Đồng Rui", meta: "Phiếu nhập mẫu PN-2605-11" }] }],
      },
      {
        id: "TG-2605-02",
        title: "Hàng 6 đến 8",
        meta: "20/05/2026 · Lô giống LG-2605-03",
        value: "600 dây",
        facts: [
          ["Chu kỳ", "CK-2605-01"],
          ["Bè", "B3-01"],
          ["Lô giống", "LG-2605-03"],
          ["Số dây", "600"],
          ["Người ghi", "Lê Minh Tuấn"],
        ],
      },
      {
        id: "TG-2606-01",
        title: "Hàng 1 đến 6",
        meta: "03/06/2026 · Lô giống LG-2606-01",
        value: "900 dây",
        facts: [
          ["Chu kỳ", "CK-2606-02"],
          ["Bè", "BS-02"],
          ["Lô giống", "LG-2606-01"],
          ["Số dây", "900"],
          ["Người ghi", "Phạm Thị Lan"],
        ],
      },
    ],
  },
  {
    key: "cultivationLog",
    title: "Nhật ký nuôi",
    useCases: "CYCLE-04",
    summary: [{ label: "Số lần ghi", kind: "count" }],
    create: {
      label: "Ghi nhật ký tháng",
      who: ["zoneManager"],
      idPrefix: "NK",
      titleField: "title",
      metaFields: ["date", "cycle"],
      done: "Đã ghi nhật ký.",
      fields: [
        { key: "cycle", label: "Chu kỳ", type: "select", options: ["CK-2605-01", "CK-2606-02"], required: true },
        { key: "title", label: "Nội dung chính", type: "text", required: true, value: "Kiểm tra tháng 11" },
        { key: "date", label: "Ngày kiểm tra", type: "date", required: true },
        { key: "note", label: "Ghi chú", type: "textarea" },
        { key: "photo", label: "Chụp ảnh bè", type: "photo" },
      ],
    },
    records: [
      {
        id: "NK-2610-01",
        title: "Kiểm tra tháng 10",
        meta: "28/10/2026 · CK-2605-01",
        facts: [
          ["Bè", "B3-01"],
          ["Người ghi", "Lê Minh Tuấn"],
          ["Ghi chú", "Hàu lớn đều, vệ sinh hàng 3 đến 5, thay 12 phao."],
        ],
      },
      {
        id: "NK-2609-02",
        title: "Kiểm tra tháng 9",
        meta: "25/09/2026 · CK-2606-02",
        facts: [
          ["Bè", "BS-02"],
          ["Người ghi", "Phạm Thị Lan"],
          ["Ghi chú", "Có hàu bám, cần san thưa hàng 2."],
        ],
      },
    ],
  },
  {
    key: "materialUsage",
    title: "Vật tư sử dụng",
    useCases: "CYCLE-03",
    summary: [{ label: "Số lần dùng", kind: "count" }],
    create: {
      label: "Ghi vật tư đã dùng",
      who: ["zoneManager"],
      idPrefix: "VT",
      titleField: "item",
      metaFields: ["raft", "date"],
      done: "Đã ghi vật tư.",
      fields: [
        { key: "raft", label: "Bè", type: "select", options: RAFTS, required: true },
        { key: "item", label: "Vật tư", type: "select", options: ["Phao xốp", "Dây treo", "Lồng thu hoạch"], required: true },
        { key: "quantity", label: "Số lượng", type: "number", required: true },
        { key: "date", label: "Ngày dùng", type: "date", required: true },
      ],
    },
    records: [
      { id: "VT-2610-01", title: "Phao xốp", meta: "B3-01 · 28/10/2026", value: "12 cái", facts: [["Chu kỳ", "CK-2605-01"], ["Lý do", "Sửa bè"], ["Người ghi", "Lê Minh Tuấn"]] },
      { id: "VT-2609-04", title: "Dây treo", meta: "BS-02 · 25/09/2026", value: "40 m", facts: [["Chu kỳ", "CK-2606-02"], ["Lý do", "Thay dây đứt"], ["Người ghi", "Phạm Thị Lan"]] },
    ],
  },
  {
    key: "harvest",
    title: "Thu hoạch và lô hàng",
    useCases: "HARVEST-01, HARVEST-02, TRACE-01, TRACE-02, TRACE-04",
    statuses: {
      open: { label: "Đang mở", tone: "success" },
      published: { label: "Đã công bố", tone: "success" },
      closed: { label: "Đã đóng", tone: "neutral" },
      withdrawn: { label: "Đã thu hồi", tone: "danger" },
    },
    summary: [
      { label: "Lô đang bán", kind: "count", statuses: ["open", "published"], tone: "success" },
      { label: "Tổng số lô", kind: "count" },
    ],
    create: {
      label: "Ghi đợt thu hoạch",
      who: ["zoneManager"],
      idPrefix: "LO",
      titleField: "raft",
      metaFields: ["date", "lanes"],
      status: "open",
      done: "Đã ghi đợt thu hoạch và tạo lô.",
      fields: [
        { key: "raft", label: "Bè", type: "select", options: RAFTS, required: true },
        { key: "lanes", label: "Các hàng thu hoạch", type: "text", required: true, value: "Hàng 3 đến 4" },
        { key: "cages", label: "Số lồng đếm trên biển", type: "number", required: true },
        { key: "date", label: "Ngày thu hoạch", type: "date", required: true },
      ],
    },
    actions: [
      {
        label: "Công bố truy xuất",
        from: ["open"],
        to: "published",
        who: ["zoneManager"],
        confirm: "Lô chỉ công bố một lần. Người mua quét QR trên hóa đơn sẽ thấy nguồn gốc của lô này.",
        done: "Đã công bố truy xuất.",
      },
      {
        label: "Đóng lô",
        from: ["open", "published"],
        to: "closed",
        who: ["zoneManager"],
        danger: true,
        done: "Đã đóng lô.",
        fields: [
          { key: "left", label: "Số kg còn lại", type: "number", required: true },
          { key: "reason", label: "Lý do", type: "select", options: ["Hàu chết", "Hao hụt", "Không bán được"], required: true },
        ],
      },
      {
        label: "Thu hồi truy xuất",
        from: ["published"],
        to: "withdrawn",
        danger: true,
        who: [],
        done: "Đã thu hồi truy xuất.",
        fields: [{ key: "reason", label: "Lý do thu hồi", type: "textarea", required: true }],
      },
    ],
    records: [
      {
        id: "LO-2611-01",
        title: "Lô LO-2611-01",
        meta: "Bè B3-01 · 01/11/2026",
        value: "2.100 kg",
        status: "published",
        facts: [
          ["Sản phẩm", "Hàu sữa"],
          ["Số lồng", "42 lồng"],
          ["Ước tính", "2.100 kg (42 lồng × 50 kg)"],
          ["Đã bán", "2.050 kg"],
          ["Còn lại", "50 kg"],
          ["Tự đóng lô sau", "3 ngày"],
        ],
        sections: [
          {
            title: "Nguồn gốc",
            rows: [
              { title: "Chu kỳ CK-2605-01", meta: "Bè B3-01, Vùng nuôi Minh Châu", link: { module: "cycles", id: "CK-2605-01" } },
              { title: "Lô giống LG-2605-03", meta: "Trại giống Đồng Rui", link: { module: "seeding", id: "TG-2605-01" } },
            ],
          },
          {
            title: "Đã bán cho",
            rows: [
              { title: "Đại lý Đức Phát", meta: "HD-20261102-01", value: "1.250 kg", link: { module: "portWeighing", id: "HD-20261102-01" } },
              { title: "Bà Năm Hải Sản", meta: "HD-20261103-02", value: "800 kg", link: { module: "portWeighing", id: "HD-20261103-02" } },
            ],
          },
        ],
      },
      {
        id: "LO-2611-02",
        title: "Lô LO-2611-02",
        meta: "Bè BS-02 · 03/11/2026",
        value: "1.400 kg",
        status: "open",
        facts: [
          ["Sản phẩm", "Hàu béo"],
          ["Số lồng", "28 lồng"],
          ["Ước tính", "1.400 kg (28 lồng × 50 kg)"],
          ["Đã bán", "1.000 kg"],
          ["Còn lại", "400 kg"],
        ],
        sections: [{ title: "Đã bán cho", rows: [{ title: "Công ty Hải sản Vân Đồn", meta: "HD-20261104-03", value: "1.000 kg", link: { module: "portWeighing", id: "HD-20261104-03" } }] }],
      },
      {
        id: "LO-2610-05",
        title: "Lô LO-2610-05",
        meta: "Bè MC-04 · 26/10/2026",
        value: "620 kg",
        status: "closed",
        facts: [
          ["Sản phẩm", "Hàu béo"],
          ["Đã bán", "600 kg"],
          ["Còn lại khi đóng", "20 kg, hàu chết"],
        ],
        sections: [{ title: "Đã bán cho", rows: [{ title: "Đại lý Đức Phát", meta: "HD-20261028-04", value: "600 kg", link: { module: "portWeighing", id: "HD-20261028-04" } }] }],
      },
    ],
  },
  {
    key: "harvestSettings",
    title: "Thông số lô thu hoạch",
    useCases: "HARVEST-03",
    actions: [
      {
        label: "Sửa thông số",
        who: [],
        done: "Đã lưu thông số.",
        updatesFacts: true,
        fields: [
          { key: "kg", label: "Số kg trung bình mỗi lồng", type: "number", required: true, value: "50" },
          { key: "days", label: "Số ngày tự đóng lô", type: "number", required: true, value: "3" },
        ],
      },
    ],
    records: [
      {
        id: "HS-1",
        title: "Thông số đang dùng",
        facts: [
          ["Số kg trung bình mỗi lồng", "50"],
          ["Số ngày tự đóng lô", "3"],
        ],
      },
    ],
  },
];
