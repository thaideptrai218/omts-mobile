/** Khung chọn trên ảnh, tính theo tỉ lệ 0 đến 1 của chiều rộng và chiều cao ảnh. */
export type FrameRect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

/** Số lần xoay ảnh 90° theo chiều kim đồng hồ. */
export type QuarterTurns = 0 | 1 | 2 | 3;
