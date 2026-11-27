import type { LotTraderCage, LotWeighingSheet } from "@/features/sales/models/LotWeighing";
import { useState } from "react";
import { Button, Sheet, useParams } from "zmp-ui";

import { Badge } from "@/components/Badge/Badge";
import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Facts } from "@/components/Facts/Facts";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { NumberInput } from "@/components/NumberInput/NumberInput";
import { Section } from "@/components/Section/Section";
import { kgGap, WeighingCompare } from "@/features/sales/components/WeighingCompare/WeighingCompare";
import {
  addMyCage, agreeWeighing, cageKg, myWeighingSheet, newOperationId, removeMyCage, updateMyCage,
} from "@/features/sales/services/lotWeighingService";
import { lotStatusLabel } from "@/features/sales/utils/lotStatus";
import { useAction } from "@/hooks/useAction";
import { useLoad } from "@/hooks/useLoad";
import { dateTime, num } from "@/utils/format";
import "@/features/sales/styles/sales.scss";

const KG_HINT = "Nhập số kg lớn hơn 0, tối đa 3 số sau dấu phẩy (ví dụ 48,5).";

/** "48,5" để điền lại ô sửa: dấu phẩy thập phân như người dùng gõ. */
const kgText = (kg: number) => String(kg).replace(".", ",");

/** Việc tiếp theo của thương lái trên phiếu cân, bằng chữ. */
function agreementBadge(data: LotWeighingSheet) {
  if (data.agreement) return <Badge text={`Bạn đã đồng ý ${num(data.agreement.agreedKg, "kg")} lúc ${dateTime(data.agreement.agreedAt)}`} tone="success" />;
  if (data.weighedKg === null) return <Badge text="Chờ HTX hoàn tất phiếu cân" tone="neutral" />;
  if (data.needsCompleting) return <Badge text="HTX đang sửa số cân, chờ HTX hoàn tất lại" tone="neutral" />;
  return data.needsAgreement ? <Badge text="Cần bạn đồng ý số cân" tone="warning" /> : null;
}

/**
 * Phiếu cân của một lô, phía thương lái (chốt 24/11/2026, OMTS-227): thương lái tự cân từng lồng bên cạnh HTX, mỗi lồng lưu ngay lên server, hai cột
 * đặt cạnh nhau theo thứ tự lồng. Số của HTX là số chính thức: lệch thì báo HTX cân lại và sửa lồng của HTX. HTX hoàn tất phiếu cân xong thì thương lái
 * bấm "Đồng ý số cân" (theo số HTX); chưa đồng ý thì HTX chưa lập được hóa đơn cho lô. Server quyết định ai được đồng ý và lúc nào.
 */
export default function MyLotWeighingPage() {
  const { lotId = "" } = useParams();
  const sheet = useLoad(() => myWeighingSheet(lotId), [lotId]);
  const { busy, run } = useAction();
  const [kg, setKg] = useState("");
  const [error, setError] = useState("");
  // Mã của lần gửi lồng đang chờ: giữ nguyên khi gửi lại sau lỗi mạng để server không cân trùng; đổi khi đã lưu xong.
  const [operationId, setOperationId] = useState(newOperationId);
  const [editing, setEditing] = useState<{ cage: LotTraderCage; position: number } | null>(null);
  const [editKg, setEditKg] = useState("");
  const [removing, setRemoving] = useState(false);
  const [agreeing, setAgreeing] = useState(false);

  const saveCage = async () => {
    const value = cageKg(kg);
    if (value === null) {
      setError(KG_HINT);
      return;
    }
    setError("");
    const saved = await run(() => addMyCage(lotId, { kg: value, clientOperationId: operationId }));
    if (!saved) return;
    sheet.setData(saved);
    setKg("");
    setOperationId(newOperationId());
  };

  const pick = (current: LotWeighingSheet, cageId: string, position: number) => {
    const cage = current.traderCages.find((c) => c.id === cageId);
    if (!cage || busy) return;
    setEditing({ cage, position });
    setEditKg(kgText(cage.kg));
    setError("");
  };

  const saveEdit = async () => {
    if (!editing) return;
    const value = cageKg(editKg);
    if (value === null) {
      setError(KG_HINT);
      return;
    }
    const saved = await run(() => updateMyCage(lotId, editing.cage.id, { kg: value }), `Đã sửa lồng ${editing.position}`);
    if (!saved) return;
    sheet.setData(saved);
    setEditing(null);
  };

  const confirmRemove = async () => {
    if (!editing) return;
    const saved = await run(() => removeMyCage(lotId, editing.cage.id), `Đã xóa lồng ${editing.position}`);
    if (!saved) return;
    sheet.setData(saved);
    setRemoving(false);
    setEditing(null);
  };

  const agree = async (current: LotWeighingSheet) => {
    const saved = await run(() => agreeWeighing(lotId, { rowVersion: current.rowVersion }), `Đã đồng ý số cân lô ${current.lotCode}`);
    setAgreeing(false);
    // HTX vừa sửa hoặc hoàn tất lại phiếu cân sau khi mở (409): đọc lại để xem số mới rồi đồng ý lại.
    if (saved) sheet.setData(saved);
    else void sheet.reload();
  };

  return (
    <ManagePage title="Phiếu cân">
      <Loadable data={sheet.data} error={sheet.error} reload={() => void sheet.reload()}>
        {(data) => {
          const product = data.products[0];
          const next = data.traderCages.length + 1;
          const gap = kgGap(data.cagesKg, data.traderCagesKg);
          return (
            <>
              <Facts items={[
                ["Lô", data.lotCode],
                ["Đơn", data.orderCodes.length ? data.orderCodes.join(", ") : null],
                ["Loại hàu", product?.productName],
                ["Trạng thái", lotStatusLabel(data.statusId, data.status).text],
                ["HTX đã chốt", data.weighedKg !== null ? `${num(data.weighedKg, "kg")} (lúc ${dateTime(data.weighedAt)})` : null],
              ]} />

              <div className="card weighing-total">
                <p className="weighing-total__meta">Số chính thức của HTX</p>
                <p className="weighing-total__value">{num(data.cagesKg, "kg")}</p>
                <p className="weighing-total__meta">
                  HTX cân {num(data.cages.length, "lồng")}; bạn cân {num(data.traderCages.length, "lồng")}, {num(data.traderCagesKg, "kg")}
                </p>
                {agreementBadge(data)}
              </div>

              <p className="form__intro">
                Bạn cân cùng HTX ở cảng để đối chiếu. Số của HTX là số chính thức để lập hóa đơn: lồng nào lệch thì báo HTX cân lại và sửa lồng của HTX.
              </p>

              {data.canEdit ? (
                <Section title={`Cân lồng ${next}`}>
                  <div className="form">
                    <NumberInput label={`Số kg bạn cân được ở lồng ${next}`} value={kg} onChange={setKg} decimal disabled={busy} />
                    <FormError text={error} />
                    <Button fullWidth size="large" loading={busy} disabled={busy || !kg.trim()} onClick={() => void saveCage()}>
                      Lưu lồng {next}
                    </Button>
                  </div>
                </Section>
              ) : (
                <p className="form__intro">Lô đã đóng nên không cân thêm hay sửa lồng được nữa.</p>
              )}

              <Section title="Đối chiếu với HTX">
                {data.canEdit && data.traderCages.length > 0 && <p className="form__hint">Bấm vào một dòng để sửa hoặc xóa lồng bạn đã cân.</p>}
                <WeighingCompare cages={data.cages} traderCages={data.traderCages} cagesKg={data.cagesKg} traderCagesKg={data.traderCagesKg}
                  editable="trader" onPick={data.canEdit && !busy ? (cageId, position) => pick(data, cageId, position) : undefined} />
              </Section>

              {data.canAgree && (
                <div className="button-stack">
                  <Button fullWidth size="large" disabled={busy} onClick={() => setAgreeing(true)}>Đồng ý số cân</Button>
                </div>
              )}

              <ConfirmSheet
                visible={agreeing}
                title="Đồng ý số cân?"
                message={`Lô ${data.lotCode}: HTX chốt ${num(data.cages.length, "lồng")}, tổng ${num(data.weighedKg ?? data.cagesKg, "kg")}. ${
                  gap ? `Bạn cân được ${num(data.traderCagesKg, "kg")}, ${gap} so với HTX. ` : "Khớp với số bạn cân. "
                }Số chính thức là số của HTX: đồng ý xong thì HTX lập hóa đơn theo số này. Chưa đồng ý thì báo HTX cân lại lồng lệch.`}
                confirmText="Đồng ý số cân"
                busy={busy}
                onClose={() => setAgreeing(false)}
                onConfirm={() => void agree(data)}
              />
            </>
          );
        }}
      </Loadable>

      <Sheet visible={editing !== null && !removing} onClose={() => setEditing(null)} autoHeight mask handler swipeToClose={!busy} title={editing ? `Sửa lồng ${editing.position} của bạn` : ""}>
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
        message={editing ? `Lồng ${num(editing.cage.kg, "kg")} sẽ không còn trong số bạn cân. Số của HTX không đổi.` : ""}
        confirmText="Xóa lồng"
        danger
        busy={busy}
        onClose={() => setRemoving(false)}
        onConfirm={() => void confirmRemove()}
      />
    </ManagePage>
  );
}
