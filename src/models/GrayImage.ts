/** Ảnh xám một kênh, mỗi điểm ảnh một byte (0 đen, 255 trắng), hàng nối tiếp hàng. */
export type GrayImage = {
  width: number;
  height: number;
  data: Uint8ClampedArray;
};
