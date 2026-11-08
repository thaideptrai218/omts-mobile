/**
 * Tổ chức của HTX cho Chủ HTX: nhân viên (`api/employees`), tài khoản và phân quyền theo vùng (`api/accounts`),
 * vai trò (`api/roles`), hồ sơ HTX (`api/cooperative/profile`). Tạo tài khoản, đặt lại mật khẩu, sửa quyền của
 * vai trò và đổi logo làm trên bản web.
 */
export type ZoneRef = {
  id: string;
  code: string | null;
  name: string | null;
};

export type ZoneLookupItem = ZoneRef & {
  statusId: number;
  status: string | null;
};
