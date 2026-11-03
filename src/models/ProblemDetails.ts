/** Thân lỗi RFC 7807 của OMTS.Api: `code` là mã thông báo SRS (MSG12…), `detail` là chữ hiển thị. */
export type ProblemDetails = {
  status?: number;
  title?: string;
  detail?: string;
  code?: string;
  [extension: string]: unknown;
};
