import type { SupplierView } from "@/features/purchasing/models/Supplier";
import { useState } from "react";
import { Button, Icon, useSnackbar } from "zmp-ui";

import { Actions } from "@/components/Actions/Actions";
import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Empty } from "@/components/Empty/Empty";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import { useAction } from "@/hooks/useAction";
import { absoluteUrl } from "@/services/httpClient";
import { choosePhoto, openPdf } from "@/services/zaloService";
import { addSupplierCertificate, removeSupplierCertificate } from "@/features/purchasing/services/purchasingService";

const MAX_CERTIFICATES = 10;

const isPdf = (url: string) => /\.pdf([?&#]|$)/i.test(decodeURIComponent(url));

/** Chứng nhận của nhà cung cấp: xem, chụp thêm hoặc gỡ. Mỗi lần tải một ảnh; tệp PDF chỉ thêm được trên bản web. */
export function SupplierCertificates({ supplier, onChange }: { supplier: SupplierView; onChange: (saved: SupplierView) => void }) {
  const { openSnackbar } = useSnackbar();
  const { busy, run } = useAction();
  const [removing, setRemoving] = useState<number | null>(null);

  const add = async () => {
    try {
      const photo = await choosePhoto();
      if (!photo) return;
      const saved = await run(() => addSupplierCertificate(supplier.id, photo), "Đã thêm chứng nhận.");
      if (saved) onChange(saved);
    } catch (err) {
      openSnackbar({ text: err instanceof Error ? err.message : "Chưa lấy được ảnh.", type: "error", duration: 6000 });
    }
  };

  const remove = async () => {
    if (removing === null) return;
    const saved = await run(() => removeSupplierCertificate(supplier.id, removing), "Đã gỡ chứng nhận.");
    if (saved) onChange(saved);
    setRemoving(null);
  };

  const openFile = async (url: string, number: number) => {
    try {
      await openPdf(url, `Chứng nhận ${number}`);
    } catch (err) {
      openSnackbar({ text: err instanceof Error ? err.message : "Chưa mở được tệp.", type: "error", duration: 6000 });
    }
  };

  return (
    <Section title="Chứng nhận">
      {supplier.certificates.length === 0 && <Empty icon="zi-file" title="Chưa có chứng nhận" />}
      {supplier.certificates.map((c, position) => {
        const url = absoluteUrl(c.url);
        const number = position + 1;
        if (!url) return null;
        return (
          <div key={c.index} className="record-file">
            {isPdf(url) ? (
              <Rows>
                <Row title={`Chứng nhận ${number}`} meta="Tệp PDF, bấm để xem" onClick={() => void openFile(url, number)} />
              </Rows>
            ) : (
              <img className="record-photo" src={url} alt={`Chứng nhận ${number} của ${supplier.name ?? "nhà cung cấp"}`} />
            )}
            <Actions>
              <Button fullWidth variant="secondary" type="danger" size="large" disabled={busy} onClick={() => setRemoving(c.index)}>
                Gỡ giấy chứng nhận {number}
              </Button>
            </Actions>
          </div>
        );
      })}
      {supplier.certificates.length < MAX_CERTIFICATES ? (
        <Button fullWidth variant="secondary" size="large" prefixIcon={<Icon icon="zi-camera" />} loading={busy} disabled={busy} onClick={() => void add()}>
          Chụp hoặc chọn ảnh chứng nhận
        </Button>
      ) : (
        <p className="screen__note">Đã đủ {MAX_CERTIFICATES} chứng nhận. Gỡ bớt để thêm mới.</p>
      )}
      <ConfirmSheet
        visible={removing !== null}
        title="Gỡ giấy chứng nhận?"
        message="Giấy chứng nhận này sẽ không còn hiện ở nhà cung cấp."
        confirmText="Gỡ giấy chứng nhận"
        danger
        busy={busy}
        onClose={() => setRemoving(null)}
        onConfirm={() => void remove()}
      />
    </Section>
  );
}
