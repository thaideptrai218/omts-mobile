/** Kỳ của sao kê công nợ; bỏ trống cả hai là tháng hiện tại (backend tự lấy). */
export type StatementPeriod = {
  from?: string | null;
  to?: string | null;
};

export type StatementPeriodChoice = "month" | "lastMonth" | "threeMonths" | "year" | "custom";
