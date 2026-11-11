import type { MockModule } from "@/features/mock/models/MockModule";

/** Báo cáo, nhật ký hệ thống và gửi thông báo. Số báo cáo cộng từ các hóa đơn mẫu ở `sales.ts`, không tính hóa đơn đã hủy. */
export const ADMIN_MODULES: MockModule[] = [
  {
    key: "reports",
    title: "Báo cáo",
    useCases: "REPORT-01 đến REPORT-03, HARVEST-04",
    records: [
      {
        id: "RP-SALES",
        title: "Doanh thu",
        meta: "01/10/2026 đến 05/11/2026",
        amount: 260100000,
        facts: [["Số hóa đơn", "4"], ["Sản lượng bán", "3.650 kg"]],
        sections: [
          {
            title: "Theo khách hàng",
            rows: [
              { title: "Đại lý Đức Phát", value: "125.500.000 đ" },
              { title: "Công ty Hải sản Vân Đồn", value: "85.000.000 đ" },
              { title: "Bà Năm Hải Sản", value: "49.600.000 đ" },
            ],
          },
          {
            title: "Theo sản phẩm",
            rows: [
              { title: "Hàu béo", meta: "1.600 kg", value: "133.000.000 đ" },
              { title: "Hàu sữa", meta: "2.050 kg", value: "127.100.000 đ" },
            ],
          },
          {
            title: "Theo vùng nuôi",
            rows: [
              { title: "Vùng nuôi Minh Châu", value: "175.100.000 đ" },
              { title: "Vùng nuôi Bản Sen", value: "85.000.000 đ" },
            ],
          },
        ],
      },
      {
        id: "RP-PRICE",
        title: "Xu hướng giá",
        meta: "Đơn giá trung bình theo tháng",
        facts: [],
        sections: [
          {
            title: "Hàu sữa",
            rows: [
              { title: "Tháng 9/2026", value: "60.000 đ/kg" },
              { title: "Tháng 10/2026", value: "61.000 đ/kg" },
              { title: "Tháng 11/2026", value: "62.000 đ/kg" },
            ],
          },
          {
            title: "Hàu béo",
            rows: [
              { title: "Tháng 9/2026", value: "78.000 đ/kg" },
              { title: "Tháng 10/2026", value: "80.000 đ/kg" },
              { title: "Tháng 11/2026", value: "85.000 đ/kg" },
            ],
          },
        ],
      },
      {
        id: "RP-ISSUES",
        title: "Vấn đề sau bán",
        meta: "01/10/2026 đến 05/11/2026",
        facts: [
          ["Khiếu nại", "2"],
          ["Trả hàng", "0"],
          ["Giảm giá sau bán", "2.000.000 đ"],
          ["Hóa đơn đã hủy", "1 (30.000.000 đ)"],
        ],
        sections: [
          {
            title: "Theo khách hàng",
            rows: [
              { title: "Đại lý Đức Phát", meta: "1 khiếu nại, đang chờ phản hồi" },
              { title: "Công ty Hải sản Vân Đồn", meta: "1 khiếu nại đã từ chối, 1 hóa đơn đã hủy" },
              { title: "Bà Năm Hải Sản", meta: "Giảm giá sau bán" },
            ],
          },
        ],
      },
      {
        id: "RP-YIELD",
        title: "Sản lượng nuôi",
        meta: "So sánh ước tính, đã bán và hao hụt",
        value: "4.120 kg",
        facts: [
          ["Ước tính khi thu hoạch", "4.120 kg"],
          ["Đã bán", "3.650 kg"],
          ["Còn trong lô đang mở", "450 kg"],
          ["Hao hụt", "20 kg"],
        ],
        sections: [
          {
            title: "Theo lô",
            rows: [
              { title: "LO-2611-01", meta: "Bè B3-01 · đã bán 2.050 kg", value: "2.100 kg", link: { module: "harvest", id: "LO-2611-01" } },
              { title: "LO-2611-02", meta: "Bè BS-02 · đã bán 1.000 kg", value: "1.400 kg", link: { module: "harvest", id: "LO-2611-02" } },
              { title: "LO-2610-05", meta: "Bè MC-04 · đã bán 600 kg", value: "620 kg", link: { module: "harvest", id: "LO-2610-05" } },
            ],
          },
        ],
      },
    ],
  },
  {
    key: "auditLog",
    title: "Nhật ký hệ thống",
    useCases: "ACCOUNT-10",
    summary: [{ label: "Số thao tác", kind: "count" }],
    records: [
      { id: "AU-01", title: "Sửa ngưỡng nước", meta: "05/11/2026, 08:15 · Chủ HTX", facts: [["Bản ghi", "Vùng nuôi Bản Sen"], ["Trước", "Độ mặn 18 đến 30 ‰"], ["Sau", "Độ mặn 20 đến 30 ‰"]] },
      { id: "AU-02", title: "Cấp vai trò Quản lý vùng", meta: "04/11/2026, 16:40 · Chủ HTX", facts: [["Người được cấp", "Phạm Thị Lan"], ["Phạm vi", "Vùng nuôi Bản Sen"]] },
      { id: "AU-03", title: "Hoàn tất phiếu nhập", meta: "04/11/2026, 10:02 · Lê Minh Tuấn", facts: [["Bản ghi", "PN-2610-08"], ["Số tiền", "12.000.000 đ"]] },
      { id: "AU-04", title: "Đăng nhập thất bại 3 lần", meta: "03/11/2026, 21:10 · Hệ thống", facts: [["Tài khoản", "nhanvien.hethan"], ["Kênh", "Bản web"]] },
    ],
  },
  {
    key: "broadcast",
    title: "Gửi thông báo",
    useCases: "Chưa có trong SRS",
    create: {
      label: "Soạn thông báo",
      who: [],
      idPrefix: "TB",
      titleField: "title",
      metaFields: ["to"],
      done: "Đã gửi thông báo.",
      fields: [
        { key: "to", label: "Gửi đến", type: "select", options: ["Tất cả nhân viên", "Quản lý vùng", "Thương lái"], required: true },
        { key: "title", label: "Tiêu đề", type: "text", required: true },
        { key: "body", label: "Nội dung", type: "textarea", required: true },
      ],
    },
    records: [
      { id: "TB-01", title: "Tạm dừng thu hoạch do gió mùa", meta: "Tất cả nhân viên · 01/11/2026", facts: [["Nội dung", "Dừng ra bè ngày 02/11/2026 vì gió cấp 6."]] },
      { id: "TB-02", title: "Lịch nhận hàng tuần này", meta: "Thương lái · 30/10/2026", facts: [["Nội dung", "Cảng Cái Rồng mở từ 06:00 đến 16:00."]] },
    ],
  },
];
