import type { PortWeighing } from "@/features/sales/models/PortWeighing";
import { useState } from "react";
import { Button, useNavigate } from "zmp-ui";

import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Empty } from "@/components/Empty/Empty";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { PurchasePager } from "@/features/sales/components/PurchaseRequest/PurchaseRequest";
import { WeighingBadge, WeighingFacts } from "@/features/sales/components/PortWeighing/PortWeighing";
import { confirmWeighing, myWeighing, myWeighings } from "@/features/sales/services/weighingService";
import { useLoad } from "@/hooks/useLoad";
import { ApiError } from "@/services/errors";
import { errorText } from "@/utils/errorText";
import { dateTime, num } from "@/utils/format";
import "@/features/sales/styles/sales.scss";

/** Phiếu cân của thương lái: xem kg từng lồng HTX đã cân và đồng ý số cân để HTX lập hóa đơn. */
export default function MyWeighingsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const list = useLoad(() => myWeighings(page), [page]);
  const [opened, setOpened] = useState<PortWeighing | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const open = async (row: PortWeighing) => {
    setBusy(true);
    setError("");
    try {
      setOpened(await myWeighing(row.id));
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const agree = async () => {
    if (!opened) return;
    setBusy(true);
    setError("");
    try {
      setOpened(await confirmWeighing(opened));
      setNotice("Bạn đã đồng ý số cân. HTX sẽ lập hóa đơn theo số này.");
      void list.reload();
    } catch (err) {
      // HTX vừa sửa số cân sau khi bạn mở: đọc lại để xem số mới.
      if (err instanceof ApiError && err.status === 409) {
        setError("HTX vừa sửa số cân. Hãy xem lại số mới rồi đồng ý.");
        setOpened(await myWeighing(opened.id).catch(() => opened));
      } else {
        setError(errorText(err));
      }
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  };

  if (opened) {
    const footer = opened.invoiceId ? (
      <Button fullWidth size="large" onClick={() => navigate(`/account/invoices?open=${opened.invoiceId}`)}>Xem hóa đơn</Button>
    ) : !opened.confirmedAt ? (
      <div className="sheet-actions">
        <Button fullWidth size="large" disabled={busy} onClick={() => setConfirm(true)}>Đồng ý số cân</Button>
        <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => void open(opened)}>Tải lại số cân</Button>
      </div>
    ) : undefined;
    return (
      <ManagePage title="Phiếu cân" footer={footer} onBack={() => { setOpened(null); setNotice(""); setError(""); void list.reload(); }}>
        {notice && <p className="card form sales-notice" role="status">{notice}</p>}
        <FormError text={error} />
        {!opened.confirmedAt && <p className="form__intro">Kiểm tra kg của từng lồng. Số cân sai thì báo HTX sửa trước khi đồng ý.</p>}
        <WeighingFacts row={opened} />
        <ConfirmSheet visible={confirm} title="Đồng ý số cân?" busy={busy} confirmText="Đồng ý số cân"
          message={`${num(opened.cageCount, "lồng")}, tổng ${num(opened.totalKg, "kg")}. Đồng ý xong thì số cân không sửa được nữa và HTX lập hóa đơn theo số này.`}
          onClose={() => { if (!busy) setConfirm(false); }} onConfirm={() => void agree()} />
      </ManagePage>
    );
  }

  return (
    <ManagePage title="Phiếu cân">
      <FormError text={error} />
      <Loadable data={list.data} error={list.error} reload={() => void list.reload()}>
        {(data) => (
          <>
            {data.page.items.length ? (
              <ul className="rows">
                {data.page.items.map((row) => (
                  <li key={row.id}>
                    <button type="button" className="row" disabled={busy} onClick={() => void open(row)}>
                      <span className="row__text">
                        <span className="row__title">{row.productName} · {num(row.cageCount, "lồng")} · {num(row.totalKg, "kg")}</span>
                        <span className="row__meta">Cân lúc {dateTime(row.weighedAt)}</span>
                        <span className="row__badges"><WeighingBadge row={row} /></span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty icon="zi-file" title="Chưa có phiếu cân" text="Khi HTX cân hàng của bạn ở cảng, phiếu cân hiện ở đây để bạn đồng ý." />
            )}
            <PurchasePager page={page} total={data.page.total} onChange={setPage} />
          </>
        )}
      </Loadable>
      <div className="button-stack">
        <Button fullWidth size="large" variant="secondary" onClick={() => void list.reload()}>Tải lại</Button>
      </div>
    </ManagePage>
  );
}
