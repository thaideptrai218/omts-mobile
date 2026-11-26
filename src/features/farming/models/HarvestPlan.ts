/*
 * Kế hoạch thu hoạch (KHT) theo `api/harvest-plans` của backend (chốt 24-26/11/2026). Chủ HTX lập và giao kế hoạch trên web;
 * trên điện thoại người thực hiện (Quản lý vùng, hoặc Chủ HTX tự thu) nhận kế hoạch, ghi nhận thu từng bè, bàn giao, và Chủ HTX
 * hoàn thành. Mỗi dòng là một bè; ghi nhận thu của dòng tạo một lô thu hoạch "Chờ cân", lô đó cân từng lồng ở "Cân tại cảng".
 */

/** Nút người dùng được bấm trên kế hoạch, do backend quyết (`allowedActions`). */
export type HarvestPlanAction = "Edit" | "Assign" | "Finish" | "Cancel" | "Harvest" | "SkipLane" | "Receive" | "HandOver";

/** Ai thu: Quản lý vùng của các vùng trong kế hoạch, hoặc Chủ HTX tự thu (không có bước nhận và bàn giao). */
export type HarvestPlanExecutor = "ZoneManager" | "Owner";

export type HarvestPlanLaneState = "Planned" | "Harvested" | "Skipped";

/** Dòng còn chờ thu, đã có lô, hoặc xong vì mọi luống đều "Không thu". */
export type HarvestPlanLineState = "Open" | "Harvested" | "Skipped";

export type HarvestPlanZone = { id: string; code: string; name: string };

export type HarvestPlanProduct = { id: string; code: string; name: string; sizeMinCm: number | null; sizeMaxCm: number | null };

export type HarvestPlanOrder = { id: string; code: string; statusId: number; status: string; customer: { id: string; code: string; name: string } | null };

export type HarvestPlanPerson = { id: string; name: string };

export type HarvestPlanLane = {
  laneId: string;
  laneNumber: number;
  state: HarvestPlanLaneState;
  lotCode: string | null;
  skippedAt: string | null;
  skippedBy: HarvestPlanPerson | null;
  skipReason: string | null;
};

/** Lô đã ghi từ dòng kế hoạch. */
export type HarvestPlanLot = { id: string; lotCode: string; cageCount: number; estimatedKg: number; harvestedAt: string };

export type HarvestPlanLine = {
  id: string;
  lineNumber: number;
  raftId: string;
  raftCode: string;
  zone: HarvestPlanZone;
  expectedProduct: HarvestPlanProduct | null;
  expectedCageCount: number | null;
  note: string | null;
  state: HarvestPlanLineState;
  lot: HarvestPlanLot | null;
  lanes: HarvestPlanLane[];
  /** Ghi nhận thu và bỏ luống được ngay lúc này (người dùng vẫn cần quyền ghi thu hoạch của vùng). */
  canHarvest: boolean;
  locked: boolean;
  /** Ngày hàu của bè dự kiến đủ ngày thu; chỉ để nhắc trước khi thu sớm, không chặn. */
  expectedHarvestDate: string | null;
};

export type HarvestPlanProgress = { lines: number; linesDone: number; lanes: number; lanesHarvested: number; lanesSkipped: number };

export type HarvestPlan = {
  id: string;
  code: string;
  statusId: number;
  status: string;
  executor: HarvestPlanExecutor;
  zones: HarvestPlanZone[];
  plannedAt: string;
  note: string | null;
  createdBy: HarvestPlanPerson | null;
  assignedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  lines: HarvestPlanLine[];
  orders: HarvestPlanOrder[];
  progress: HarvestPlanProgress;
  allowedActions: HarvestPlanAction[];
  rowVersion: string;
};

/** Một dòng của danh sách kế hoạch (`GET api/harvest-plans`). */
export type HarvestPlanListItem = {
  id: string;
  code: string;
  statusId: number;
  status: string;
  executor: HarvestPlanExecutor;
  zones: HarvestPlanZone[];
  plannedAt: string;
  note: string | null;
  raftCodes: string[];
  orders: HarvestPlanOrder[];
  progress: HarvestPlanProgress;
  rowVersion: string;
  expectedCageCount: number | null;
};

/** Kế hoạch người dùng đang thực hiện được (`GET api/harvest-plans/assigned`): đã giao, đã nhận hoặc đang thu. */
export type HarvestPlansToHarvest = { plans: HarvestPlan[] };

export type HarvestPlanSaved = { plan: HarvestPlan; message: string; messageCode: string };

/** Nút chuyển trạng thái của người thực hiện và Chủ HTX trên điện thoại. */
export type HarvestPlanStep = "receive" | "hand-over" | "finish";

/** Nhân viên được phân công làm ở bè trong ngày, gợi ý làm người thu (`GET api/rafts/{id}/crew-suggestions`). */
export type HarvestCrewMember = { id: string; code: string | null; name: string; attendance: string | null };

export type HarvestCrewSuggestions = { raftId: string; raftCode: string; date: string; employees: HarvestCrewMember[] };

/** Form ghi nhận thu một bè theo kế hoạch: số lồng bắt buộc, kg ước tính, người thu và ảnh (0 đến 3) không bắt buộc. */
export type PlanHarvestDraft = { cageCount: string; estimatedKg: string; crew: string[]; photos: Blob[] };

/** Lô vừa ghi: đi tiếp sang cân lô. */
export type PlanHarvestSaved = { lot: { id: string; lotCode: string; cageCount: number; estimatedKg: number }; message: string; messageCode: string };
