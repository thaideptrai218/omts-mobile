/**
 * Chép chữ vào bộ nhớ tạm của máy. ZMP SDK không có API chép, nên dùng API của trình duyệt; webview cũ không có
 * `navigator.clipboard` thì chép bằng một ô nhập ẩn. Trả false khi không chép được để màn hình nhắc chép bằng tay.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    try {
      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      field.remove();
    }
  }
}
