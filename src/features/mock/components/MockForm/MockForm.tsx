import type { MockField } from "@/features/mock/models/MockModule";
import { useState } from "react";
import { Button, Icon, Input, Select, useSnackbar } from "zmp-ui";

import DateField from "@/components/DateField/DateField";
import FormError from "@/components/FormError/FormError";
import { NumberInput } from "@/components/NumberInput/NumberInput";
import { choosePhoto } from "@/services/zaloService";

const start = (fields: MockField[]) => Object.fromEntries(fields.map((f) => [f.key, f.value ?? ""]));

/** Form dựng từ danh sách trường của thao tác mẫu. Ảnh chỉ giữ trên máy, không tải lên máy chủ. */
export function MockForm({
  fields,
  submitLabel,
  busy,
  onCancel,
  onSubmit,
}: {
  fields: MockField[];
  submitLabel: string;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (values: Record<string, string>, photos: string[]) => void;
}) {
  const { openSnackbar } = useSnackbar();
  const [values, setValues] = useState<Record<string, string>>(() => start(fields));
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState("");
  const set = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }));

  const addPhoto = async () => {
    try {
      const photo = await choosePhoto();
      if (photo) setPhotos((current) => [...current, URL.createObjectURL(photo)]);
    } catch (err) {
      openSnackbar({ text: err instanceof Error ? err.message : "Chưa lấy được ảnh.", type: "error", duration: 6000 });
    }
  };

  const submit = () => {
    const missing = fields.find((f) => f.required && (f.type === "photo" ? photos.length === 0 : !values[f.key]?.trim()));
    if (missing) {
      setError(`Vui lòng nhập ${missing.label.toLowerCase()}.`);
      return;
    }
    setError("");
    onSubmit(values, photos);
  };

  return (
    <div className="card form">
      {fields.map((f) => {
        const label = f.required ? `${f.label} (bắt buộc)` : f.label;
        switch (f.type) {
          case "number":
            return <NumberInput key={f.key} decimal label={label} value={values[f.key] ?? ""} onChange={(v) => set(f.key, v)} disabled={busy} />;
          case "date":
            return <DateField key={f.key} label={label} value={values[f.key] || null} onChange={(v) => set(f.key, v)} disabled={busy} />;
          case "textarea":
            return <Input.TextArea key={f.key} label={label} value={values[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} disabled={busy} />;
          case "select":
            return (
              <Select key={f.key} label={label} placeholder="Chọn" value={values[f.key] || undefined} disabled={busy} closeOnSelect onChange={(v) => set(f.key, String(v))}>
                {(f.options ?? []).map((o) => (
                  <Select.Option key={o} value={o} title={o} />
                ))}
              </Select>
            );
          case "photo":
            return (
              <div key={f.key}>
                {photos.map((url) => (
                  <img key={url} className="record-photo" src={url} alt={f.label} />
                ))}
                <Button fullWidth variant="secondary" size="large" prefixIcon={<Icon icon="zi-camera" />} disabled={busy} onClick={() => void addPhoto()}>
                  {label}
                </Button>
              </div>
            );
          default:
            return <Input key={f.key} label={label} value={values[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} disabled={busy} />;
        }
      })}
      <FormError text={error} />
      <div className="sheet-actions">
        <Button fullWidth size="large" loading={busy} disabled={busy} onClick={submit}>
          {submitLabel}
        </Button>
        <Button fullWidth variant="secondary" size="large" disabled={busy} onClick={onCancel}>
          Hủy
        </Button>
      </div>
    </div>
  );
}
