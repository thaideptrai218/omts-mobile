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
