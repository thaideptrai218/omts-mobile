import type { InvoiceLotOrigin, SalesInvoice } from "@/features/sales/models/SalesInvoice";
import { useState } from "react";
import { Button, Sheet, useNavigate, useParams } from "zmp-ui";

import { Badge } from "@/components/Badge/Badge";
import { Facts } from "@/components/Facts/Facts";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Section } from "@/components/Section/Section";
import { useQrImage } from "@/features/sales/hooks/useQrImage";
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
      <Loadable data={row} error={invoice.error} reload={() => void invoice.reload()}>
        {(value) => (
          <>
            <div className="form">
              {/* Lỗi lúc kết thúc bán hiện trong sheet; dòng này chỉ cho lỗi khi chưa mở sheet (ví dụ kiểm tra nguồn gốc lỗi). */}
              {!asking && <FormError text={error} />}
              {value.qrUrl && <QrBlock url={value.qrUrl} />}
              {value.qrDecidedAt && !value.qrUrl && <p className="card form">Đã kết thúc bán, không tạo mã QR.</p>}
              {lots && value.qrDecidedAt && <div className="card form">{lots.map((lot) => <p key={lot.harvestLotId}>{lotNote(lot)}</p>)}</div>}
              <InvoiceFacts row={value} />
            </div>
            <InvoiceLines row={value} />
          </>
        )}
      </Loadable>
      <Sheet visible={asking} onClose={() => { if (!busy) setAsking(false); }} autoHeight mask handler swipeToClose={!busy} maskClosable={!busy} title="Tạo mã QR truy xuất?">
        <div className="sheet-form form">
          <p className="form__intro">Có mã QR thì người mua quét để xem hàu nuôi ở đâu, thu hoạch khi nào. Tên thương lái và giá không hiện trên trang truy xuất.</p>
          {lots?.map((lot) => <p key={lot.harvestLotId} className="form__hint">{lotNote(lot)}</p>)}
          <FormError text={asking ? error : ""} />
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
  );
}

function InvoiceLines({ row }: { row: SalesInvoice }) {
  return (
    <Section title="Các dòng hàng">
      <div className="form">
        {row.lines.map((line) => (
          <div key={line.id} className="card form">
            <p className="weighing-lot__title">{line.productName} · lô {line.lotCode}</p>
            <p>{num(line.kg, "kg")} × {money(line.unitPrice)} = {money(line.amount)}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/** Ảnh mã QR của hóa đơn, vẽ ngay trong app, kèm đường link để chép. Vẽ lỗi thì nhắc chép đường link và cho vẽ lại. */
function QrBlock({ url }: { url: string }) {
  const qr = useQrImage(url);
  return (
    <div className="card form invoice-qr">
      <p className="weighing-lot__title">Mã QR truy xuất của hóa đơn</p>
      {qr.image ? (
        <img className="invoice-qr__image" src={qr.image} alt="Mã QR truy xuất nguồn gốc" />
      ) : qr.failed ? (
        <>
          <p className="form__hint" role="alert">Chưa vẽ được mã QR. Bạn vẫn chép được đường link bên dưới để gửi cho người mua.</p>
          <Button fullWidth variant="secondary" size="large" onClick={qr.redraw}>Vẽ lại mã QR</Button>
        </>
      ) : (
        <p className="form__hint" role="status">Đang vẽ mã QR...</p>
      )}
      <p className="invoice-qr__link">{url}</p>
    </div>
  );
}
