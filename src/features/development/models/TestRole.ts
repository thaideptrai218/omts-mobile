export type TestRole = "Owner" | "ZoneManager" | "Employee" | "Trader";

/** Thêm Kế toán, vì công cụ thử vai trò của backend chưa có vai trò này. */
export type DevRole = TestRole | "Accountant";

export type TestRoleAvailability = {
  currentRole: TestRole;
  roles: TestRole[];
};
