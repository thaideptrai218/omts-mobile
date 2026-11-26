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

/** Vẽ ảnh thu về cạnh dài `maxSide` (không phóng to) trên nền trắng rồi lưu JPEG; null khi thiết bị không xử lý được. */
async function encodeJpeg(element: HTMLImageElement, maxSide: number, quality: number): Promise<Blob | null> {
  const scale = Math.min(1, maxSide / Math.max(element.naturalWidth, element.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(element.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(element.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(element, 0, 0, canvas.width, canvas.height);
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

/**
 * Giữ nguyên ảnh đã đủ nhỏ; ảnh lớn hơn `maxBytes` được thu về cạnh dài `maxSide` và lưu JPEG nền trắng.
 * Ảnh chụp từ điện thoại thường vượt giới hạn của logo.
 */
export async function shrinkImage(image: Blob, maxBytes: number, maxSide = 1024, quality = 0.85): Promise<Blob> {
  if (image.size <= maxBytes) return image;
  return (await encodeJpeg(await loadImage(image), maxSide, quality)) ?? image;
}

const SCAN_MAX_BYTES = 4 * 1024 * 1024;
const SCAN_MAX_SIDE = 3072;
const EVIDENCE_MAX_BYTES = 10 * 1024 * 1024;

/**
 * Ảnh gửi lên máy chủ để Gemini đọc (bản đồ cấp phép, giấy tờ bè): cạnh dài tối đa 3072 px, tối đa 4 MB, JPEG chất lượng 0,9
 * như ảnh đã thử khi đo độ chính xác. Luôn vẽ lại qua canvas để ảnh được xoay đúng chiều theo EXIF (Gemini không tự xoay);
 * ảnh còn quá 4 MB được thu nhỏ dần.
 */
export async function scanPhoto(image: Blob): Promise<Blob> {
  const element = await loadImage(image);
  const side = Math.max(element.naturalWidth, element.naturalHeight);
  // Mỗi lần thử còn quá 4 MB thì thu cạnh dài thêm và giảm chất lượng một bậc.
  for (const [shrink, quality] of [[1, 0.9], [0.85, 0.85], [0.7, 0.8], [0.55, 0.75]]) {
    const jpeg = await encodeJpeg(element, Math.min(side, SCAN_MAX_SIDE) * shrink, quality);
    if (!jpeg) break;
    if (jpeg.size <= SCAN_MAX_BYTES) return jpeg;
  }
  throw new Error("Không thu nhỏ được ảnh để gửi đi. Vui lòng chụp lại hoặc nhập bằng tay.");
}

/** Ảnh chứng cứ (chỉ số nước) giữ nguyên bản gốc; chỉ khi quá 10 MB mới thu nhỏ để backend nhận. */
export function evidencePhoto(image: Blob): Promise<Blob> {
  return shrinkImage(image, EVIDENCE_MAX_BYTES, SCAN_MAX_SIDE, 0.9);
}
