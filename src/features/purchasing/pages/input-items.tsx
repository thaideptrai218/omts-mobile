import { useState } from "react";
import { Button, Input, Select, Sheet } from "zmp-ui";

import FormError from "@/shared/ui/form-error";
import { Badge, Chips, Empty, Loadable, ManagePage, Row, Rows } from "@/shared/ui/ui";
import { useLoad } from "@/shared/hooks/use-load";
import { errorText, MESSAGES } from "@/shared/lib/messages";
import { INPUT_GROUP, statusLabel } from "@/shared/lib/labels";
import {
  createInputItem,
  listInputItems,
  setInputItemInUse,
  STATUS_IN_USE,
  updateInputItem,
  type InputItem,
  type InputItemGroup,
} from "@/features/purchasing/api/purchasing";

/**
 * Danh mục vật tư dùng khi lập phiếu nhập: con giống, vật tư bè, khác. Thêm, sửa, ngừng dùng hoặc dùng lại trong
 * một sheet. Vật tư đã có phiếu nhập (`isUsed`) không đổi được mã, nhóm và đơn vị (backend kiểm tra).
 */
function InputItemsPage() {
  const [group, setGroup] = useState<InputItemGroup>("RaftMaterial");
  const { data, error, reload, setData } = useLoad(() => listInputItems({ group }), [group]);
  const [editing, setEditing] = useState<InputItem | "new" | null>(null);

  const replace = (saved: InputItem) => {
    setData((items) => {
      if (!items) return items;
      if (saved.group !== group) return items.filter((x) => x.id !== saved.id);
      return items.some((x) => x.id === saved.id) ? items.map((x) => (x.id === saved.id ? saved : x)) : [...items, saved];
    });
  };

  return (
    <ManagePage
      title="Danh mục vật tư"
      footer={
        <Button fullWidth size="large" onClick={() => setEditing("new")}>
          Thêm vật tư
        </Button>
      }
    >
      <Chips
        options={(Object.keys(INPUT_GROUP) as InputItemGroup[]).map((k) => [k, INPUT_GROUP[k]])}
        value={group}
        onChange={setGroup}
      />
      <Loadable data={data} error={error} reload={() => void reload()}>
        {(items) =>
          items.length === 0 ? (
            <Empty icon="zi-list-2" title="Chưa có vật tư nào trong nhóm này" />
          ) : (
            <Rows>
              {items.map((x) => {
                const st = statusLabel(x.status);
                return (
                  <Row
                    key={x.id}
                    title={x.name}
                    meta={`${x.code ?? ""} · ${x.unit ?? ""}${x.description ? ` · ${x.description}` : ""}`}
                    badge={x.statusId !== STATUS_IN_USE ? <Badge text={st.text} tone={st.tone} /> : undefined}
                    onClick={() => setEditing(x)}
                  />
                );
              })}
            </Rows>
          )
        }
      </Loadable>

      <ItemSheet item={editing} defaultGroup={group} onClose={() => setEditing(null)} onSaved={replace} />
    </ManagePage>
  );
}

function ItemSheet({
  item,
  defaultGroup,
  onClose,
  onSaved,
}: {
  item: InputItem | "new" | null;
  defaultGroup: InputItemGroup;
  onClose: () => void;
  onSaved: (item: InputItem) => void;
}) {
  const existing = item && item !== "new" ? item : null;
  return (
    <Sheet visible={item !== null} onClose={onClose} autoHeight mask handler swipeToClose title={existing ? "Sửa vật tư" : "Thêm vật tư"}>
      {/* Đổi key để form nạp lại giá trị mỗi lần mở cho một vật tư khác. */}
      {item !== null && <ItemForm key={existing?.id ?? "new"} existing={existing} defaultGroup={defaultGroup} onClose={onClose} onSaved={onSaved} />}
    </Sheet>
  );
}

function ItemForm({
  existing,
  defaultGroup,
  onClose,
  onSaved,
}: {
  existing: InputItem | null;
  defaultGroup: InputItemGroup;
  onClose: () => void;
  onSaved: (item: InputItem) => void;
}) {
  const [code, setCode] = useState(existing?.code ?? "");
  const [name, setName] = useState(existing?.name ?? "");
  const [group, setGroup] = useState<InputItemGroup>(existing?.group ?? defaultGroup);
  const [unit, setUnit] = useState(existing?.unit ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const locked = Boolean(existing?.isUsed);

  const submit = async (action: () => Promise<InputItem>) => {
    setError("");
    setBusy(true);
    try {
      onSaved(await action());
      onClose();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    if (!code.trim()) return setError(MESSAGES.MSG01("Mã"));
    if (!name.trim()) return setError(MESSAGES.MSG01("Tên"));
    if (!unit.trim()) return setError(MESSAGES.MSG01("Đơn vị"));
    const body = { code: code.trim(), name: name.trim(), group, unit: unit.trim(), description: description.trim() || null, rowVersion: existing?.rowVersion };
    void submit(() => (existing ? updateInputItem(existing.id, body) : createInputItem(body)));
  };

  const inUse = existing?.statusId === STATUS_IN_USE;

  return (
    <div className="sheet-form form">
      {locked && <p className="form__hint">Vật tư đã có trong phiếu nhập nên không đổi được mã, nhóm và đơn vị.</p>}
      <Input label="Mã" value={code} onChange={(e) => setCode(e.target.value)} maxLength={50} disabled={busy || locked} />
      <Input label="Tên" value={name} onChange={(e) => setName(e.target.value)} maxLength={200} disabled={busy} />
      <Select label="Nhóm" value={group} onChange={(v) => setGroup(v as InputItemGroup)} closeOnSelect disabled={busy || locked}>
        {(Object.keys(INPUT_GROUP) as InputItemGroup[]).map((k) => (
          <Select.Option key={k} value={k} title={INPUT_GROUP[k]} />
        ))}
      </Select>
      <Input label="Đơn vị (cái, cuộn, kg…)" value={unit} onChange={(e) => setUnit(e.target.value)} maxLength={50} disabled={busy || locked} />
      <Input.TextArea label="Mô tả" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} showCount disabled={busy} />
      <FormError text={error} />
      <Button fullWidth size="large" loading={busy} disabled={busy} onClick={save}>
        Lưu
      </Button>
      {existing && (
        <Button
          fullWidth
          size="large"
          variant="tertiary"
          type={inUse ? "danger" : "highlight"}
          disabled={busy}
          onClick={() => void submit(() => setInputItemInUse(existing.id, !inUse))}
        >
          {inUse ? "Ngừng dùng vật tư này" : "Dùng lại vật tư này"}
        </Button>
      )}
    </div>
  );
}

export default InputItemsPage;
