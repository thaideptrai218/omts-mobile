import { useEffect, useRef } from "react";
import { Icon } from "zmp-ui";

/**
 * Dòng lỗi của cả form, hiện nguyên văn thông báo (MSGxx) từ server hoặc từ kiểm tra tại chỗ. Khi có lỗi mới thì tự
 * cuộn tới, vì nút gửi thường nằm xa chỗ hiện lỗi và người dùng có thể không thấy gì thay đổi.
 */
function FormError({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (text) ref.current?.scrollIntoView({ block: "center" });
  }, [text]);

  if (!text) return null;
  return (
    <p className="form-error" role="alert" ref={ref}>
      <Icon icon="zi-warning-circle-solid" />
      <span>{text}</span>
    </p>
  );
}

export default FormError;
