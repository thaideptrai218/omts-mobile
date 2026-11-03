/** Cỡ chữ của app. Mặc định đã là chữ lớn cho người lớn tuổi; "xlarge" phóng thêm khoảng 12%. */
export type TextSize = "large" | "xlarge";

export type TextSizeOption = {
  key: TextSize;
  label: string;
  hint: string;
};
