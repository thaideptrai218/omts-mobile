import type { QualityClaimDraft } from "@/features/claims/models/QualityClaim";
import { useCallback, useEffect, useState } from "react";
import { Button, Input, useLocation, useNavigate, useSnackbar } from "zmp-ui";

import { Badge } from "@/components/Badge/Badge";
import { Facts } from "@/components/Facts/Facts";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import PagedList from "@/components/PagedList/PagedList";
import { Row } from "@/components/Row/Row";
import { useLoad } from "@/hooks/useLoad";
import { usePaged } from "@/hooks/usePaged";
import { choosePhoto } from "@/services/zaloService";
import { errorText } from "@/utils/errorText";
import { date, money, num } from "@/utils/format";
import { ClaimsGate } from "@/features/claims/components/ClaimsGate/ClaimsGate";
import { CLAIM_LIMITS, claimDraftError, preparePhoto, submitClaim } from "@/features/claims/services/claimService";
import { myInvoice, myInvoices } from "@/features/sales/services/invoiceService";
import "@/features/claims/styles/claims.scss";

/**
 * CLAIM-01: thương lái gửi khiếu nại chất lượng về một hóa đơn của mình (`/account/claims/new?invoice=<id>`), mô tả và 1 đến 10
 * ảnh (BR-CLAIM-01). Không có `invoice` thì chọn hóa đơn trước. Chủ HTX nhận thông báo MSG-CLAIM-01.
 */
export default function ClaimFormPage() {
  return (
    <ClaimsGate mode="trader">
      <ClaimForm />
    </ClaimsGate>
  );
}

function ClaimForm() {
  const fromQuery = new URLSearchParams(useLocation().search).get("invoice");
  const [invoiceId, setInvoiceId] = useState(fromQuery);
  if (!invoiceId) return <InvoicePicker onPick={setInvoiceId} />;
  // Mở từ hóa đơn thì "Quay lại" về hóa đơn; chọn ở màn này thì quay về danh sách hóa đơn để chọn lại.
  return <ClaimEditor key={invoiceId} invoiceId={invoiceId} onBack={fromQuery ? undefined : () => setInvoiceId(null)} />;
}

/** Chọn hóa đơn cần khiếu nại; hóa đơn đã hủy không chọn được. */
function InvoicePicker({ onPick }: { onPick: (id: string) => void }) {
  const fetchPage = useCallback((page: number) => myInvoices(page).then((r) => r.page), []);
  const list = usePaged(fetchPage);

  return (
    <ManagePage title="Gửi khiếu nại">
      <p className="form__intro claim-intro">Chọn hóa đơn có hàng bị lỗi. Mỗi lần gửi khiếu nại cho một hóa đơn.</p>
      <PagedList list={list} unit="hóa đơn" emptyIcon="zi-file" emptyTitle="Chưa có hóa đơn" emptyText="Khiếu nại gửi theo hóa đơn HTX đã lập cho bạn.">
        {(row) => {
          const cancelled = row.isPaid === null;
          return (
            <Row
              key={row.id}
              title={`${row.code} · ${money(row.total)}`}
              meta={`${date(row.invoiceDate)} · ${num(row.totalKg, "kg")}`}
              badge={cancelled ? <Badge text="Đã hủy, không khiếu nại được" tone="neutral" /> : undefined}
              onClick={cancelled ? undefined : () => onPick(row.id)}
            />
          );
        }}
      </PagedList>
    </ManagePage>
  );
}

function ClaimEditor({ invoiceId, onBack }: { invoiceId: string; onBack?: () => void }) {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const invoice = useLoad(() => myInvoice(invoiceId), [invoiceId]);
  const [draft, setDraft] = useState<QualityClaimDraft>({ description: "", photos: [] });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Không khóa nút trong lúc chọn ảnh: người dùng đóng bộ chọn ảnh thì SDK không báo, nút sẽ bị khóa mãi.
  const addPhoto = async () => {
    let photo: Blob | null;
    try {
      photo = await choosePhoto();
    } catch {
      setError("Chưa lấy được ảnh. Vui lòng thử lại.");
      return;
    }
    if (!photo) return;
    try {
      const ready = await preparePhoto(photo);
      setDraft((d) => ({ ...d, photos: [...d.photos, ready] }));
      setError("");
    } catch {
      setError("Không đọc được ảnh này. Hãy chụp lại hoặc chọn ảnh khác.");
    }
  };

  const send = async () => {
    const problem = claimDraftError(draft);
    setError(problem);
    if (problem || busy) return;
    setBusy(true);
    try {
      const saved = await submitClaim(invoiceId, draft);
      openSnackbar({ text: "Đã gửi khiếu nại. HTX sẽ kiểm tra và trả lời bạn.", type: "success", duration: 4000 });
      navigate(`/account/claims/${saved.claim.id}`, { replace: true });
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  };

  const loaded = invoice.data;
  const cancelled = loaded?.isPaid === null;

  return (
    <ManagePage
      title="Gửi khiếu nại"
      onBack={onBack}
      footer={
        loaded && !cancelled ? (
          <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void send()}>
            Gửi khiếu nại
          </Button>
        ) : undefined
      }
    >
      <Loadable data={loaded} error={invoice.error} reload={() => void invoice.reload()}>
        {(inv) => (
          <>
            <Facts
              items={[
                ["Hóa đơn", inv.code],
                ["Ngày", date(inv.invoiceDate)],
                ["Tổng khối lượng", num(inv.totalKg, "kg")],
                ["Tổng tiền", money(inv.total)],
              ]}
            />
            {cancelled ? (
              <p className="card form__intro">Hóa đơn này đã hủy nên không gửi khiếu nại được.</p>
            ) : (
              <div className="card form">
                <Input.TextArea
                  label="1. Hàng bị lỗi thế nào? (bắt buộc)"
                  placeholder="Ví dụ: khoảng 50 kg hàu chết khi về tới kho"
                  value={draft.description}
                  maxLength={CLAIM_LIMITS.description}
                  showCount
                  disabled={busy}
                  onChange={(e) => {
                    const description = e.target.value;
                    setDraft((d) => ({ ...d, description }));
                    setError("");
                  }}
                />
                <p className="form__intro">
                  2. Ảnh hàng bị lỗi (bắt buộc, từ 1 đến {CLAIM_LIMITS.photos} ảnh). Đã có {num(draft.photos.length, "ảnh")}. Chỉ bạn và HTX xem được
                  các ảnh này.
                </p>
                <div className="claim-photos">
                  {draft.photos.map((photo, i) => (
                    <NewPhotoTile
                      key={`photo-${i}`}
                      photo={photo}
                      index={i}
                      disabled={busy}
                      onRemove={() => setDraft((d) => ({ ...d, photos: d.photos.filter((_, j) => j !== i) }))}
                    />
                  ))}
                </div>
                {draft.photos.length < CLAIM_LIMITS.photos && (
                  <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => void addPhoto()}>
                    Chụp hoặc chọn ảnh
                  </Button>
                )}
                <FormError text={error} />
              </div>
            )}
          </>
        )}
      </Loadable>
    </ManagePage>
  );
}

/** Ảnh vừa chụp: tạo link tạm để xem trước, xóa link khi bỏ ảnh hoặc rời màn. */
function NewPhotoTile({ photo, index, disabled, onRemove }: { photo: Blob; index: number; disabled: boolean; onRemove: () => void }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    const url = URL.createObjectURL(photo);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  if (!src) return null;
  return (
    <div className="claim-photo-tile">
      <img className="claim-photo" src={src} alt={`Ảnh ${index + 1} sẽ gửi`} />
      <Button variant="tertiary" type="danger" disabled={disabled} onClick={onRemove}>
        Bỏ ảnh
      </Button>
    </div>
  );
}
