export type TraceStep = {
  title: string;
  date: string;
  detail: string;
};

export type TraceLot = {
  code: string;
  product: string;
  zone: string;
  harvestDate: string;
  weight: string;
  water: string;
  steps: TraceStep[];
};
