/**
 * Lưu ý của backend sau khi lưu (không chặn lưu). `code`: COORDINATES_OUTSIDE_VIETNAM, RAFT_FAR_FROM_ZONE,
 * RAFT_OUTSIDE_ZONE_BOUNDARY (`details.distanceM`), RAFTS_OUTSIDE_ZONE_BOUNDARY (`details.count`, `details.raftCodes`)…
 * `message` là tiếng Anh, app dựng câu tiếng Việt theo `code`.
 */
export type FarmingWarning = {
  code: string;
  message: string;
  details?: Record<string, unknown> | null;
};
