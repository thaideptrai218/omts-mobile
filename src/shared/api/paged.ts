/** Trang dữ liệu chung của các API danh sách. */
export type Paged<T> = { items: T[]; page: number; pageSize: number; total: number };
