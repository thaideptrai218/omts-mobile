import type { CreateSalesInvoice } from "@/features/sales/models/SalesInvoice";
import { useMemo, useState } from "react";
import { Button, Checkbox, useLocation, useNavigate } from "zmp-ui";

import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Facts } from "@/components/Facts/Facts";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { NumberInput } from "@/components/NumberInput/NumberInput";
import { Section } from "@/components/Section/Section";
import { cageList } from "@/features/sales/components/PortWeighing/PortWeighing";
import { createInvoice, productPrice } from "@/features/sales/services/invoiceService";
import { getPurchaseRequest } from "@/features/sales/services/salesService";
import { getWeighing } from "@/features/sales/services/weighingService";
import { useLoad } from "@/hooks/useLoad";
import { ApiError } from "@/services/errors";
import { errorText } from "@/utils/errorText";
import { money, num, parseNumber } from "@/utils/format";
import { newOperationId } from "@/utils/operationId";
import "@/features/sales/styles/sales.scss";

/** Câu hỏi máy chủ hỏi lại khi lập hóa đơn (SALE-05.6 đến 05.8) và trường trả lời của nó. */
const QUESTIONS: Record<string, [string, string]> = {
  "MSG-SALE-11": ["subtractExtraFromDebt", "Tiền mặt nhiều hơn tổng hóa đơn. Trừ phần dư vào công nợ cũ của thương lái? Chọn Không thì trả lại tiền thừa."],
  "MSG-SALE-12": ["payLaterOwnerAgreed", "Đơn này chưa được cho trả sau. Chủ HTX đã đồng ý cho thương lái ghi nợ phần còn lại chưa?"],
};

/** Lập hóa đơn từ lần cân thương lái đã đồng ý (SALE-05): kg lấy theo lần cân, giá theo bảng giá, nhập tiền mặt nhận tại cảng. */
export default function InvoiceFormPage() {
  const weighingId = new URLSearchParams(useLocation().search).get("weighing") ?? "";
  const navigate = useNavigate();
  const data = useLoad(async () => {
    const weighing = await getWeighing(weighingId);
    const [request, product] = await Promise.all([getPurchaseRequest(weighing.purchaseRequestId), productPrice(weighing.productId)]);
    return { weighing, request, product };
  }, [weighingId]);
  const [cash, setCash] = useState<string | null>(null);
  const [payLater, setPayLater] = useState(false);
  const [inFull, setInFull] = useState<boolean | null>(null);
  const [soldWhole, setSoldWhole] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [question, setQuestion] = useState<[string, string] | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [key] = useState(newOperationId);

  const price = data.data?.product.unitPrice ?? null;
  const total = useMemo(() => (data.data && price !== null
    ? data.data.weighing.lots.reduce((sum, lot) => sum + Math.round(lot.kg * price), 0) : null), [data.data, price]);
  const cashText = cash ?? (total !== null ? String(total) : "");
  const cashAmount = parseNumber(cashText);
  const short = total !== null && cashAmount !== null && cashAmount < total;
  const takesInFull = inFull ?? (data.data ? data.data.weighing.cageCount >= (data.data.request.response?.acceptedCages ?? 0) : true);

  const send = async (extra: Record<string, boolean>) => {
    const loaded = data.data;
    if (!loaded || busy) return;
    if (cashAmount === null || cashAmount < 0 || !Number.isInteger(cashAmount)) { setError("Nhập số tiền mặt nhận được, là số đồng, 0 nếu không nhận."); setConfirm(false); return; }
    if (short && !payLater) { setError("Tiền mặt ít hơn tổng hóa đơn: đánh dấu ghi công nợ phần còn lại, hoặc nhập đủ tiền."); setConfirm(false); return; }
    const w = loaded.weighing;
    const body: CreateSalesInvoice = {
      customerId: w.customerId,
      walkInCustomer: false,
      zoneId: null,
      lines: w.lots.map((lot) => ({ productId: w.productId, harvestLotId: lot.harvestLotId, kg: null })),
      payment: {
        cashAmount,
        rest: short ? "PayLater" : "None",
        subtractExtraFromDebt: extra.subtractExtraFromDebt ?? null,
        payLaterOwnerAgreed: extra.payLaterOwnerAgreed ?? false,
      },
      purchaseRequestId: w.purchaseRequestId,
      takesRequestInFull: takesInFull,
      notSoldWholeLotIds: w.lots.map((lot) => lot.harvestLotId).filter((id) => !soldWhole.includes(id)),
      deduplicationKey: key,
      portWeighingId: w.id,
    };
    setBusy(true);
    setError("");
    try {
      const saved = await createInvoice(body);
      navigate(`/manage/invoices/${saved.invoice.id}`, { replace: true });
    } catch (err) {
      const asked = err instanceof ApiError && err.status === 409 ? QUESTIONS[err.code] : undefined;
      if (asked) setQuestion(asked);
      else setError(errorText(err));
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  };

  const answer = (yes: boolean) => {
    if (!question) return;
    const next = { ...answers, [question[0]]: yes };
    setAnswers(next);
    setQuestion(null);
    // Chủ HTX chưa đồng ý cho ghi nợ thì không lập được: để người dùng sửa số tiền.
    if (question[0] === "payLaterOwnerAgreed" && !yes) { setError("Chưa được ghi nợ: nhập đủ tiền mặt hoặc xin Chủ HTX đồng ý trước."); return; }
    void send(next);
  };

  const footer = data.data ? (
    <Button fullWidth size="large" disabled={busy || price === null} onClick={() => setConfirm(true)}>Lập hóa đơn</Button>
  ) : undefined;
  return (
    <ManagePage title="Lập hóa đơn" footer={footer}>
      <Loadable data={data.data} error={data.error} reload={() => void data.reload()}>
        {({ weighing, request }) => (
          <>
            <Facts items={[
              ["Thương lái", weighing.customerName],
              ["Sản phẩm", weighing.productName],
              ["Số lồng đã cân", `${num(weighing.cageCount, "lồng")} (đơn nhận ${num(request.response?.acceptedCages, "lồng")})`],
              ["Tổng khối lượng", num(weighing.totalKg, "kg")],
              ["Đơn giá", price !== null ? `${money(price)}/kg` : "Sản phẩm chưa có giá, Chủ HTX cần đặt giá trước"],
              ["Tạm tính", total !== null ? money(total) : null],
              ["Cho trả sau", request.response?.payLaterAgreed ? "Có" : "Không"],
            ]} />
            <Section title="Các lô trên hóa đơn" step={1}>
              {weighing.lots.map((lot) => (
                <div key={lot.harvestLotId} className="card form">
                  <p className="weighing-lot__title">Lô {lot.lotCode}: {num(lot.cageKgs.length, "lồng")}, {num(lot.kg, "kg")}</p>
                  <p className="weighing-lot__cages">{cageList(lot.cageKgs)}</p>
                  <Checkbox className="sales-option" value={`whole-${lot.harvestLotId}`} checked={soldWhole.includes(lot.harvestLotId)} disabled={busy}
                    onChange={(e) => setSoldWhole((s) => (e.target.checked ? [...s, lot.harvestLotId] : s.filter((id) => id !== lot.harvestLotId)))}>
                    Đã bán hết lô này (đóng lô)
                  </Checkbox>
                </div>
              ))}
            </Section>
            <Section title="Thanh toán tại cảng" step={2}>
              <div className="card form">
                <NumberInput label="Tiền mặt nhận ngay (đồng)" value={cashText} disabled={busy}
                  helperText={total !== null ? `Tổng hóa đơn ${money(total)}. Nhập 0 nếu không nhận tiền mặt.` : undefined}
                  onChange={(v) => { setCash(v); setError(""); }} />
                {short && (
                  <Checkbox className="sales-option" value="pay-later" checked={payLater} disabled={busy} onChange={(e) => { setPayLater(e.target.checked); setError(""); }}>
                    Ghi công nợ phần còn lại {total !== null && cashAmount !== null ? money(total - cashAmount) : ""}
                  </Checkbox>
                )}
                <Checkbox className="sales-option" value="in-full" checked={takesInFull} disabled={busy} onChange={(e) => setInFull(e.target.checked)}>
                  Đơn đã giao đủ, không giao thêm
                </Checkbox>
              </div>
            </Section>
            <FormError text={error} />
          </>
        )}
      </Loadable>
      <ConfirmSheet visible={confirm} title="Lập hóa đơn?" busy={busy} confirmText="Lập hóa đơn"
        message={`Hóa đơn cho ${data.data?.weighing.customerName ?? "thương lái"}: ${num(data.data?.weighing.totalKg, "kg")}, tạm tính ${money(total)}. Hóa đơn đã lập không sửa được trên điện thoại.`}
        onClose={() => { if (!busy) setConfirm(false); }} onConfirm={() => void send(answers)} />
      <ConfirmSheet visible={question !== null} title="Cần xác nhận" busy={busy} confirmText="Có" cancelText="Không"
        message={question?.[1] ?? ""} onClose={() => answer(false)} onConfirm={() => answer(true)} />
    </ManagePage>
  );
}
