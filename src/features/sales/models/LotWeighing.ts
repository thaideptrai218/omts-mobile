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

/** Phiếu cân của một lô. `needsCompleting`: các lồng khác lần hoàn tất trước (chưa hoàn tất, hoặc đã sửa sau đó). */
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
  canEdit: boolean;
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
