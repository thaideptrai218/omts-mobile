import { useEffect, useState } from "react";
import { Button, Checkbox, Input, Select, useLocation, useNavigate, useParams } from "zmp-ui";

import DateField from "@/components/DateField/DateField";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Section } from "@/components/Section/Section";
import { MESSAGES } from "@/constants/messages";
import { createLicense, getLicense, replaceLicense, updateLicense, zoneLookup } from "@/features/farming/services/farmService";
import { useLoad } from "@/hooks/useLoad";
import { choosePhoto } from "@/services/zaloService";
import { errorText } from "@/utils/errorText";
import { DOCUMENT_TYPE } from "@/utils/labels";

/**
 * Thêm giấy tờ (`/manage/licenses/new?zone=&type=`), sửa (`/manage/licenses/:id/edit`) hoặc thay bằng giấy tờ mới
 * (`/manage/licenses/:id/replace`). Thêm và thay bắt buộc có ảnh giấy tờ, sửa thì ảnh mới là tùy chọn. Trên mobile tải
 * được ảnh chụp; tệp PDF vẫn tải lên ở bản web.
 */
function LicenseFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const search = new URLSearchParams(useLocation().search);
  const replacing = useLocation().pathname.endsWith("/replace");
  const zones = useLoad(() => zoneLookup(), []);
  const [loaded, setLoaded] = useState(!id);
  const [rowVersion, setRowVersion] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState(search.get("type") ?? "");
  const [documentNumber, setDocumentNumber] = useState("");
  const [effectiveDate, setEffectiveDate] = useState<string | null>(null);
  const [expiryDate, setExpiryDate] = useState<string | null>(null);
  const [issuingAuthority, setIssuingAuthority] = useState("");
  const [holder, setHolder] = useState("");
  const [legalScope, setLegalScope] = useState("");
  const [zoneIds, setZoneIds] = useState<string[]>(search.get("zone") ? [search.get("zone")!] : []);
  const [file, setFile] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  // `error` là lỗi tải giấy tờ (thay cả form); `formError` là lỗi nhập, chọn ảnh, lưu (form vẫn còn để sửa).
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [saveTries, setSaveTries] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    getLicense(id)
      .then((l) => {
        setRowVersion(l.rowVersion);
        setDocumentType(l.documentType ?? "");
        setIssuingAuthority(l.issuingAuthority ?? "");
        setHolder(l.holder ?? "");
        setLegalScope(l.legalScope ?? "");
        setZoneIds(l.zones.map((z) => z.id));
        // Thay giấy tờ là một giấy tờ mới: số và ngày hiệu lực phải nhập lại.
        if (!replacing) {
          setDocumentNumber(l.documentNumber ?? "");
          setEffectiveDate(l.effectiveDate);
          setExpiryDate(l.expiryDate);
        }
        setLoaded(true);
      })
      .catch((err) => setError(errorText(err)));
  }, [id, replacing]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pickFile = async () => {
    try {
      const photo = await choosePhoto();
      if (photo) {
        setFile(photo);
        setPreview(URL.createObjectURL(photo));
        setFormError("");
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : errorText(err));
    }
  };

  const toggleZone = (zoneId: string, on: boolean) => setZoneIds((list) => (on ? [...list, zoneId] : list.filter((z) => z !== zoneId)));

  const save = async () => {
    if (busy || !loaded) return;
    const missing = !documentType ? "Loại giấy tờ"
      : !documentNumber.trim() ? "Số giấy tờ"
      : !effectiveDate ? "Ngày hiệu lực"
      : zoneIds.length === 0 ? "Vùng áp dụng"
      : !file && (!id || replacing) ? "Ảnh giấy tờ"
      : "";
    if (missing) {
      setFormError(MESSAGES.MSG01(missing));
      return;
    }
    const values = {
      documentType,
      documentNumber: documentNumber.trim(),
      effectiveDate,
      expiryDate,
      issuingAuthority: issuingAuthority.trim() || null,
      holder: holder.trim() || null,
      legalScope: legalScope.trim() || null,
      zoneIds,
    };
    setBusy(true);
    setFormError("");
    try {
      const saved = !id ? await createLicense(values, file)
        : replacing ? await replaceLicense(id, values, file)
        : await updateLicense(id, { ...values, rowVersion }, file);
      navigate(`/manage/licenses/${saved.id}`, { replace: true });
    } catch (err) {
      setFormError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ManagePage
      title={!id ? "Thêm giấy tờ" : replacing ? "Thay giấy tờ" : "Sửa giấy tờ"}
      footer={
        <Button
          fullWidth
          size="large"
          loading={busy}
          disabled={busy || !loaded}
          onClick={() => {
            setSaveTries((n) => n + 1);
            void save();
          }}
        >
          Lưu
        </Button>
      }
    >
      {error ? (
        <FormError text={error} />
      ) : !loaded ? (
        <div className="skeleton skeleton--form" aria-busy />
      ) : (
        <>
          <Section step={1} title="Loại và số giấy tờ">
            <div className="form">
              <Select label="Loại giấy tờ (bắt buộc)" value={documentType} onChange={(v) => setDocumentType(String(v))} closeOnSelect disabled={busy}>
                {Object.keys(DOCUMENT_TYPE).map((k) => (
                  <Select.Option key={k} value={k} title={DOCUMENT_TYPE[k]} />
                ))}
              </Select>
              <Input label="Số giấy tờ (bắt buộc)" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} maxLength={100} disabled={busy} />
            </div>
          </Section>

          <Section step={2} title="Thời hạn">
            <div className="form">
              <DateField label="Ngày hiệu lực (bắt buộc)" value={effectiveDate} onChange={setEffectiveDate} disabled={busy} />
              <DateField label="Ngày hết hạn (bỏ trống nếu không thời hạn)" value={expiryDate} onChange={setExpiryDate} disabled={busy} />
            </div>
          </Section>

          <Section step={3} title="Nơi cấp và người đứng tên">
            <div className="form">
              <Input label="Cơ quan cấp" value={issuingAuthority} onChange={(e) => setIssuingAuthority(e.target.value)} maxLength={200} disabled={busy} />
              <Input label="Người đứng tên" value={holder} onChange={(e) => setHolder(e.target.value)} maxLength={200} disabled={busy} />
              <Input.TextArea label="Phạm vi" value={legalScope} onChange={(e) => setLegalScope(e.target.value)} maxLength={1000} showCount disabled={busy} />
            </div>
          </Section>

          <Section step={4} title="Vùng áp dụng (bắt buộc)">
            <Loadable data={zones.data} error={zones.error} reload={() => void zones.reload()}>
              {(list) => (
                <fieldset className="form__group" disabled={busy}>
                  <legend className="form__legend">Chọn ít nhất một vùng</legend>
                  {list.map((z) => (
                    <Checkbox key={z.id} value={z.id} label={z.name ?? z.code ?? ""} checked={zoneIds.includes(z.id)} onChange={(e) => toggleZone(z.id, e.target.checked)} />
                  ))}
                </fieldset>
              )}
            </Loadable>
          </Section>

          <Section step={5} title={!id || replacing ? "Ảnh giấy tờ (bắt buộc)" : "Ảnh giấy tờ"}>
            <div className="form">
              {preview && <img className="record-photo" src={preview} alt="Ảnh giấy tờ đã chọn" />}
              <Button variant="secondary" size="large" fullWidth disabled={busy} onClick={() => void pickFile()}>
                {file ? "Chọn ảnh khác" : id && !replacing ? "Đổi ảnh giấy tờ" : "Chụp hoặc chọn ảnh giấy tờ"}
              </Button>
              {/* Bấm Lưu lại mà vẫn cùng một lỗi thì key đổi để FormError cuộn tới lần nữa. */}
              <FormError key={saveTries} text={formError} />
            </div>
          </Section>
        </>
      )}
    </ManagePage>
  );
}

export default LicenseFormPage;
