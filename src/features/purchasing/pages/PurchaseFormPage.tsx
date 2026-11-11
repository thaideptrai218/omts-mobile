import type { PurchaseFormChoices as Choices, PurchaseFormLine as Line } from "@/features/purchasing/models/PurchaseForm";
import type { SaveReceipt } from "@/features/purchasing/models/PurchaseReceipt";
import type { RaftLookup } from "@/features/purchasing/models/Reference";
import type { PaymentMethod } from "@/features/purchasing/models/SupplierPayment";
import { useEffect, useState } from "react";
import { Button, Icon, Input, Select, useNavigate, useParams } from "zmp-ui";

import { Actions } from "@/components/Actions/Actions";
import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Facts } from "@/components/Facts/Facts";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { NumberInput } from "@/components/NumberInput/NumberInput";
import { Section } from "@/components/Section/Section";
import { useLoad } from "@/hooks/useLoad";
import { useBusinessPermission } from "@/hooks/useBusinessPermission";
import { errorText } from "@/utils/errorText";
import { MESSAGES } from "@/constants/messages";
import { money, parseNumber, todayIso } from "@/utils/format";
import { INPUT_GROUP, PAYMENT_METHOD } from "@/utils/labels";
import { createReceipt, getReceipt, listInputItems, listSuppliers, lookupRafts, lookupZones, RECEIPT_DRAFT, STATUS_IN_USE, updateReceipt } from "@/features/purchasing/services/purchasingService";

import DateField from "@/components/DateField/DateField";

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

  const title = id ? "Sửa phiếu nhập" : "Lập phiếu nhập";

  // Form đặt nút chính ở chân trang nên tự dựng ManagePage; khung dưới dùng khi đang tải, lỗi hoặc phiếu không còn là nháp.
  if (data && (!data.receipt || data.receipt.statusId === RECEIPT_DRAFT)) return <ReceiptForm title={title} choices={data} />;

  return (
    <ManagePage title={title}>
      <Loadable data={data} error={error} reload={() => void reload()}>
        {() => <p className="form__intro">Chỉ sửa được phiếu nháp.</p>}
      </Loadable>
    </ManagePage>
  );
}

function ReceiptForm({ title, choices }: { title: string; choices: Choices }) {
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
  const [confirming, setConfirming] = useState(false);

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

  // Phiếu còn thiếu thì để save báo lỗi như cũ (chưa gửi gì lên server); đủ rồi mới hỏi lại trước khi hoàn tất.
  const askComplete = () => {
    const filled = lines.filter((l) => l.itemId || l.quantity || l.unitPrice);
    if (!supplierId || !zoneId || filled.length === 0 || filled.some((l) => !l.itemId)) {
      void save(true);
      return;
    }
    setConfirming(true);
  };

  // Phiếu nháp có thể mang nhà cung cấp đã ngừng dùng, tên đó không còn trong danh sách chọn.
  const supplierName = choices.suppliers.find((s) => s.id === supplierId)?.name ?? receipt?.supplier.name;
  const paidNowValue = parseNumber(paidNow);

  return (
    <ManagePage
      title={title}
      footer={
        <Button fullWidth size="large" loading={busy} disabled={busy} onClick={askComplete}>
          Lưu và hoàn tất
        </Button>
      }
    >
      <div className="form">
        <Section step={1} title="Thông tin chung">
          <div className="form card">
            <Select label="Nhà cung cấp (bắt buộc)" placeholder="Chọn nhà cung cấp" value={supplierId || undefined} onChange={(v) => setSupplierId(String(v))} closeOnSelect disabled={busy}>
              {choices.suppliers.map((s) => (
                <Select.Option key={s.id} value={s.id} title={s.name ?? ""} />
              ))}
            </Select>
            <Select label="Vùng nuôi (bắt buộc)" placeholder="Chọn vùng nuôi" value={zoneId || undefined} onChange={(v) => setZoneId(String(v))} closeOnSelect disabled={busy}>
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
        </Section>

        <Section step={2} title="Hàng mua">
          <div className="form">
            {lines.map((l, i) => {
              const item = choices.items.find((x) => x.id === l.itemId);
              const amount = (parseNumber(l.quantity) ?? 0) * (parseNumber(l.unitPrice) ?? 0);
              return (
                <div key={l.key} className="line-item card">
                  <div className="line-item__head">
                    <span>Dòng {i + 1}</span>
                  </div>
                  <Select label="Vật tư (bắt buộc)" placeholder="Chọn vật tư" value={l.itemId || undefined} onChange={(v) => updateLine(l.key, { itemId: String(v) })} closeOnSelect disabled={busy}>
                    {choices.items.map((x) => (
                      <Select.Option key={x.id} value={x.id} title={`${x.name ?? ""} (${INPUT_GROUP[x.group] ?? x.group})`} />
                    ))}
                  </Select>
                  <NumberInput label={`Số lượng${item?.unit ? ` (${item.unit})` : ""}`} value={l.quantity} onChange={(v) => updateLine(l.key, { quantity: v })} disabled={busy} decimal />
                  <NumberInput label="Đơn giá (đồng)" value={l.unitPrice} onChange={(v) => updateLine(l.key, { unitPrice: v })} disabled={busy} />
                  {amount > 0 && <p className="form__hint">Thành tiền {money(amount)}</p>}
                  {lines.length > 1 && (
                    <Actions>
                      <Button fullWidth variant="secondary" type="danger" size="large" disabled={busy} onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}>
                        Bỏ dòng {i + 1}
                      </Button>
                    </Actions>
                  )}
                </div>
              );
            })}
            <Button fullWidth variant="secondary" size="large" prefixIcon={<Icon icon="zi-plus" />} disabled={busy} onClick={() => setLines((ls) => [...ls, emptyLine()])}>
              Thêm dòng hàng
            </Button>
          </div>
        </Section>

        <Section step={3} title="Thanh toán và ghi chú">
          <div className="form">
            <Facts
              items={[
                ["Tiền hàng", money(subtotal)],
                ["Phải trả", money(payable)],
              ]}
            />
            <div className="form card">
              <NumberInput label="Chiết khấu (đồng, không bắt buộc)" value={discount} onChange={setDiscount} disabled={busy} />
              {canPay && <NumberInput label="Trả ngay (đồng, không bắt buộc)" value={paidNow} onChange={setPaidNow} disabled={busy} helperText="Bội số của 1.000 đồng." />}
              {canPay && Boolean(parseNumber(paidNow)) && (
                <Select label="Hình thức trả" value={method} onChange={(v) => setMethod(v as PaymentMethod)} closeOnSelect disabled={busy}>
                  {(Object.keys(PAYMENT_METHOD) as PaymentMethod[]).map((k) => (
                    <Select.Option key={k} value={k} title={PAYMENT_METHOD[k]} />
                  ))}
                </Select>
              )}
              <Input.TextArea label="Ghi chú (không bắt buộc)" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} showCount disabled={busy} />
            </div>
          </div>
        </Section>

        <FormError text={error} />
        <Button fullWidth variant="secondary" size="large" loading={busy} disabled={busy} onClick={() => void save(false)}>
          Lưu nháp
        </Button>
      </div>

      <ConfirmSheet
        visible={confirming}
        title="Hoàn tất phiếu nhập?"
        message={
          <div className="form">
            <Facts
              items={[
                ["Nhà cung cấp", supplierName],
                ["Tổng phải trả", money(payable)],
                ["Trả ngay", paidNowValue ? money(paidNowValue) : null],
              ]}
            />
            <p>Phiếu hoàn tất sẽ được tính vào công nợ nhà cung cấp và không sửa được nữa.</p>
          </div>
        }
        confirmText="Lưu và hoàn tất"
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          // Đóng sheet trước để lỗi từ server hiện ở FormError của form.
          setConfirming(false);
          void save(true);
        }}
      />
    </ManagePage>
  );
}

export default PurchaseFormPage;
