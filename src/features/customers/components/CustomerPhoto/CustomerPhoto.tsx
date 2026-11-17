import type { CustomerView } from "@/features/customers/models/Customer";
import { useState } from "react";
import { Button, Icon, useSnackbar } from "zmp-ui";

import { Actions } from "@/components/Actions/Actions";
import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Section } from "@/components/Section/Section";
import { useAction } from "@/hooks/useAction";
import { absoluteUrl } from "@/services/httpClient";
import { choosePhoto } from "@/services/zaloService";
import { removeCustomerPhoto, setCustomerPhoto } from "@/features/customers/services/customerService";

/**
 * Ảnh khách hàng để nhân viên nhận ra thương lái ở cảng: xem, chụp hoặc chọn ảnh mới, gỡ ảnh. Chỉ hồ sơ đang dùng mới
 * đổi được ảnh (`editable`). Ảnh lớn hơn 2 MB được thu nhỏ trước khi gửi.
 */
export function CustomerPhoto({ customer, editable, onChange }: { customer: CustomerView; editable: boolean; onChange: (saved: CustomerView) => void }) {
  const { openSnackbar } = useSnackbar();
  const { busy, run } = useAction();
  const [removing, setRemoving] = useState(false);
  const url = absoluteUrl(customer.photoUrl);

  if (!url && !editable) return null;

  const pick = async () => {
    try {
      const photo = await choosePhoto();
      if (!photo) return;
      const saved = await run(() => setCustomerPhoto(customer.id, photo), "Đã lưu ảnh khách hàng.");
      if (saved) onChange(saved);
    } catch (err) {
      openSnackbar({ text: err instanceof Error ? err.message : "Chưa lấy được ảnh.", type: "error", duration: 6000 });
    }
  };

  const remove = async () => {
    const saved = await run(() => removeCustomerPhoto(customer.id), "Đã gỡ ảnh khách hàng.");
    if (saved) onChange(saved);
    setRemoving(false);
  };

  return (
    <Section title="Ảnh khách hàng">
      {url ? <img className="record-photo" src={url} alt={`Ảnh của ${customer.name}`} /> : <p className="form__hint">Chưa có ảnh.</p>}
      {editable && (
        <Actions>
          <Button fullWidth variant="secondary" size="large" prefixIcon={<Icon icon="zi-camera" />} loading={busy} disabled={busy} onClick={() => void pick()}>
            {url ? "Đổi ảnh" : "Chụp hoặc chọn ảnh"}
          </Button>
          {url && (
            <Button fullWidth variant="secondary" type="danger" size="large" disabled={busy} onClick={() => setRemoving(true)}>
              Gỡ ảnh
            </Button>
          )}
        </Actions>
      )}
      <ConfirmSheet
        visible={removing}
        title="Gỡ ảnh khách hàng?"
        message={`Ảnh của ${customer.name} sẽ không còn hiện ở hồ sơ.`}
        confirmText="Gỡ ảnh"
        danger
        busy={busy}
        onClose={() => setRemoving(false)}
        onConfirm={() => void remove()}
      />
    </Section>
  );
}
