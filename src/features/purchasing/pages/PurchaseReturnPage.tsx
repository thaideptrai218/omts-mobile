import type { ReceiptLine, ReceiptView } from "@/features/purchasing/models/PurchaseReceipt";
import { useState } from "react";
import { Button, Input, useNavigate, useParams, useSnackbar } from "zmp-ui";

import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import DateField from "@/components/DateField/DateField";
import { Empty } from "@/components/Empty/Empty";
import { Facts } from "@/components/Facts/Facts";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { NumberInput } from "@/components/NumberInput/NumberInput";
import { Section } from "@/components/Section/Section";
import { MESSAGES } from "@/constants/messages";
import { createPurchaseReturn, getReceipt } from "@/features/purchasing/services/purchasingService";
import { useLoad } from "@/hooks/useLoad";
import { ApiError } from "@/services/errors";
import { errorText } from "@/utils/errorText";
import { money, num, parseNumber, todayIso } from "@/utils/format";

const TITLE = "Trả hàng nhà cung cấp";

/** Số lượng còn trả được theo đơn vị của dòng: backend trả theo đơn vị gốc, `unitFactor` là số đơn vị gốc trong một đơn vị dòng. */
const returnableInLineUnit = (l: ReceiptLine) => (l.unitFactor > 0 ? l.returnable / l.unitFactor : l.returnable);

/**
 * Trả hàng nhà cung cấp từ một phiếu hoàn tất (PURCHASE-02, `/manage/purchases/:id/return`): chọn số lượng từng dòng, lý do
 * và ngày trả. Giá trả mặc định là giá đã trả của dòng (`netUnitPrice`); trả hàng làm giảm công nợ với nhà cung cấp. Tiền nhà
 * cung cấp hoàn lại (nếu có) ghi riêng. Quản lý vùng trả hàng thì backend hỏi Chủ HTX đã đồng ý chưa (MSG-PURCHASE-02).
 */
function PurchaseReturnPage() {
  const { id = "" } = useParams();
  const { data, error: loadError, reload } = useLoad(() => getReceipt(id), [id]);

  // Form đặt nút chính ở chân trang nên tự dựng ManagePage; khung dưới chỉ dùng khi đang tải hoặc lỗi.
  if (data) return <ReturnForm receipt={data} />;

  return (
    <ManagePage title={TITLE}>
      <Loadable data={data} error={loadError} reload={() => void reload()}>
        {() => null}
      </Loadable>
    </ManagePage>
  );
}

function ReturnForm({ receipt }: { receipt: ReceiptView }) {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [returnDate, setReturnDate] = useState<string | null>(todayIso());
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [ownerQuestion, setOwnerQuestion] = useState("");

  const lines = receipt.lines.filter((l) => l.returnable > 0);
  const value = lines.reduce((sum, l) => sum + Math.round((parseNumber(quantities[l.id] ?? "") ?? 0) * (l.netUnitPrice ?? 0)), 0);

  const chosen = () =>
    lines.flatMap((l) => {
      const quantity = parseNumber(quantities[l.id] ?? "");
      return quantity ? [{ receiptLineId: l.id, quantity }] : [];
    });

  const check = () => {
    if (chosen().length === 0) return MESSAGES.MSG01("Số lượng trả");
    const over = lines.find((l) => (parseNumber(quantities[l.id] ?? "") ?? 0) > returnableInLineUnit(l));
    if (over) return MESSAGES.MSG01(`Số lượng trả của ${over.itemName ?? "vật tư"}`);
    if (!returnDate || returnDate > todayIso()) return MESSAGES.MSG01("Ngày trả hàng");
    if (!reason.trim()) return MESSAGES.MSG01("Lý do trả hàng");
    return "";
  };

  const save = async (ownerApproved: boolean) => {
    if (busy) return;
    const invalid = check();
    if (invalid) {
      setError(invalid);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await createPurchaseReturn({
        receiptId: receipt.id,
        complete: true,
        reason: reason.trim(),
        lines: chosen(),
        ownerApproved,
        // Hôm nay thì để backend lấy giờ hiện tại; ngày trước đó thì tính từ đầu ngày theo giờ Việt Nam.
        returnedAt: returnDate && returnDate !== todayIso() ? `${returnDate}T00:00:00+07:00` : null,
      });
      openSnackbar({ text: "Đã ghi trả hàng.", type: "success", duration: 4000 });
      navigate(`/manage/purchases/${receipt.id}`, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && err.details.confirmFlag === "ownerApproved") {
        setOwnerQuestion(
          `Chủ HTX đã trực tiếp đồng ý trả hàng trị giá ${money(Number(err.details.returnAmount ?? value))} cho ${String(err.details.supplierName ?? receipt.supplier.name ?? "nhà cung cấp")} chưa?`,
        );
      } else {
        setError(errorText(err));
      }
    } finally {
      setBusy(false);
    }
  };

  // Còn thiếu thì báo lỗi ngay (chưa gửi gì lên server); đủ rồi mới hỏi lại trước khi ghi.
  const askSave = () => {
    const invalid = check();
    if (invalid) {
      setError(invalid);
      return;
    }
    setConfirming(true);
  };

  if (lines.length === 0) {
    return (
      <ManagePage title={TITLE}>
        <Empty icon="zi-check-circle" title="Không còn hàng để trả" text="Các dòng của phiếu này đã trả hết hoặc đã dùng để thả giống." />
      </ManagePage>
    );
  }

  return (
    <ManagePage
      title={TITLE}
      footer={
        <Button fullWidth size="large" loading={busy} disabled={busy} onClick={askSave}>
          Ghi trả hàng
        </Button>
      }
    >
      <div className="form">
        <Facts
          items={[
            ["Phiếu nhập", receipt.code],
            ["Nhà cung cấp", receipt.supplier.name],
          ]}
        />
        <Section step={1} title="Hàng trả">
          <div className="form">
            <p className="form__intro">Nhập số lượng trả cho ít nhất một loại hàng.</p>
            {lines.map((l) => (
              <NumberInput
                key={l.id}
                decimal
                label={l.itemName ?? l.itemCode ?? "Vật tư"}
                helperText={`Trả được tối đa ${num(returnableInLineUnit(l), l.unit)}${l.netUnitPrice !== null ? `, giá trả ${money(l.netUnitPrice)} mỗi ${l.unit}` : ""}`}
                value={quantities[l.id] ?? ""}
                onChange={(v) => {
                  setError("");
                  setQuantities((current) => ({ ...current, [l.id]: v }));
                }}
                disabled={busy}
              />
            ))}
          </div>
        </Section>
        <Section step={2} title="Thông tin trả hàng">
          <div className="form card">
            <DateField label="Ngày trả hàng (bắt buộc)" value={returnDate} onChange={setReturnDate} disabled={busy} />
            <Input.TextArea label="Lý do trả hàng (bắt buộc)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} showCount disabled={busy} />
            <p className="form__intro">
              Giá trị hàng trả ước tính: <strong>{money(value)}</strong>. Số này trừ vào công nợ với nhà cung cấp.
            </p>
          </div>
        </Section>
        <FormError text={error} />
      </div>

      <ConfirmSheet
        visible={confirming}
        title="Ghi trả hàng?"
        message={
          <div className="form">
            <Facts
              items={[
                ["Nhà cung cấp", receipt.supplier.name],
                ["Giá trị hàng trả ước tính", money(value)],
              ]}
            />
            <p>Trả hàng được ghi ngay và trừ vào công nợ. Muốn hủy, Chủ HTX hủy trên bản web.</p>
          </div>
        }
        confirmText="Ghi trả hàng"
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          // Đóng sheet trước để lỗi từ server hiện ở FormError của form.
          setConfirming(false);
          void save(false);
        }}
      />

      <ConfirmSheet
        visible={ownerQuestion !== ""}
        title="Chủ HTX đã đồng ý chưa?"
        message={ownerQuestion}
        confirmText="Có, Chủ HTX đã đồng ý"
        cancelText="Chưa, quay lại"
        busy={busy}
        onClose={() => {
          setOwnerQuestion("");
          setError("Cần Chủ HTX đồng ý trước khi trả hàng.");
        }}
        onConfirm={() => {
          setOwnerQuestion("");
          void save(true);
        }}
      />
    </ManagePage>
  );
}

export default PurchaseReturnPage;
