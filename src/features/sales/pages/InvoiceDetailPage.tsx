import type { InvoiceLotOrigin, SalesInvoice } from "@/features/sales/models/SalesInvoice";
import { useEffect, useState } from "react";
import { Button, Sheet, useNavigate, useParams } from "zmp-ui";

import { Badge } from "@/components/Badge/Badge";
import { Facts } from "@/components/Facts/Facts";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Section } from "@/components/Section/Section";
import { cageList } from "@/features/sales/components/PortWeighing/PortWeighing";
import { finishInvoice, getInvoice, publishCheck } from "@/features/sales/services/invoiceService";
import { useLoad } from "@/hooks/useLoad";
import { errorText } from "@/utils/errorText";
import { dateTime, money, num } from "@/utils/format";
import { originTokenFrom } from "@/utils/scanTargets";
import "@/features/sales/styles/sales.scss";

/** Lý do một lô chưa công bố được nguồn gốc khi kết thúc bán (MSG-TRACE-01), viết lại bằng tiếng Việt. */
const lotNote = (lot: InvoiceLotOrigin) =>
  lot.originState === "Published" ? `Lô ${lot.lotCode}: đã công bố nguồn gốc.`
  : lot.originState === "Withdrawn" ? `Lô ${lot.lotCode}: thông tin nguồn gốc đang bị thu hồi.`
  : lot.messageCode ? `Lô ${lot.lotCode}: chưa công bố được vì thiếu thông tin nguồn gốc (thả giống của các luống).` : `Lô ${lot.lotCode}: sẽ được công bố.`;

/** Hóa đơn bán: các dòng hàng và tiền, kết thúc bán và mã QR truy xuất cho lô hàu (SALE-05 bước 9-11, TRACE-01). */
export default function InvoiceDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const invoice = useLoad(() => getInvoice(id), [id]);
  const [asking, setAsking] = useState(false);
  const [lots, setLots] = useState<InvoiceLotOrigin[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const ask = async () => {
    setBusy(true);
    setError("");
    try {
      setLots((await publishCheck(id)).lots);
      setAsking(true);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const finish = async (wantsQrCode: boolean) => {
    setBusy(true);
    setError("");
    try {
      const sent = await finishInvoice(id, { wantsQrCode });
      invoice.setData(sent.invoice);
      setLots(sent.lots.length ? sent.lots : null);
      setAsking(false);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const row = invoice.data;
  const token = originTokenFrom(row?.qrUrl ?? "");
  const footer = !row ? undefined : !row.qrDecidedAt ? (
    <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void ask()}>Kết thúc bán</Button>
  ) : token ? (
    <Button fullWidth size="large" onClick={() => navigate(`/trace?origin=${encodeURIComponent(token)}`)}>Mở trang truy xuất</Button>
  ) : undefined;

  return (
    <ManagePage title={row ? `Hóa đơn ${row.code}` : "Hóa đơn"} footer={footer}>
      <FormError text={error} />
      <Loadable data={row} error={invoice.error} reload={() => void invoice.reload()}>
        {(value) => (
          <>
            {value.qrUrl && <QrBlock url={value.qrUrl} />}
            {value.qrDecidedAt && !value.qrUrl && <p className="card form sales-notice">Đã kết thúc bán, không tạo mã QR.</p>}
            {lots && value.qrDecidedAt && <div className="card form">{lots.map((lot) => <p key={lot.harvestLotId}>{lotNote(lot)}</p>)}</div>}
            <InvoiceFacts row={value} />
          </>
        )}
      </Loadable>
      <Sheet visible={asking} onClose={() => { if (!busy) setAsking(false); }} autoHeight mask handler swipeToClose={!busy} maskClosable={!busy} title="Tạo mã QR truy xuất?">
        <div className="sheet-form form">
          <p className="form__intro">Có mã QR thì người mua quét để xem hàu nuôi ở đâu, thu hoạch khi nào. Tên thương lái và giá không hiện trên trang truy xuất.</p>
          {lots?.map((lot) => <p key={lot.harvestLotId} className="form__hint">{lotNote(lot)}</p>)}
          <div className="sheet-actions">
            <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void finish(true)}>Có, tạo mã QR</Button>
            <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => void finish(false)}>Không tạo mã QR</Button>
            <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => setAsking(false)}>Quay lại</Button>
          </div>
        </div>
      </Sheet>
    </ManagePage>
  );
}

function InvoiceFacts({ row }: { row: SalesInvoice }) {
  const paid = row.debtEffect.isPaid;
  return (
    <>
      <Facts items={[
        ["Thương lái", row.customer?.name ?? "Khách lẻ"],
        ["Lập lúc", dateTime(row.invoicedAt)],
        ["Vùng", row.zone.name],
        ["Tổng khối lượng", num(row.totalKg, "kg")],
        ["Tổng tiền", money(row.total)],
        ["Đã trả", money(row.debtEffect.covered)],
        ["Còn nợ", money(row.debtEffect.unpaid)],
        ["Thanh toán", <Badge key="paid" text={paid ? "Đã trả đủ" : row.paymentTerm === "PayLater" ? "Trả sau" : "Chưa trả đủ"} tone={paid ? "success" : "warning"} />],
      ]} />
      <Section title="Các dòng hàng">
        {row.lines.map((line) => (
          <div key={line.id} className="card form">
            <p className="weighing-lot__title">{line.productName} · lô {line.lotCode}</p>
            <p>{num(line.kg, "kg")} × {money(line.unitPrice)} = {money(line.amount)}</p>
            {line.cageKgs.length > 0 && <p className="weighing-lot__cages">{cageList(line.cageKgs)}</p>}
          </div>
        ))}
      </Section>
    </>
  );
}

/** Ảnh mã QR của hóa đơn, vẽ ngay trong app, kèm đường link để chép. */
function QrBlock({ url }: { url: string }) {
  const [image, setImage] = useState("");
  useEffect(() => {
    let alive = true;
    void import("qrcode")
      .then((QRCode) => QRCode.toDataURL(url, { width: 320, margin: 4 }))
      .then((data) => { if (alive) setImage(data); })
      .catch(() => { if (alive) setImage(""); });
    return () => { alive = false; };
  }, [url]);
  return (
    <div className="card form invoice-qr">
      <p className="weighing-lot__title">Mã QR truy xuất của hóa đơn</p>
      {image ? <img className="invoice-qr__image" src={image} alt="Mã QR truy xuất nguồn gốc" /> : <p className="form__hint">Đang vẽ mã QR...</p>}
      <p className="invoice-qr__link">{url}</p>
    </div>
  );
}
