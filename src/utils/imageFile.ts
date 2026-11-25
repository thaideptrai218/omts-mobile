import type { FrameRect, QuarterTurns } from "@/models/FrameRect";
import type { GrayImage } from "@/models/GrayImage";

import { otsu, removeLines, skewAngle } from "@/utils/tableImage";

/** Gắn ảnh vào form tải lên, tên tệp đúng loại ảnh để backend nhận. */
export function appendPhoto(form: FormData, field: string, photo: Blob) {
  const name = photo.type === "image/png" ? "photo.png" : photo.type === "image/webp" ? "photo.webp" : "photo.jpg";
  form.append(field, photo, name);
}

function loadImage(image: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(image);
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("Không đọc được ảnh."));
    element.src = url;
  }).finally(() => URL.revokeObjectURL(url));
}

/**
 * Giữ nguyên ảnh đã đủ nhỏ; ảnh lớn hơn `maxBytes` được thu về cạnh dài `maxSide` và lưu JPEG nền trắng.
 * Ảnh chụp từ điện thoại thường vượt giới hạn của logo.
 */
export async function shrinkImage(image: Blob, maxBytes: number, maxSide = 1024): Promise<Blob> {
  if (image.size <= maxBytes) return image;
  const element = await loadImage(image);
  const scale = Math.min(1, maxSide / Math.max(element.naturalWidth, element.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(element.naturalWidth * scale);
  canvas.height = Math.round(element.naturalHeight * scale);
  const context = canvas.getContext("2d");
  if (!context) return image;
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(element, 0, 0, canvas.width, canvas.height);
  const shrunk = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  return shrunk ?? image;
}

/** Khung trên ảnh đã xoay `turns` lần 90° (chiều kim đồng hồ) → khung tương ứng trên ảnh gốc. */
function sourceFrame({ left, top, right, bottom }: FrameRect, turns: QuarterTurns): FrameRect {
  if (turns === 1) return { left: top, top: 1 - right, right: bottom, bottom: 1 - left };
  if (turns === 2) return { left: 1 - right, top: 1 - bottom, right: 1 - left, bottom: 1 - top };
  if (turns === 3) return { left: 1 - bottom, top: left, right: 1 - top, bottom: right };
  return { left, top, right, bottom };
}

/** Vẽ phần `frame` của ảnh (khung tính trên ảnh đã xoay) lên canvas đã xoay, cạnh dài khoảng `longSide` px. */
async function drawFramed(image: Blob, frame: FrameRect, turns: QuarterTurns, longSide: number, maxScale: number) {
  const element = await loadImage(image);
  const source = sourceFrame(frame, turns);
  const sx = source.left * element.naturalWidth;
  const sy = source.top * element.naturalHeight;
  const sw = Math.max(1, (source.right - source.left) * element.naturalWidth);
  const sh = Math.max(1, (source.bottom - source.top) * element.naturalHeight);
  const scale = Math.min(maxScale, longSide / Math.max(sw, sh));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round((turns % 2 ? sh : sw) * scale);
  canvas.height = Math.round((turns % 2 ? sw : sh) * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Thiết bị chưa xử lý được ảnh.");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((turns * Math.PI) / 2);
  context.drawImage(element, sx, sy, sw, sh, (-sw * scale) / 2, (-sh * scale) / 2, sw * scale, sh * scale);
  context.setTransform(1, 0, 0, 1, 0, 0);
  return { canvas, context };
}

const toBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) =>
  new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Thiết bị chưa xử lý được ảnh."))), type, quality));

/** Ảnh xem trước đã xoay, cạnh dài tối đa `maxSide` px, để kéo khung chọn trên đó. */
export async function rotatedPreview(image: Blob, turns: QuarterTurns, maxSide = 1400): Promise<Blob> {
  const { canvas } = await drawFramed(image, { left: 0, top: 0, right: 1, bottom: 1 }, turns, maxSide, 1);
  return toBlob(canvas, "image/jpeg", 0.85);
}

/** Ảnh xám của canvas (độ sáng theo hệ số Rec. 601). */
function grayOf(context: CanvasRenderingContext2D, width: number, height: number): GrayImage {
  const rgba = context.getImageData(0, 0, width, height).data;
  const data = new Uint8ClampedArray(width * height);
  for (let i = 0, j = 0; j < data.length; i += 4, j += 1) data[j] = 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2];
  return { width, height, data };
}

/** Xoay canvas một góc nhỏ (độ, chiều kim đồng hồ) quanh tâm, phần mới lộ ra tô trắng. */
function rotateCanvas(source: HTMLCanvasElement, degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(source.width * cos + source.height * sin);
  canvas.height = Math.round(source.width * sin + source.height * cos);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Thiết bị chưa xử lý được ảnh.");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate(radians);
  context.drawImage(source, -source.width / 2, -source.height / 2);
  context.setTransform(1, 0, 0, 1, 0, 0);
  return { canvas, context };
}

/**
 * Cắt và xoay phần ảnh cần đọc chữ, phóng to chữ nhỏ (tối đa 3 lần, cạnh dài khoảng 2.400 px), chuyển sang ảnh xám, tự chỉnh
 * nghiêng rồi xóa đường kẻ ô (`tableImage`). Tesseract đọc tốt nhất khi chữ cao khoảng 30 px; chữ trong bảng tọa độ chụp
 * cả tờ sơ đồ thường chỉ cao 10 đến 15 px.
 */
export async function ocrImage(image: Blob, frame: FrameRect, turns: QuarterTurns): Promise<Blob> {
  let { canvas, context } = await drawFramed(image, frame, turns, 2400, 3);
  let gray = grayOf(context, canvas.width, canvas.height);
  const threshold = otsu(gray);
  const angle = skewAngle(gray, threshold);
  if (Math.abs(angle) >= 0.1) {
    ({ canvas, context } = rotateCanvas(canvas, angle));
    gray = grayOf(context, canvas.width, canvas.height);
  }
  removeLines(gray, threshold);
  const pixels = context.createImageData(canvas.width, canvas.height);
  for (let i = 0, j = 0; j < gray.data.length; i += 4, j += 1) {
    pixels.data[i] = gray.data[j];
    pixels.data[i + 1] = gray.data[j];
    pixels.data[i + 2] = gray.data[j];
    pixels.data[i + 3] = 255;
  }
  context.putImageData(pixels, 0, 0);
  return toBlob(canvas, "image/png");
}
