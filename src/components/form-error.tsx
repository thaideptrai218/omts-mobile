import { Icon } from "zmp-ui";

/** Dòng lỗi của cả form, hiện nguyên văn thông báo (MSGxx) từ server hoặc từ kiểm tra tại chỗ. */
function FormError({ text }: { text: string }) {
  if (!text) return null;
  return (
    <p className="form-error" role="alert">
      <Icon icon="zi-warning-circle-solid" />
      <span>{text}</span>
    </p>
  );
}

export default FormError;
