export type RaftFormSuggestion = {
  code: string;
  size: string;
  laneCount: string;
  location: string;
  notes: string;
  latitude: string;
  longitude: string;
};

/** `reading` của `GET api/rafts/form-scans/{scanId}`: mọi trường chép nguyên như trên giấy, null khi giấy không ghi. */
export type RaftFormScanReading = {
  [Field in keyof RaftFormSuggestion]: string | null;
};
