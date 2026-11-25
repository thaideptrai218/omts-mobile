import type { PurchaseFormChoices as Choices, PurchaseFormLine as Line } from "@/features/purchasing/models/PurchaseForm";
import type { SaveReceipt } from "@/features/purchasing/models/PurchaseReceipt";
import { useEffect, useState } from "react";
import { Button, Icon, Input, Select, useNavigate, useParams } from "zmp-ui";

import { Actions } from "@/components/Actions/Actions";
import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import DateField from "@/components/DateField/DateField";
import { Facts } from "@/components/Facts/Facts";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { NumberInput } from "@/components/NumberInput/NumberInput";
import { Section } from "@/components/Section/Section";
import { MESSAGES } from "@/constants/messages";
import { useLoad } from "@/hooks/useLoad";
import { errorText } from "@/utils/errorText";
import { money, parseNumber, todayIso } from "@/utils/format";
import { INPUT_GROUP } from "@/utils/labels";
import {
  createReceipt,
  getReceipt,
  listInputItems,
  listSuppliers,
  RECEIPT_DRAFT,
  STATUS_IN_USE,
  updateReceipt,
} from "@/features/purchasing/services/purchasingService";

let lineKey = 0;
const emptyLine = (): Line => ({
  key: ++lineKey,
  itemId: "",
  quantity: "",
  unitPrice: "",
  discount: 0,
  itemUnitId: null,
  supplierLotCode: null,
});

/**
 * Lập phiếu nhập mới hoặc sửa phiếu nháp (`/manage/purchases/new`, `/manage/purchases/:id/edit`). Lưu nháp chỉ cần nhà
 * cung cấp; "Lưu và hoàn tất" thì backend kiểm tra đủ (mỗi dòng có vật tư, số lượng, đơn giá; ngày không sau hôm nay) và phiếu
 * được tính vào công nợ, tồn kho. Phiếu nhập không gắn vùng hay bè.
 */
function PurchaseFormPage() {
  const { id } = useParams();
  const { data, error, reload } = useLoad<Choices>(async () => {
    const [suppliers, items, receipt] = await Promise.all([
      listSuppliers({ statusId: STATUS_IN_USE, pageSize: 100 }),
      listInputItems({ statusId: STATUS_IN_USE }),
      id ? getReceipt(id) : Promise.resolve(null),
    ]);
    return { suppliers: suppliers.items, items, receipt };
  }, [id]);

  const title = id ? "Sửa phiếu nhập" : "Lập phiếu nhập";

  // Form đặt nút chính ở chân trang nên tự dựng ManagePage; khung dưới dùng khi đang tải, lỗi hoặc phiếu không còn là nháp.
  if (data && (!data.receipt || data.receipt.statusId === RECEIPT_DRAFT)) return <ReceiptForm title={title} choices={data} />;

  return (
    <ManagePage title={title}>
      <Loadable data={data} error={error} reload={() => void reload()}>
        {() => <p className="form__intro">Chỉ sửa được phiếu nháp trên điện thoại. Phiếu đã hoàn tất sửa trên bản web.</p>}
      </Loadable>
    </ManagePage>
  );
}

function ReceiptForm({ title, choices }: { title: string; choices: Choices }) {
  const navigate = useNavigate();
  const receipt = choices.receipt;
  const [supplierId, setSupplierId] = useState("");
  const [receiptDate, setReceiptDate] = useState(todayIso());
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [discount, setDiscount] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!receipt) return;
    setSupplierId(receipt.supplier.id);
    setReceiptDate(receipt.receiptDate ?? todayIso());
    setLines(
      receipt.lines.length > 0
        ? receipt.lines.map((l) => ({
            key: ++lineKey,
            itemId: l.itemId ?? "",
            quantity: l.quantity !== null ? String(l.quantity) : "",
            unitPrice: l.unitPrice !== null ? String(l.unitPrice) : "",
            discount: l.discount,
            itemUnitId: l.itemUnitId,
            supplierLotCode: l.supplierLotCode,
          }))
        : [emptyLine()],
    );
    setDiscount(receipt.discount ? String(receipt.discount) : "");
    setNotes(receipt.notes ?? "");
  }, [receipt]);

  const updateLine = (key: number, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const itemOf = (l: Line) => choices.items.find((x) => x.id === l.itemId);
  const unitOf = (l: Line) => {
    const item = itemOf(l);
    return (l.itemUnitId && item?.units.find((u) => u.id === l.itemUnitId)?.name) || item?.unit || "";
  };
  const lineAmount = (l: Line) => (parseNumber(l.quantity) ?? 0) * Math.max(0, (parseNumber(l.unitPrice) ?? 0) - l.discount);
  const total = lines.reduce((t, l) => t + lineAmount(l), 0);
  const discountValue = parseNumber(discount) ?? 0;
  const payable = total - discountValue;

  const save = async (complete: boolean) => {
    if (!supplierId) return setError(MESSAGES.MSG01("Nhà cung cấp"));
    const filled = lines.filter((l) => l.itemId || l.quantity || l.unitPrice);
    if (complete && filled.length === 0) return setError(MESSAGES.MSG01("Dòng hàng"));
    for (const [i, l] of filled.entries()) {
      if (!l.itemId) return setError(MESSAGES.MSG01(`Vật tư ở dòng ${i + 1}`));
      if (complete && !(parseNumber(l.quantity) && parseNumber(l.quantity)! > 0)) return setError(MESSAGES.MSG01(`Số lượng ở dòng ${i + 1}`));
      if (complete && parseNumber(l.unitPrice) === null) return setError(MESSAGES.MSG01(`Đơn giá ở dòng ${i + 1}`));
    }
    if (!Number.isInteger(discountValue) || discountValue < 0) return setError(MESSAGES.MSG01("Giảm giá"));
    setError("");
    setBusy(true);
    const body: SaveReceipt = {
      supplierId,
      receiptDate: receiptDate || null,
      discount: discountValue,
      notes: notes.trim() || null,
      lines: filled.map((l) => ({
        itemId: l.itemId,
        quantity: parseNumber(l.quantity),
        unitPrice: parseNumber(l.unitPrice),
        discount: l.discount,
        itemUnitId: l.itemUnitId,
        // Mã lô giống chỉ có nghĩa với dòng giống.
        supplierLotCode: itemOf(l)?.group === "Seed" ? l.supplierLotCode : null,
      })),
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
    if (!supplierId || filled.length === 0 || filled.some((l) => !l.itemId || !parseNumber(l.quantity) || parseNumber(l.unitPrice) === null)) {
      void save(true);
      return;
    }
    setConfirming(true);
  };

  // Phiếu nháp có thể mang nhà cung cấp đã ngừng dùng, tên đó không còn trong danh sách chọn.
  const supplierName = choices.suppliers.find((s) => s.id === supplierId)?.name ?? receipt?.supplier.name;

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
                <Select.Option key={s.id} value={s.id} title={s.name} />
              ))}
            </Select>
            <DateField label="Ngày nhập" value={receiptDate} onChange={setReceiptDate} disabled={busy} />
          </div>
        </Section>

        <Section step={2} title="Hàng mua">
          <div className="form">
            {lines.map((l, i) => {
              const amount = lineAmount(l);
              const unit = unitOf(l);
              return (
                <div key={l.key} className="line-item card">
                  <div className="line-item__head">
                    <span>Dòng {i + 1}</span>
                  </div>
                  <Select
                    label="Vật tư (bắt buộc)"
                    placeholder="Chọn vật tư"
                    value={l.itemId || undefined}
                    // Đổi vật tư thì đơn vị cũ không còn đúng: về đơn vị gốc của vật tư mới.
                    onChange={(v) => updateLine(l.key, { itemId: String(v), itemUnitId: null })}
                    closeOnSelect
                    disabled={busy}
                  >
                    {choices.items.map((x) => (
                      <Select.Option key={x.id} value={x.id} title={`${x.name} (${INPUT_GROUP[x.group] ?? x.group})`} />
                    ))}
                  </Select>
                  <NumberInput label={`Số lượng${unit ? ` (${unit})` : ""}`} value={l.quantity} onChange={(v) => updateLine(l.key, { quantity: v })} disabled={busy} decimal />
                  <NumberInput label={`Đơn giá (đồng${unit ? ` mỗi ${unit}` : ""})`} value={l.unitPrice} onChange={(v) => updateLine(l.key, { unitPrice: v })} disabled={busy} />
                  {l.discount > 0 && <p className="form__hint">Giảm {money(l.discount)} mỗi {unit || "đơn vị"} (đặt trên web).</p>}
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
            <Button
              fullWidth
              variant="secondary"
              size="large"
              prefixIcon={<Icon icon="zi-plus" />}
              disabled={busy}
              onClick={() => setLines((ls) => [...ls, emptyLine()])}
            >
              Thêm dòng hàng
            </Button>
          </div>
        </Section>

        <Section step={3} title="Tiền và ghi chú">
          <div className="form">
            <Facts
              items={[
                ["Tiền hàng", money(total)],
                ["Phải trả", money(payable)],
              ]}
            />
            <div className="form card">
              <NumberInput label="Giảm giá cả phiếu (đồng, không bắt buộc)" value={discount} onChange={setDiscount} disabled={busy} />
              <Input.TextArea label="Ghi chú (không bắt buộc)" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} showCount disabled={busy} />
            </div>
            <p className="form__hint">Trả tiền nhà cung cấp ghi ở màn chi tiết phiếu sau khi hoàn tất, hoặc ở màn công nợ nhà cung cấp.</p>
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
              ]}
            />
            <p>Phiếu hoàn tất được tính vào công nợ nhà cung cấp và tồn kho.</p>
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
