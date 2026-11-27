import { useEffect, useState } from "react";
import { Button, Input, Select, useLocation, useNavigate, useParams } from "zmp-ui";

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
  const [zoneId, setZoneId] = useState<string>(search.get("zone") ?? "");
  const [file, setFile] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  // `error` là lỗi tải giấy tờ (thay cả form); `formError` là lỗi nhập, chọn ảnh, lưu (form vẫn còn để sửa).
  const [error, setError] = useState("");
  // Tăng lên khi bấm "Thử lại" để tải lại giấy tờ.
  const [attempt, setAttempt] = useState(0);
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
        setZoneId(l.zones[0]?.id ?? "");
        // Thay giấy tờ là một giấy tờ mới: số và ngày hiệu lực phải nhập lại.
        if (!replacing) {
          setDocumentNumber(l.documentNumber ?? "");
          setEffectiveDate(l.effectiveDate);
          setExpiryDate(l.expiryDate);
        }
        setLoaded(true);
      })
      .catch((err) => setError(errorText(err)));
  }, [id, replacing, attempt]);

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


  const save = async () => {
    if (busy || !loaded) return;
    const missing = !documentType ? "Loại giấy tờ"
      : !documentNumber.trim() ? "Số giấy tờ"
      : !effectiveDate ? "Ngày hiệu lực"
      : !expiryDate || expiryDate <= effectiveDate ? "Ngày hết hạn"
      : !zoneId ? "Vùng áp dụng"
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
      zoneId,
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
      {/* Chưa tải xong giấy tờ thì chưa hiện form: đang tải là khung chờ, lỗi thì có nút Thử lại. */}
      {!loaded ? (
        <Loadable data={null} error={error} reload={() => { setError(""); setAttempt((n) => n + 1); }}>{() => null}</Loadable>
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
              <DateField label="Ngày hết hạn (bắt buộc, sau ngày hiệu lực)" value={expiryDate} onChange={setExpiryDate} disabled={busy} />
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
                <div className="form">
                  {/* Sửa hoặc thay giấy tờ thì giữ vùng cũ: backend không cho chuyển giấy tờ sang vùng khác. */}
                  <Select label="Vùng nuôi" placeholder="Chọn vùng" value={zoneId || undefined} onChange={(v) => setZoneId(String(v))} closeOnSelect disabled={busy || Boolean(id)}>
                    {list.map((z) => (
                      <Select.Option key={z.id} value={z.id} title={z.name ?? z.code ?? ""} />
                    ))}
                  </Select>
                  {id && <p className="form__hint">Giấy tờ gắn với một vùng và không chuyển sang vùng khác được.</p>}
                </div>
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
