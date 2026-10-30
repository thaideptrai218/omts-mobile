import { useEffect, useState } from "react";
import { Button, Icon, Input, Select, useNavigate, useParams } from "zmp-ui";

import FormError from "@/components/form-error";
import { Loadable, ManagePage, NumberInput, Section } from "@/components/manage/ui";
import { useLoad } from "@/hooks/use-load";
import { useBusinessPermission } from "@/hooks/use-business-permission";
import { errorText, MESSAGES } from "@/services/acs/messages";
import { money, parseNumber, todayIso } from "@/services/format";
import { INPUT_GROUP, PAYMENT_METHOD } from "@/services/labels";
import {
  createReceipt,
  getReceipt,
  listInputItems,
  listSuppliers,
  lookupRafts,
  lookupZones,
  RECEIPT_DRAFT,
  STATUS_IN_USE,
  updateReceipt,
  type InputItem,
  type PaymentMethod,
  type RaftLookup,
  type ReceiptView,
  type SaveReceipt,
  type SupplierListItem,
  type ZoneLookup,
} from "@/services/purchasing";

import DateField from "@/components/manage/date-field";

type Line = { key: number; itemId: string; quantity: string; unitPrice: string };

type Choices = { suppliers: SupplierListItem[]; zones: ZoneLookup[]; items: InputItem[]; receipt: ReceiptView | null };

let lineKey = 0;
const emptyLine = (): Line => ({ key: ++lineKey, itemId: "", quantity: "", unitPrice: "" });

/**
 * Lập phiếu nhập mới hoặc sửa phiếu nháp (`/manage/purchases/new`, `/manage/purchases/:id/edit`). Lưu nháp thì
 * kiểm tra nhẹ; "Lưu và hoàn tất" thì backend kiểm tra đủ (nhà cung cấp, vùng còn dùng, có dòng hàng, ngày không
 * sau hôm nay) và phiếu được tính vào công nợ.
 */
function PurchaseFormPage() {
  const { id } = useParams();
  const { data, error, reload } = useLoad<Choices>(async () => {
    const [suppliers, zones, items, receipt] = await Promise.all([
      listSuppliers({ statusId: STATUS_IN_USE, pageSize: 100 }),
      lookupZones(),
      listInputItems({ statusId: STATUS_IN_USE }),
      id ? getReceipt(id) : Promise.resolve(null),
    ]);
    return { suppliers: suppliers.items, zones: zones.filter((z) => z.statusId === STATUS_IN_USE), items, receipt };
  }, [id]);

  return (
    <ManagePage title={id ? "Sửa phiếu nhập" : "Lập phiếu nhập"}>
      <Loadable data={data} error={error} reload={() => void reload()}>
        {(choices) =>
          choices.receipt && choices.receipt.statusId !== RECEIPT_DRAFT ? (
            <p className="form__intro">Chỉ sửa được phiếu nháp.</p>
          ) : (
            <ReceiptForm choices={choices} />
          )
        }
      </Loadable>
    </ManagePage>
  );
}

function ReceiptForm({ choices }: { choices: Choices }) {
  const allowed = useBusinessPermission();
  const canPay = allowed("SUPPLIER_PAYMENTS", "Create");
  const navigate = useNavigate();
  const receipt = choices.receipt;
  const [supplierId, setSupplierId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [raftId, setRaftId] = useState("");
  const [rafts, setRafts] = useState<RaftLookup[]>([]);
  const [receiptDate, setReceiptDate] = useState(todayIso());
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [discount, setDiscount] = useState("");
  const [paidNow, setPaidNow] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!receipt) return;
    setSupplierId(receipt.supplier.id);
    setZoneId(receipt.zone.id);
    setRaftId(receipt.raft?.id ?? "");
    setReceiptDate(receipt.receiptDate ?? todayIso());
    setLines(
      receipt.lines.length > 0
        ? receipt.lines.map((l) => ({ key: ++lineKey, itemId: l.itemId, quantity: String(l.quantity), unitPrice: String(l.unitPrice) }))
        : [emptyLine()],
    );
    setDiscount(receipt.discountAmount ? String(receipt.discountAmount) : "");
    setPaidNow(receipt.amountPaidNow ? String(receipt.amountPaidNow) : "");
    setMethod(receipt.paidNowMethod ?? "Cash");
    setNotes(receipt.notes ?? "");
  }, [receipt]);

  // Bè thuộc vùng đã chọn; đổi vùng thì bỏ bè cũ nếu không còn trong vùng mới.
  useEffect(() => {
    if (!zoneId) {
      setRafts([]);
      return;
    }
    let live = true;
    lookupRafts(zoneId)
      .then((list) => {
        if (!live) return;
        setRafts(list);
        setRaftId((current) => (list.some((r) => r.id === current) ? current : ""));
      })
      .catch(() => live && setRafts([]));
    return () => {
      live = false;
    };
  }, [zoneId]);

  const updateLine = (key: number, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const subtotal = lines.reduce((t, l) => t + (parseNumber(l.quantity) ?? 0) * (parseNumber(l.unitPrice) ?? 0), 0);
  const payable = subtotal - (parseNumber(discount) ?? 0);

  const save = async (complete: boolean) => {
    if (!supplierId) return setError(MESSAGES.MSG01("Nhà cung cấp"));
    if (!zoneId) return setError(MESSAGES.MSG01("Vùng nuôi"));
    const filled = lines.filter((l) => l.itemId || l.quantity || l.unitPrice);
    if (complete && filled.length === 0) return setError(MESSAGES.MSG01("Dòng hàng"));
    for (const [i, l] of filled.entries()) {
      if (!l.itemId) return setError(MESSAGES.MSG01(`Vật tư ở dòng ${i + 1}`));
    }
    setError("");
    setBusy(true);
    const body: SaveReceipt = {
      supplierId,
      zoneId,
      raftId: raftId || null,
      receiptDate: receiptDate || null,
      discountAmount: parseNumber(discount),
      amountPaidNow: parseNumber(paidNow),
      paidNowMethod: parseNumber(paidNow) ? method : null,
      notes: notes.trim() || null,
      lines: filled.map((l) => ({ itemId: l.itemId, quantity: parseNumber(l.quantity), unitPrice: parseNumber(l.unitPrice) })),
      complete,
      rowVersion: receipt?.rowVersion,
    };
    try {
      const saved = receipt ? await updateReceipt(receipt.id, body) : await createReceipt(body);
      navigate(`/manage/purchases/${saved.id}`, { replace: true });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form">
      <div className="form card">
        <Select label="Nhà cung cấp" placeholder="Chọn nhà cung cấp" value={supplierId || undefined} onChange={(v) => setSupplierId(String(v))} closeOnSelect disabled={busy}>
          {choices.suppliers.map((s) => (
            <Select.Option key={s.id} value={s.id} title={s.name ?? ""} />
          ))}
        </Select>
        <Select label="Vùng nuôi" placeholder="Chọn vùng nuôi" value={zoneId || undefined} onChange={(v) => setZoneId(String(v))} closeOnSelect disabled={busy}>
          {choices.zones.map((z) => (
            <Select.Option key={z.id} value={z.id} title={`${z.code ?? ""} ${z.name ?? ""}`.trim()} />
          ))}
        </Select>
        {rafts.length > 0 && (
          <Select label="Bè (không bắt buộc)" placeholder="Không gắn bè" value={raftId || ""} onChange={(v) => setRaftId(String(v ?? ""))} closeOnSelect disabled={busy}>
            <Select.Option value="" title="Không gắn bè" />
            {rafts.map((r) => (
              <Select.Option key={r.id} value={r.id} title={r.code ?? ""} />
            ))}
          </Select>
        )}
        <DateField label="Ngày nhập" value={receiptDate} onChange={setReceiptDate} disabled={busy} />
      </div>

      <Section
        title="Dòng hàng"
        action={
          <Button variant="tertiary" size="small" prefixIcon={<Icon icon="zi-plus" />} disabled={busy} onClick={() => setLines((ls) => [...ls, emptyLine()])}>
            Thêm dòng
          </Button>
        }
      >
        <div className="form">
          {lines.map((l, i) => {
            const item = choices.items.find((x) => x.id === l.itemId);
            const amount = (parseNumber(l.quantity) ?? 0) * (parseNumber(l.unitPrice) ?? 0);
            return (
              <div key={l.key} className="line-item card">
                <div className="line-item__head">
                  <span>Dòng {i + 1}</span>
                  {lines.length > 1 && (
                    <Button variant="tertiary" type="danger" size="small" disabled={busy} onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}>
                      Bỏ dòng
                    </Button>
                  )}
                </div>
                <Select label="Vật tư" placeholder="Chọn vật tư" value={l.itemId || undefined} onChange={(v) => updateLine(l.key, { itemId: String(v) })} closeOnSelect disabled={busy}>
                  {choices.items.map((x) => (
                    <Select.Option key={x.id} value={x.id} title={`${x.name ?? ""} (${INPUT_GROUP[x.group] ?? x.group})`} />
                  ))}
                </Select>
                <div className="two-col">
                  <NumberInput label={`Số lượng${item?.unit ? ` (${item.unit})` : ""}`} value={l.quantity} onChange={(v) => updateLine(l.key, { quantity: v })} disabled={busy} decimal />
                  <NumberInput label="Đơn giá (đồng)" value={l.unitPrice} onChange={(v) => updateLine(l.key, { unitPrice: v })} disabled={busy} />
                </div>
                {amount > 0 && <p className="form__hint">Thành tiền {money(amount)}</p>}
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Tiền">
        <div className="form card">
          <p className="form__intro">
            Tiền hàng {money(subtotal)} · Phải trả {money(payable)}
          </p>
          <NumberInput label="Chiết khấu (đồng, không bắt buộc)" value={discount} onChange={setDiscount} disabled={busy} />
          {canPay && <NumberInput label="Trả ngay (đồng, không bắt buộc)" value={paidNow} onChange={setPaidNow} disabled={busy} helperText="Bội số của 1.000 đồng." />}
          {canPay && Boolean(parseNumber(paidNow)) && (
            <Select label="Hình thức trả" value={method} onChange={(v) => setMethod(v as PaymentMethod)} closeOnSelect disabled={busy}>
              {(Object.keys(PAYMENT_METHOD) as PaymentMethod[]).map((k) => (
                <Select.Option key={k} value={k} title={PAYMENT_METHOD[k]} />
              ))}
            </Select>
          )}
          <Input.TextArea label="Ghi chú" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} showCount disabled={busy} />
        </div>
      </Section>

      <FormError text={error} />
      <div className="action-row">
        <Button variant="secondary" size="large" loading={busy} disabled={busy} onClick={() => void save(false)}>
          Lưu nháp
        </Button>
        <Button size="large" loading={busy} disabled={busy} onClick={() => void save(true)}>
          Lưu và hoàn tất
        </Button>
      </div>
    </div>
  );
}

export default PurchaseFormPage;
