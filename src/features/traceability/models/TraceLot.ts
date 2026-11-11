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
  weight: string;
  water: string;
  steps: TraceStep[];
};
