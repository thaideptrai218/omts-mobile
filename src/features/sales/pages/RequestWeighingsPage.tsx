import type { PortWeighing, WeighingLotDraft } from "@/features/sales/models/PortWeighing";
import type { PurchaseHarvestLot } from "@/features/sales/models/PurchaseRequest";
import { useState } from "react";
import { Button, Select, useNavigate, useParams } from "zmp-ui";

import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Empty } from "@/components/Empty/Empty";
import { Facts } from "@/components/Facts/Facts";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { NumberInput } from "@/components/NumberInput/NumberInput";
import { Section } from "@/components/Section/Section";
import { lotsForSale } from "@/features/farming/services/harvestService";
import { WeighingBadge, WeighingFacts } from "@/features/sales/components/PortWeighing/PortWeighing";
import { getPurchaseRequest } from "@/features/sales/services/salesService";
import {
  createWeighing, draftKg, requestWeighings, toLotEntries, updateWeighing, weighingDraftError,
} from "@/features/sales/services/weighingService";
import { useAction } from "@/hooks/useAction";
import { useLoad } from "@/hooks/useLoad";
import { date, dateTime, num } from "@/utils/format";
import "@/features/sales/styles/sales.scss";

/** Số lồng mỗi lô đã nằm trong các lần cân khác của đơn (trừ lần đang sửa): một lô không cân quá số lồng của lô. */
function weighedCages(rows: PortWeighing[], except: string | null): Record<string, number> {
  const weighed: Record<string, number> = {};
  rows.filter((w) => w.id !== except).forEach((w) => w.lots.forEach((lot) => { weighed[lot.harvestLotId] = (weighed[lot.harvestLotId] ?? 0) + lot.cageKgs.length; }));
  return weighed;
}

/**
 * Các lần cân của một đơn đã chấp nhận: cân lần mới, sửa khi thương lái chưa đồng ý, lập hóa đơn khi đã đồng ý. Chỉ cân sau khi Chủ HTX đánh dấu
 * đơn đã thu xong, và chỉ từ các lô ghi cho đơn này (chốt 11/11/2026).
 */
export default function RequestWeighingsPage() {
  const { requestId = "" } = useParams();
  const navigate = useNavigate();
  const request = useLoad(() => getPurchaseRequest(requestId), [requestId]);
  const weighings = useLoad(() => requestWeighings(requestId), [requestId]);
  const [editing, setEditing] = useState<PortWeighing | "new" | null>(null);
  const [opened, setOpened] = useState<PortWeighing | null>(null);
  const { busy, run } = useAction();

  const reload = () => { void weighings.reload(); void request.reload(); };
  /** Đọc lại lần cân đang mở để biết thương lái đã đồng ý chưa. */
  const refreshOpened = async (row: PortWeighing) => {
    const rows = await run(() => requestWeighings(requestId));
    if (!rows) return;
    weighings.setData(rows);
    setOpened(rows.find((w) => w.id === row.id) ?? row);
  };
  const pending = weighings.data?.find((w) => !w.confirmedAt) ?? null;

  if (editing) {
    const existing = editing === "new" ? null : editing;
    return <WeighingForm requestId={requestId} existing={existing} acceptedCages={request.data?.response?.acceptedCages ?? null}
      harvestLots={request.data?.harvest?.lots ?? []} weighed={weighedCages(weighings.data ?? [], existing?.id ?? null)}
      onDone={(saved) => { setEditing(null); setOpened(saved); reload(); }} onCancel={() => setEditing(null)} />;
  }

  if (opened) {
    const footer = opened.invoiceId ? (
      <Button fullWidth size="large" onClick={() => navigate(`/manage/invoices/${opened.invoiceId}`)}>Xem hóa đơn</Button>
    ) : opened.confirmedAt ? (
      <Button fullWidth size="large" onClick={() => navigate(`/manage/invoices/new?weighing=${opened.id}`)}>Lập hóa đơn từ lần cân này</Button>
    ) : (
      <div className="sheet-actions">
        <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void refreshOpened(opened)}>Xem thương lái đã đồng ý chưa</Button>
        <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => setEditing(opened)}>Sửa số cân</Button>
      </div>
    );
    return (
      <ManagePage title="Lần cân" footer={footer} onBack={() => { setOpened(null); reload(); }}>
        {!opened.confirmedAt && <p className="form__intro">Thương lái mở mục Phiếu cân trên điện thoại để đồng ý số cân. Đồng ý xong thì lập được hóa đơn.</p>}
        <WeighingFacts row={opened} />
      </ManagePage>
    );
  }

  return (
    <ManagePage title="Cân tại cảng" footer={request.data ? (
      request.data.fulfilled ? undefined : (
        <Button fullWidth size="large" disabled={!!pending || !request.data.harvestCompletedAt} onClick={() => setEditing("new")}>Cân lần mới</Button>
      )
    ) : undefined}>
      <Loadable data={request.data} error={request.error} reload={() => void request.reload()}>
        {(row) => (
          <Facts items={[
            ["Thương lái", row.customer.name],
            ["Sản phẩm", row.productName],
            ["Số lồng đã nhận đơn", row.response?.acceptedCages != null ? num(row.response.acceptedCages, "lồng") : null],
            ["Ngày giao", date(row.response?.pickupDate)],
            ["Cho trả sau", row.response?.payLaterAgreed ? "Có" : "Không"],
            ["Thu hoạch", row.harvestCompletedAt
              ? `Đã thu xong · ${num(row.harvest?.harvestedCages ?? 0, "lồng")} ở ${num(row.harvest?.lots.length ?? 0, "lô")}`
              : "Chưa thu xong"],
          ]} />
        )}
      </Loadable>
      {request.data?.fulfilled && <p className="form__hint">Đơn này đã giao đủ, không cân thêm.</p>}
      {request.data && !request.data.fulfilled && !request.data.harvestCompletedAt && (
        <p className="form__hint">Chủ HTX chưa đánh dấu đơn này đã thu xong. Thu xong mới cân được.</p>
      )}
      {pending && <p className="form__hint">Còn một lần cân chờ thương lái đồng ý. Xong lần đó mới cân lần mới.</p>}
      <Section title="Các lần cân">
        <Loadable data={weighings.data} error={weighings.error} reload={() => void weighings.reload()}>
          {(rows) => rows.length ? (
            <ul className="rows">
              {rows.map((w) => (
                <li key={w.id}>
                  <button type="button" className="row" onClick={() => setOpened(w)}>
                    <span className="row__text">
                      <span className="row__title">{num(w.cageCount, "lồng")} · {num(w.totalKg, "kg")}</span>
                      <span className="row__meta">Cân lúc {dateTime(w.weighedAt)}</span>
                      <span className="row__badges"><WeighingBadge row={w} /></span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <Empty icon="zi-inbox" title="Chưa cân lần nào" text="Bấm Cân lần mới khi hàng ra đến cảng." />
          )}
        </Loadable>
      </Section>
    </ManagePage>
  );
}

const fromWeighing = (w: PortWeighing): WeighingLotDraft[] =>
  w.lots.map((lot) => ({ harvestLotId: lot.harvestLotId, lotCode: lot.lotCode, cageKgs: lot.cageKgs.map((kg) => String(kg).replace(".", ",")) }));

/** Phiếu cân: chọn lô của đơn, nhập kg từng lồng; hỏi lại trước khi gửi cho thương lái đồng ý. */
function WeighingForm({ requestId, existing, acceptedCages, harvestLots, weighed, onDone, onCancel }: {
  requestId: string; existing: PortWeighing | null; acceptedCages: number | null;
  /** Các lô ghi cho đơn; chỉ lô còn đang bán mới chọn được. */
  harvestLots: PurchaseHarvestLot[];
  /** Số lồng mỗi lô đã cân ở các lần cân khác của đơn. */
  weighed: Record<string, number>;
  onDone: (saved: PortWeighing) => void; onCancel: () => void;
}) {
  const lots = useLoad(() => lotsForSale(), []);
  /** Số lồng của lô chưa nằm trong lần cân nào khác. */
  const left = (lotId: string) => (harvestLots.find((l) => l.id === lotId)?.cageCount ?? 0) - (weighed[lotId] ?? 0);
  const [draft, setDraft] = useState<WeighingLotDraft[]>(() => (existing ? fromWeighing(existing) : []));
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const { busy, run } = useAction();

  const change = (index: number, patch: Partial<WeighingLotDraft>) => { setDraft((d) => d.map((lot, i) => (i === index ? { ...lot, ...patch } : lot))); setError(""); };
  const addLot = (id: string) => {
    const lot = lots.data?.lots.find((l) => l.id === id);
    if (lot && !draft.some((d) => d.harvestLotId === id)) setDraft((d) => [...d, { harvestLotId: lot.id, lotCode: lot.lotCode, cageKgs: [""] }]);
  };
  const cages = draft.reduce((sum, lot) => sum + lot.cageKgs.length, 0);
  const total = draft.reduce((sum, lot) => sum + draftKg(lot.cageKgs), 0);

  const review = () => {
    const over = draft.find((lot) => lot.cageKgs.length > left(lot.harvestLotId));
    const problem = weighingDraftError(draft)
      || (over ? `Lô ${over.lotCode} chỉ còn ${num(Math.max(left(over.harvestLotId), 0), "lồng")} chưa cân.` : "");
    setError(problem);
    if (!problem) setConfirm(true);
  };
  const save = async () => {
    const entries = toLotEntries(draft);
    const saved = await run(() => (existing ? updateWeighing(existing, entries) : createWeighing(requestId, entries)), "Đã lưu số cân. Chờ thương lái đồng ý.");
    setConfirm(false);
    if (saved) onDone(saved);
  };

  const footer = (
    <div className="sheet-actions">
      <Button fullWidth size="large" disabled={busy} onClick={review}>Lưu số cân</Button>
      <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={onCancel}>Không, quay lại</Button>
    </div>
  );
  const unused = lots.data?.lots.filter((l) => harvestLots.some((h) => h.id === l.id) && left(l.id) > 0 && !draft.some((d) => d.harvestLotId === l.id)) ?? [];
  return (
    <ManagePage title={existing ? "Sửa số cân" : "Cân lần mới"} footer={footer} onBack={onCancel}>
      <p className="form__intro">Cân từng lồng rồi nhập số kg. Đang có {num(cages, "lồng")}, tổng {num(total, "kg")}{acceptedCages !== null ? ` (đơn nhận ${num(acceptedCages, "lồng")})` : ""}.</p>
      {draft.map((lot, index) => (
        <Section key={lot.harvestLotId} title={`Lô ${lot.lotCode}`} step={index + 1}>
          <div className="card form">
            {lot.cageKgs.map((kg, cage) => (
              <NumberInput key={cage} decimal label={`Lồng ${cage + 1} (kg)`} value={kg} disabled={busy}
                onChange={(value) => change(index, { cageKgs: lot.cageKgs.map((v, i) => (i === cage ? value : v)) })} />
            ))}
            <p className="form__hint">Lô này: {num(lot.cageKgs.length, "lồng")}, {num(draftKg(lot.cageKgs), "kg")}.</p>
            <div className="sheet-actions">
              <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => change(index, { cageKgs: [...lot.cageKgs, ""] })}>Thêm lồng</Button>
              {lot.cageKgs.length > 1 && <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => change(index, { cageKgs: lot.cageKgs.slice(0, -1) })}>Bỏ lồng cuối</Button>}
              <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => setDraft((d) => d.filter((_, i) => i !== index))}>Bỏ lô này</Button>
            </div>
          </div>
        </Section>
      ))}
      <Loadable data={lots.data} error={lots.error} reload={() => void lots.reload()}>
        {() => unused.length ? (
          <div className="card form">
            <Select label={draft.length ? "Thêm lô khác" : "Chọn lô hàu đem cân (bắt buộc)"} placeholder="Chọn lô" value="" onChange={(v) => addLot(String(v))} closeOnSelect>
              {unused.map((l) => (
                <Select.Option key={l.id} value={l.id} title={`${l.lotCode} · bè ${l.raftCode} · còn ${num(left(l.id), "lồng")} chưa cân`} />
              ))}
            </Select>
          </div>
        ) : draft.length ? null : (
          <Empty title="Không còn lô nào của đơn để cân" text="Các lô ghi cho đơn này đã cân hết lồng hoặc đã đóng." />
        )}
      </Loadable>
      <FormError text={error} />
      <ConfirmSheet visible={confirm} title="Lưu số cân?" busy={busy} confirmText="Lưu và gửi thương lái"
        message={`${num(cages, "lồng")}, tổng ${num(total, "kg")}. Thương lái sẽ xem và đồng ý số cân này trên điện thoại.`}
        onClose={() => { if (!busy) setConfirm(false); }} onConfirm={() => void save()} />
    </ManagePage>
  );
}
