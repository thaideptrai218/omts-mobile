import type { InputItem } from "@/features/purchasing/models/InputItem";
import type { InputSeedLots, InputUseFormChoices as Choices, InputUseFormLine as Line } from "@/features/purchasing/models/InputIssue";
import { useEffect, useRef, useState } from "react";
import { Button, Icon, Input, Select, useNavigate, useSnackbar } from "zmp-ui";

import { Actions } from "@/components/Actions/Actions";
import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Facts } from "@/components/Facts/Facts";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { NumberInput } from "@/components/NumberInput/NumberInput";
import { Section } from "@/components/Section/Section";
import { MESSAGES } from "@/constants/messages";
import { useBusinessPermission } from "@/hooks/useBusinessPermission";
import { useLoad } from "@/hooks/useLoad";
import { errorText } from "@/utils/errorText";
import { money, num, parseNumber } from "@/utils/format";
import { listRafts, USAGE, zoneLookup } from "@/features/farming/services/farmService";
import { createIssue, getSeedLots, listIssueReceivers, listIssueTypes } from "@/features/purchasing/services/inputIssueService";
import { listInputItems, STATUS_IN_USE } from "@/features/purchasing/services/purchasingService";
import { issueErrorText } from "@/features/purchasing/utils/inputIssueText";

let lineKey = 0;
const emptyLine = (): Line => ({ key: ++lineKey, itemId: "", itemUnitId: null, quantity: "", seedLotLineId: "" });

/** Số lượng hợp lệ: lớn hơn 0, tối đa 2 chữ số thập phân (như bản web). */
function quantityOf(text: string) {
  const n = parseNumber(text);
  return n !== null && n > 0 && Math.round(n * 100) / 100 === n ? n : null;
}

/**
 * Lập phiếu xuất dùng vật tư cho một bè (`/manage/input-uses/new`), bản gọn của màn lập phiếu trên web: chọn vùng, bè,
 * loại xuất, người nhận (không bắt buộc), thêm vật tư với số lượng và lô giống. Lưu là hoàn thành luôn (một lần gọi), nên
 * thiếu hàng thì không để lại phiếu tạm. Thời gian là lúc lưu, mã phiếu hệ thống tự cấp. Phiếu tạm, đổi giờ xuất, đặt mã
 * riêng, ghi chú từng dòng và sửa phiếu đã hoàn thành làm trên bản web.
 */
function InputUseFormPage() {
  const allowed = useBusinessPermission();
  const { data, error, reload } = useLoad<Choices>(async () => {
    const [zones, items, types] = await Promise.all([zoneLookup(), listInputItems({ statusId: STATUS_IN_USE }), listIssueTypes()]);
    return { zones: zones.filter((z) => z.statusId === USAGE.inUse && allowed("INPUT_ISSUES", "Create", z.id)), items, types };
  }, []);

  if (data && data.zones.length > 0) return <IssueForm choices={data} />;

  return (
    <ManagePage title="Lập phiếu xuất dùng">
      <Loadable data={data} error={error} reload={() => void reload()}>
        {() => <p className="form__intro">Bạn chưa được lập phiếu xuất dùng ở vùng nuôi nào đang hoạt động.</p>}
      </Loadable>
    </ManagePage>
  );
}

function IssueForm({ choices }: { choices: Choices }) {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const [zoneId, setZoneId] = useState(choices.zones.length === 1 ? choices.zones[0].id : "");
  const [raftId, setRaftId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [notes, setNotes] = useState("");
  const [lots, setLots] = useState<Record<string, InputSeedLots>>({});
  const requested = useRef(new Set<string>());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Bè đang dùng và người nhận của vùng đã chọn; đổi vùng thì chọn lại bè và người nhận.
  const place = useLoad(async () => {
    if (!zoneId) return null;
    const [rafts, receivers] = await Promise.all([listRafts(zoneId, USAGE.inUse), listIssueReceivers(zoneId)]);
    return { rafts, receivers };
  }, [zoneId]);
  const rafts = place.data?.rafts ?? [];
  const receivers = place.data?.receivers ?? [];

  useEffect(() => {
    if (place.data?.rafts.length === 1) setRaftId(place.data.rafts[0].id);
  }, [place.data]);

  const changeZone = (next: string) => {
    setZoneId(next);
    setRaftId("");
    setReceiverId("");
    setError("");
  };

  const itemOf = (l: Line): InputItem | undefined => choices.items.find((x) => x.id === l.itemId);
  const unitOf = (l: Line, item = itemOf(l)) => item?.units.find((u) => (l.itemUnitId ? u.id === l.itemUnitId : u.isBase));
  const factorOf = (l: Line) => unitOf(l)?.factor ?? 1;
  const unitName = (l: Line) => unitOf(l)?.name ?? itemOf(l)?.unit ?? "";
  const lineValue = (l: Line) => Math.round((quantityOf(l.quantity) ?? 0) * (itemOf(l)?.costPrice ?? 0) * factorOf(l));
  const total = lines.reduce((t, l) => t + lineValue(l), 0);

  const updateLine = (key: number, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  // Vật tư giống: tải lô một lần cho mỗi vật tư, dòng chưa chọn lô lấy lô backend gợi ý (lô cũ nhất còn hàng).
  const loadLots = async (itemId: string) => {
    if (requested.current.has(itemId)) return;
    requested.current.add(itemId);
    try {
      const result = await getSeedLots(itemId);
      setLots((m) => ({ ...m, [itemId]: result }));
      setLines((ls) => ls.map((l) => (l.itemId === itemId && l.seedLotLineId === null ? { ...l, seedLotLineId: result.suggestedLotId ?? "" } : l)));
    } catch (err) {
      requested.current.delete(itemId);
      setError(errorText(err));
    }
  };

  const chooseItem = (key: number, itemId: string) => {
    const item = choices.items.find((x) => x.id === itemId);
    const seed = item?.group === "Seed";
    const known = lots[itemId];
    updateLine(key, { itemId, itemUnitId: null, seedLotLineId: seed ? (known ? (known.suggestedLotId ?? "") : null) : "" });
    if (seed) void loadLots(itemId);
  };

  /** Kiểm tra trước khi hỏi xác nhận; trả về chữ lỗi hoặc chuỗi rỗng. */
  const check = () => {
    if (!zoneId) return MESSAGES.MSG01("Vùng nuôi");
    if (!raftId) return MESSAGES.MSG01("Bè nhận vật tư");
    if (!typeId) return MESSAGES.MSG01("Loại xuất");
    const filled = lines.filter((l) => l.itemId || l.quantity);
    if (filled.length === 0) return MESSAGES.MSG01("Vật tư xuất");
    for (const [i, l] of filled.entries()) {
      if (!l.itemId) return MESSAGES.MSG01(`Vật tư ở dòng ${i + 1}`);
      if (!quantityOf(l.quantity)) return `Dòng ${i + 1}: nhập số lượng lớn hơn 0, tối đa 2 chữ số sau dấu phẩy.`;
      if (l.seedLotLineId === null) {
        // Lần tải trước lỗi thì tải lại ngay.
        void loadLots(l.itemId);
        return `Dòng ${i + 1}: đang tải lô giống, thử lại sau giây lát.`;
      }
    }
    return "";
  };

  const askComplete = () => {
    const problem = check();
    setError(problem);
    if (!problem) setConfirming(true);
  };

  const save = async () => {
    setConfirming(false);
    setBusy(true);
    setError("");
    try {
      const saved = await createIssue({
        kind: "Use",
        code: null,
        issuedAt: null,
        zoneId,
        raftId,
        issueTypeId: typeId,
        receiverEmployeeId: receiverId || null,
        reason: null,
        notes: notes.trim() || null,
        lines: lines
          .filter((l) => l.itemId)
          .map((l) => ({
            itemId: l.itemId,
            itemUnitId: l.itemUnitId,
            quantity: quantityOf(l.quantity) ?? 0,
            seedLotLineId: itemOf(l)?.group === "Seed" ? l.seedLotLineId || null : null,
            note: null,
          })),
        complete: true,
      });
      openSnackbar({ text: `Đã hoàn thành phiếu ${saved.code}.`, type: "success", duration: 4000 });
      navigate(`/manage/input-uses/${saved.id}`, { replace: true });
    } catch (err) {
      setError(issueErrorText(err, choices.items, lots));
    } finally {
      setBusy(false);
    }
  };

  const zoneName = (id: string) => {
    const z = choices.zones.find((x) => x.id === id);
    return z ? `${z.code ?? ""} ${z.name ?? ""}`.trim() : "";
  };
  const raftCode = rafts.find((r) => r.id === raftId)?.code ?? "";

  return (
    <ManagePage
      title="Lập phiếu xuất dùng"
      footer={
        <Button fullWidth size="large" loading={busy} disabled={busy} onClick={askComplete}>
          Hoàn thành phiếu
        </Button>
      }
    >
      <div className="form">
        <Section step={1} title="Giao cho bè">
          <div className="form card">
            <Select label="Vùng nuôi (bắt buộc)" placeholder="Chọn vùng nuôi" value={zoneId || undefined} onChange={(v) => changeZone(String(v))} closeOnSelect disabled={busy}>
              {choices.zones.map((z) => (
                <Select.Option key={z.id} value={z.id} title={zoneName(z.id)} />
              ))}
            </Select>
            {zoneId && place.error && <FormError text={place.error} />}
            {zoneId && place.data && rafts.length === 0 && <p className="form__hint">Vùng này chưa có bè đang dùng.</p>}
            <Select
              label="Bè nhận vật tư (bắt buộc)"
              placeholder={zoneId ? "Chọn bè" : "Chọn vùng trước"}
              value={raftId || undefined}
              onChange={(v) => setRaftId(String(v))}
              closeOnSelect
              disabled={busy || !zoneId || rafts.length === 0}
            >
              {rafts.map((r) => (
                <Select.Option key={r.id} value={r.id} title={`Bè ${r.code ?? ""}`} />
              ))}
            </Select>
            <Select label="Loại xuất (bắt buộc)" placeholder="Chọn loại xuất" value={typeId || undefined} onChange={(v) => setTypeId(String(v))} closeOnSelect disabled={busy}>
              {choices.types.map((t) => (
                <Select.Option key={t.id} value={t.id} title={t.name} />
              ))}
            </Select>
            <Select
              label="Người nhận (không bắt buộc)"
              placeholder={zoneId ? "Chưa chọn" : "Chọn vùng trước"}
              value={receiverId}
              onChange={(v) => setReceiverId(String(v ?? ""))}
              closeOnSelect
              disabled={busy || !zoneId}
            >
              <Select.Option value="" title="Chưa chọn" />
              {receivers.map((p) => (
                <Select.Option key={p.id} value={p.id} title={p.fullName} />
              ))}
            </Select>
          </div>
        </Section>

        <Section step={2} title="Vật tư xuất">
          <div className="form">
            {lines.map((l, i) => {
              const item = itemOf(l);
              const unit = unitName(l);
              const factor = factorOf(l);
              const seed = item?.group === "Seed";
              const itemLots = item ? lots[item.id] : undefined;
              const lot = itemLots?.lots.find((x) => x.seedLotLineId === l.seedLotLineId);
              // Còn trong kho theo đơn vị đang chọn: của lô đã chọn, của phần chưa gắn lô, hoặc của cả vật tư.
              const onHand = !item ? null : seed && itemLots ? (lot ? lot.onHand : itemLots.unlottedQuantity) : seed ? null : item.onHand;
              const value = lineValue(l);
              return (
                <div key={l.key} className="line-item card">
                  <div className="line-item__head">
                    <span>Dòng {i + 1}</span>
                  </div>
                  <Select label="Vật tư (bắt buộc)" placeholder="Chọn vật tư" value={l.itemId || undefined} onChange={(v) => chooseItem(l.key, String(v))} closeOnSelect disabled={busy}>
                    {choices.items.map((x) => (
                      <Select.Option key={x.id} value={x.id} title={`${x.name} · còn ${num(x.onHand, x.unit)}`} />
                    ))}
                  </Select>
                  {item && item.units.length > 1 && (
                    <Select
                      label="Đơn vị"
                      value={unitOf(l, item)?.id}
                      onChange={(v) => updateLine(l.key, { itemUnitId: item.units.find((u) => u.id === v)?.isBase ? null : String(v) })}
                      closeOnSelect
                      disabled={busy}
                    >
                      {item.units.map((u) => (
                        <Select.Option key={u.id} value={u.id} title={u.isBase ? u.name : `${u.name} (${num(u.factor, item.unit)})`} />
                      ))}
                    </Select>
                  )}
                  {seed && !itemLots && <p className="form__hint">Đang tải lô giống…</p>}
                  {seed && itemLots && (
                    <Select label="Lô giống" value={l.seedLotLineId ?? ""} onChange={(v) => updateLine(l.key, { seedLotLineId: String(v ?? "") })} closeOnSelect disabled={busy}>
                      <Select.Option value="" title={`Chưa gắn lô · còn ${num(itemLots.unlottedQuantity, itemLots.unit)}`} />
                      {itemLots.lots.map((x) => (
                        <Select.Option key={x.seedLotLineId} value={x.seedLotLineId} title={`${x.code} · còn ${num(x.onHand, itemLots.unit)}`} />
                      ))}
                    </Select>
                  )}
                  <NumberInput
                    label={`Số lượng${unit ? ` (${unit})` : ""}`}
                    value={l.quantity}
                    onChange={(v) => updateLine(l.key, { quantity: v })}
                    disabled={busy}
                    decimal
                    helperText={onHand !== null ? `Kho còn ${num(Math.round((onHand / factor) * 100) / 100, unit)}` : undefined}
                  />
                  {value > 0 && <p className="form__hint">Giá trị theo giá vốn {money(value)}</p>}
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
              Thêm vật tư
            </Button>
          </div>
        </Section>

        <Section step={3} title="Ghi chú">
          <div className="form card">
            <Input.TextArea label="Ghi chú (không bắt buộc)" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} showCount disabled={busy} />
          </div>
        </Section>

        <FormError text={error} />
      </div>

      <ConfirmSheet
        visible={confirming}
        title="Hoàn thành phiếu xuất dùng?"
        message={
          <div className="form">
            <Facts
              items={[
                ["Vùng nuôi", zoneName(zoneId)],
                ["Bè", raftCode],
                ["Số dòng hàng", String(lines.filter((l) => l.itemId).length)],
                ["Tổng giá trị", money(total)],
              ]}
            />
            <p>Hoàn thành thì kho trừ ngay số lượng đã xuất. Muốn sửa sau đó, mở phiếu trên bản web.</p>
          </div>
        }
        confirmText="Hoàn thành"
        onClose={() => setConfirming(false)}
        onConfirm={() => void save()}
      />
    </ManagePage>
  );
}

export default InputUseFormPage;
