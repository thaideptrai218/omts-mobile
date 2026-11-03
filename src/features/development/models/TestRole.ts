export type TestRole = "Owner" | "ZoneManager" | "Employee" | "Trader";

export type TestRoleAvailability = {
  currentRole: TestRole;
  roles: TestRole[];
};
