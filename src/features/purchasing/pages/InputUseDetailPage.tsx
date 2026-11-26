import { useState } from "react";
import { Button, useNavigate, useParams } from "zmp-ui";

import { Actions } from "@/components/Actions/Actions";
import { Badge } from "@/components/Badge/Badge";
import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Facts } from "@/components/Facts/Facts";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { ReasonSheet } from "@/components/ReasonSheet/ReasonSheet";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import { useAction } from "@/hooks/useAction";
import { useBusinessPermission } from "@/hooks/useBusinessPermission";
import { useLoad } from "@/hooks/useLoad";
import { dateTime, money, num } from "@/utils/format";
import { MetaLines } from "@/features/purchasing/components/MetaLines/MetaLines";
import { cancelIssue, completeIssue, getIssue, ISSUE_COMPLETED, ISSUE_DRAFT, removeDraftIssue } from "@/features/purchasing/services/inputIssueService";
import { issuePlace, issueStatusLabel } from "@/features/purchasing/utils/inputIssueText";

/**
 * Chi tiết phiếu xuất dùng: nơi nhận, loại xuất, các dòng hàng với giá vốn và giá trị. Theo bản web: phiếu tạm thì hoàn thành
 * hoặc xóa; phiếu hoàn thành thì hủy kèm lý do, số lượng đã xuất được cộng lại vào kho. Sửa dòng hàng, sửa phiếu đã hoàn
 * thành và sao chép phiếu làm trên bản web.
 */
function InputUseDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const allowed = useBusinessPermission();
  const { data, error, reload, setData } = useLoad(() => getIssue(id), [id]);
  const { busy, run } = useAction();
  const [completing, setCompleting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const zoneId = data?.zoneId ?? null;
  const isDraft = data?.statusId === ISSUE_DRAFT;
  const isCompleted = data?.statusId === ISSUE_COMPLETED;
  const canComplete = isDraft && allowed("INPUT_ISSUES", "Edit", zoneId);
  const canRemove = isDraft && allowed("INPUT_ISSUES", "Delete", zoneId);
  const canCancel = isCompleted && allowed("INPUT_ISSUES", "Delete", zoneId);

  const complete = async () => {
    if (!data) return;
    const saved = await run(() => completeIssue(id, { rowVersion: data.rowVersion }), `Đã hoàn thành phiếu ${data.code}.`);
    setCompleting(false);
    if (saved) setData(saved);
  };

  const remove = async () => {
    if (!data) return;
    const done = await run(async () => {
      await removeDraftIssue(id);
      return true;
    }, `Đã xóa phiếu tạm ${data.code}.`);
    setRemoving(false);
    if (done) navigate("/manage/input-uses", { replace: true });
  };

  return (
    <ManagePage
      title={data ? `Phiếu ${data.code}` : "Phiếu xuất dùng"}
      footer={
        canComplete ? (
          <Button fullWidth size="large" onClick={() => setCompleting(true)}>
            Hoàn thành phiếu
          </Button>
        ) : undefined
      }
    >
      <Loadable data={data} error={error} reload={() => void reload()}>
        {(r) => {
          const st = issueStatusLabel(r.statusId);
          return (
            <>
              <Facts
                items={[
                  ["Trạng thái", <Badge key="st" text={st.text} tone={st.tone} />],
                  ["Thời gian xuất", dateTime(r.issuedAt)],
                  ["Nơi nhận", issuePlace(r.zoneCode, r.raftCode)],
                  ["Loại xuất", r.issueTypeName ?? (isDraft ? "Chưa chọn" : null)],
                  ["Người nhận", r.receiverName],
                  ["Ghi chú", r.notes],
                  ["Người lập", r.createdBy],
                  ["Hoàn thành lúc", r.completedAt ? dateTime(r.completedAt) : null],
                  ["Hủy lúc", r.cancelledAt ? dateTime(r.cancelledAt) : null],
                  ["Lý do hủy", r.cancelReason],
                ]}
              />
              {isDraft && <p className="form__hint">Phiếu tạm chưa trừ kho. Muốn sửa dòng hàng, mở phiếu trên bản web.</p>}

              {(canRemove || canCancel) && (
                <Actions>
                  {canRemove && (
                    <Button variant="tertiary" type="danger" size="large" onClick={() => setRemoving(true)}>
                      Xóa phiếu tạm
                    </Button>
                  )}
                  {canCancel && (
                    <Button variant="tertiary" type="danger" size="large" onClick={() => setCancelling(true)}>
                      Hủy phiếu
                    </Button>
                  )}
                </Actions>
              )}

              <Section title={`Vật tư xuất (${r.lines.length})`}>
                <div className="form">
                  <Rows>
                    {r.lines.map((l) => (
                      <Row
                        key={l.id}
                        title={l.itemName}
                        meta={
                          <MetaLines
                            items={[
                              ["Mã hàng", l.itemCode],
                              ["Số lượng", num(l.quantity, l.unit)],
                              ["Trừ kho", l.unitFactor !== 1 ? num(l.baseQuantity, l.baseUnit) : null],
                              ["Lô giống", l.group === "Seed" ? (l.seedLotCode ?? "Chưa gắn lô") : null],
                              ["Giá vốn", `${money(l.unitCost)} mỗi ${l.unit}`],
                              ["Giá trị", money(l.value)],
                              ["Ghi chú", l.note],
                            ]}
                          />
                        }
                      />
                    ))}
                  </Rows>
                  <Facts items={[["Tổng giá trị", money(r.totalValue)]]} />
                </div>
              </Section>

              <ConfirmSheet
                visible={completing}
                title={`Hoàn thành phiếu ${r.code}?`}
                message={
                  <div className="form">
                    <Facts
                      items={[
                        ["Nơi nhận", issuePlace(r.zoneCode, r.raftCode)],
                        ["Số dòng hàng", String(r.lines.length)],
                        ["Tổng giá trị", money(r.totalValue)],
                      ]}
                    />
                    <p>Hoàn thành thì kho trừ số lượng các dòng hàng.</p>
                  </div>
                }
                confirmText="Hoàn thành"
                busy={busy}
                onClose={() => setCompleting(false)}
                onConfirm={() => void complete()}
              />

              <ConfirmSheet
                visible={removing}
                title="Xóa phiếu tạm?"
                message={`Phiếu tạm ${r.code} và các dòng hàng của nó sẽ bị xóa.`}
                confirmText="Xóa phiếu tạm"
                danger
                busy={busy}
                onClose={() => setRemoving(false)}
                onConfirm={() => void remove()}
              />

              <ReasonSheet
                visible={cancelling}
                title={`Hủy phiếu ${r.code}`}
                intro="Số lượng đã xuất được cộng lại vào kho. Phiếu đã hủy không dùng lại được."
                confirmText="Hủy phiếu"
                required
                danger
                maxLength={1000}
                busy={busy}
                onClose={() => setCancelling(false)}
                onConfirm={async (reason) => {
                  const saved = await run(() => cancelIssue(id, { reason, rowVersion: r.rowVersion }), `Đã hủy phiếu ${r.code}.`);
                  if (!saved) return false;
                  setData(saved);
                  setCancelling(false);
                  return true;
                }}
              />
            </>
          );
        }}
      </Loadable>
    </ManagePage>
  );
}

export default InputUseDetailPage;
