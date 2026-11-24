import type { LotCage, LotWeighingSheet } from "@/features/sales/models/LotWeighing";
import { useState } from "react";
import { Button, Sheet, useParams } from "zmp-ui";

import { Badge } from "@/components/Badge/Badge";
import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Facts } from "@/components/Facts/Facts";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { NumberInput } from "@/components/NumberInput/NumberInput";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import {
  addCage, cageKg, completeWeighing, newOperationId, removeCage, updateCage, weighingSheet,
} from "@/features/sales/services/lotWeighingService";
import { useAction } from "@/hooks/useAction";
import { useLoad } from "@/hooks/useLoad";
import { dateTime, num } from "@/utils/format";
import "@/features/sales/styles/sales.scss";

const KG_HINT = "Nhập số kg lớn hơn 0, tối đa 3 số sau dấu phẩy (ví dụ 48,5).";

/** "48,5" để điền lại ô sửa: dấu phẩy thập phân như người dùng gõ. */
const kgText = (kg: number) => String(kg).replace(".", ",");

/**
 * Phiếu cân của một lô (chốt 24/11/2026, OMTS-227): cân từng lồng, mỗi lồng lưu ngay lên server nên tắt app giữa chừng không mất số đã cân. Cân xong bấm
 * "Hoàn tất" để lô lấy tổng kg các lồng; server quyết định kg cân của lô. Sửa hoặc xóa một lồng được cho tới khi lô đóng, rồi hoàn tất lại.
 */
export default function LotWeighingPage() {
  const { lotId = "" } = useParams();
  const sheet = useLoad(() => weighingSheet(lotId), [lotId]);
  const { busy, run } = useAction();
  const [kg, setKg] = useState("");
  const [error, setError] = useState("");
  // Mã của lần gửi lồng đang chờ: giữ nguyên khi gửi lại sau lỗi mạng để server không cân trùng; đổi khi đã lưu xong.
  const [operationId, setOperationId] = useState(newOperationId);
  const [editing, setEditing] = useState<{ cage: LotCage; position: number } | null>(null);
  const [editKg, setEditKg] = useState("");
  const [removing, setRemoving] = useState(false);
  const [completing, setCompleting] = useState(false);

  const saveCage = async () => {
    const value = cageKg(kg);
    if (value === null) {
      setError(KG_HINT);
      return;
    }
    setError("");
    const saved = await run(() => addCage(lotId, { kg: value, clientOperationId: operationId }));
    if (!saved) return;
    sheet.setData(saved);
    setKg("");
    setOperationId(newOperationId());
  };

  const saveEdit = async () => {
    if (!editing) return;
    const value = cageKg(editKg);
    if (value === null) {
      setError(KG_HINT);
      return;
    }
    const saved = await run(() => updateCage(lotId, editing.cage.id, { kg: value }), `Đã sửa lồng ${editing.position}`);
    if (!saved) return;
    sheet.setData(saved);
    setEditing(null);
  };

  const confirmRemove = async () => {
    if (!editing) return;
    const saved = await run(() => removeCage(lotId, editing.cage.id), `Đã xóa lồng ${editing.position}`);
    if (!saved) return;
    sheet.setData(saved);
    setRemoving(false);
    setEditing(null);
  };

  const complete = async (current: LotWeighingSheet) => {
    const done = await run(() => completeWeighing(lotId, { rowVersion: current.rowVersion }), `Đã hoàn tất phiếu cân lô ${current.lotCode}`);
    setCompleting(false);
    if (done) void sheet.reload();
  };

  return (
    <ManagePage title="Phiếu cân">
      <Loadable data={sheet.data} error={sheet.error} reload={() => void sheet.reload()}>
        {(data) => {
          const product = data.products[0];
          const next = data.cages.length + 1;
          const completed = data.weighedKg !== null;
          return (
            <>
              <Facts items={[
                ["Lô", data.lotCode],
                ["Loại hàu", product?.productName],
                ["Số lồng lúc thu", num(data.harvestedCages, "lồng")],
                ["Ước tính lúc thu", num(data.estimatedKg, "kg")],
                ["Trạng thái", data.status],
                ["Kg đã chốt", completed ? `${num(data.weighedKg, "kg")} (lúc ${dateTime(data.weighedAt)})` : null],
              ]} />

              <div className="card weighing-total">
                <p className="weighing-total__value">{num(data.cagesKg, "kg")}</p>
                <p className="weighing-total__meta">
                  {num(data.cages.length, "lồng")} đã cân{data.cages.length !== data.harvestedCages ? `, lúc thu đếm ${num(data.harvestedCages, "lồng")}` : ""}
                </p>
                {data.needsCompleting
                  ? <Badge text={completed ? "Có lồng đã sửa, chưa hoàn tất lại" : "Chưa hoàn tất"} tone="warning" />
                  : completed && <Badge text="Đã hoàn tất" tone="success" />}
              </div>

              {data.canEdit ? (
                <Section title={`Cân lồng ${next}`}>
                  <NumberInput label={`Số kg của lồng ${next}`} value={kg} onChange={setKg} decimal disabled={busy} />
                  <FormError text={error} />
                  <Button fullWidth size="large" loading={busy} disabled={busy || !kg.trim()} onClick={() => void saveCage()}>
                    Lưu lồng {next}
                  </Button>
                </Section>
              ) : (
                <p className="form__intro">Lô đã đóng nên không cân thêm hay sửa lồng được nữa.</p>
              )}

              <Section title="Các lồng đã cân">
                {data.cages.length ? (
                  <Rows>
                    {data.cages.map((cage, index) => (
                      <Row key={cage.id} title={`Lồng ${index + 1}`} value={num(cage.kg, "kg")} meta={`cân lúc ${dateTime(cage.weighedAt)}`}
                        onClick={data.canEdit && !busy ? () => { setEditing({ cage, position: index + 1 }); setEditKg(kgText(cage.kg)); setError(""); } : undefined} />
                    ))}
                  </Rows>
                ) : (
                  <p className="form__hint">Chưa cân lồng nào. Đặt lồng lên cân rồi nhập số kg ở trên.</p>
                )}
              </Section>

              {data.canEdit && data.needsCompleting && (
                <div className="button-stack">
                  <Button fullWidth size="large" disabled={busy} onClick={() => setCompleting(true)}>Hoàn tất phiếu cân</Button>
                </div>
              )}

              <ConfirmSheet
                visible={completing}
                title="Hoàn tất phiếu cân?"
                message={`Lô ${data.lotCode}: ${num(data.cages.length, "lồng")}, tổng ${num(data.cagesKg, "kg")}. Số kg này sẽ là kg cân của lô để bán và lập hóa đơn.`}
                confirmText="Hoàn tất"
                busy={busy}
                onClose={() => setCompleting(false)}
                onConfirm={() => void complete(data)}
              />
            </>
          );
        }}
      </Loadable>

      <Sheet visible={editing !== null && !removing} onClose={() => setEditing(null)} autoHeight mask handler swipeToClose={!busy} title={editing ? `Sửa lồng ${editing.position}` : ""}>
        <div className="sheet-form form">
          <NumberInput label="Số kg" value={editKg} onChange={setEditKg} decimal disabled={busy} />
          <FormError text={error} />
          <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void saveEdit()}>Lưu số kg</Button>
          <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => setRemoving(true)}>Xóa lồng này</Button>
        </div>
      </Sheet>

      <ConfirmSheet
        visible={removing}
        title={editing ? `Xóa lồng ${editing.position}?` : ""}
        message={editing ? `Lồng ${num(editing.cage.kg, "kg")} sẽ không còn trong phiếu cân. Sau khi xóa cần hoàn tất lại phiếu cân.` : ""}
        confirmText="Xóa lồng"
        danger
        busy={busy}
        onClose={() => setRemoving(false)}
        onConfirm={() => void confirmRemove()}
      />
    </ManagePage>
  );
}
