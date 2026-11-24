import type { Paged } from "@/models/Pagination";

/**
 * Cân tại cảng từng lồng (chốt 24/11/2026, OMTS-227): mỗi lần thu hàng cho một đơn là một lô thu hoạch, cân từng lồng, mỗi lồng lưu ngay lên server,
 * xong bấm "Hoàn tất" để lô lấy tổng kg các lồng. Hợp đồng theo `api/harvest-lots/{id}/cages` và `api/harvest-lots/{id}/weigh` của backend.
 */

/** Một lồng đã cân, theo thứ tự cân. `number` là số cấp lúc cân; lồng đã xóa để lại khoảng trống, nên màn hình hiện thứ tự trong danh sách. */
export type LotCage = {
  id: string;
  number: number;
  productId: string | null;
  kg: number;
  weighedAt: string;
};

/** Dòng sản phẩm của lô trên phiếu cân (lô chỉ có một loại hàu). */
export type LotCageProduct = {
  lineNumber: number;
  productId: string;
  productCode: string;
  productName: string;
  harvestedCages: number;
  weighedCages: number;
  cagesKg: number;
  weighedKg: number | null;
};

/** Một lồng thương lái tự cân bên cạnh HTX (chốt 24/11/2026, OMTS-227), theo thứ tự cân; số của HTX mới là số chính thức. */
export type LotTraderCage = {
  id: string;
  number: number;
  kg: number;
  weighedAt: string;
};

/** Thương lái đã đồng ý số cân của lần hoàn tất hiện tại: kg HTX đã chốt và lúc đồng ý. */
export type LotWeighingAgreement = {
  agreedAt: string;
  agreedKg: number;
};

/**
 * Phiếu cân của một lô, chung cho nhân viên (`api/harvest-lots/{id}/cages`) và thương lái (`api/me/weighings/{id}`).
 * `needsCompleting`: các lồng khác lần hoàn tất trước (chưa hoàn tất, hoặc đã sửa sau đó). `traderName` null: lô không có thương lái
 * (khách vãng lai, lô ngoài kế hoạch, kế hoạch phục vụ đơn của nhiều thương lái), không cần đồng ý và không có cột thương lái.
 * `agreement` null khi chưa đồng ý, hoặc thỏa thuận cũ không còn khớp lần hoàn tất hiện tại. `canAgree` chỉ có ở phía thương lái.
 */
export type LotWeighingSheet = {
  lotId: string;
  lotCode: string;
  statusId: number;
  status: string;
  rowVersion: string;
  harvestedCages: number;
  estimatedKg: number;
  cages: LotCage[];
  products: LotCageProduct[];
  cagesKg: number;
  weighedKg: number | null;
  weighedAt: string | null;
  needsCompleting: boolean;
  /** Nhân viên: được cân lồng của HTX; thương lái: được cân lồng của mình (lô chưa đóng). */
  canEdit: boolean;
  /** Các đơn chưa hủy mà kế hoạch của lô phục vụ; rỗng khi lô ngoài kế hoạch. */
  orderCodes: string[];
  traderName: string | null;
  traderCages: LotTraderCage[];
  traderCagesKg: number;
  agreement: LotWeighingAgreement | null;
  needsAgreement: boolean;
  canAgree: boolean;
};

/** Cân thêm một lồng. Không gửi sản phẩm: server lấy loại hàu của lô. `clientOperationId` giữ nguyên khi gửi lại sau lỗi mạng để không cân trùng. */
export type AddLotCage = {
  kg: number;
  clientOperationId: string;
};

export type UpdateLotCage = {
  kg: number;
};

/** "Hoàn tất" phiếu cân: phiên bản của lô đọc từ phiếu cân. */
export type CompleteLotWeighing = {
  rowVersion: string;
};

/** "Đồng ý số cân" của thương lái: phiên bản của lô đọc từ phiếu cân; HTX vừa hoàn tất lại thì server trả 409 MSG06. */
export type AgreeLotWeighing = {
  rowVersion: string;
};

export type LotWeighed = {
  lot: { id: string; lotCode: string; weighedKg: number | null; statusId: number; status: string };
  message: string;
  messageCode: string;
};

/** Một lô trong danh sách cân tại cảng (`GET api/harvest-lots`). */
export type WeighingLotRow = {
  id: string;
  lotCode: string;
  harvestedAt: string;
  zoneCode: string;
  raftCode: string;
  products: { productId: string; code: string; name: string }[];
  cageCount: number;
  estimatedKg: number;
  weighedKg: number | null;
  weighedAt: string | null;
  statusId: number;
  status: string;
  harvestPlan: { id: string; code: string } | null;
};

export type WeighingLotPage = Paged<WeighingLotRow>;

/** Một lô trong "Phiếu cân của tôi" (`GET api/me/weighings`): lồng HTX và lồng thương lái đã cân, số HTX đã chốt và việc đồng ý. */
export type TraderWeighingRow = {
  lotId: string;
  lotCode: string;
  harvestedAt: string;
  orderCodes: string[];
  productName: string | null;
  cageCount: number;
  cagesKg: number;
  traderCageCount: number;
  traderCagesKg: number;
  /** Null: HTX chưa hoàn tất phiếu cân. */
  weighedKg: number | null;
  weighedAt: string | null;
  statusId: number;
  status: string;
  agreed: boolean;
  needsAgreement: boolean;
};

export type TraderWeighingPage = Paged<TraderWeighingRow>;
