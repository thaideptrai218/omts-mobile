export type TraceStep = {
  title: string;
  date: string;
  detail: string;
};

/** Một lô trên màn truy xuất, chữ đã sẵn để hiện. `withdrawn` có giá trị thì lô đã bị thu hồi và không có thông tin khác. */
export type TraceLot = {
  code: string;
  publisher: string;
  withdrawn: string | null;
  product: string;
  zone: string;
  harvestDate: string;
  /** "98 ngày"; rỗng khi máy chủ không tính được. */
  farmingTime: string;
  steps: TraceStep[];
};

/** Kết quả một lần tra cứu: các lô để hiện, hoặc thông báo của máy chủ khi hóa đơn không có lô nào. */
export type TraceLookupResult = {
  lots: TraceLot[];
  message: string | null;
};
