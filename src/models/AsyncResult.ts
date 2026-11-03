export type Settled<T> = {
  status: "fulfilled";
  value: T;
} | {
  status: "rejected";
};
