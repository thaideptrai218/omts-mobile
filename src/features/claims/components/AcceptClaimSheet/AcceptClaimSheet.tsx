import type { QualityClaimOffer } from "@/features/claims/models/QualityClaim";
import { useEffect, useState } from "react";
import { Button, Icon, Input, Sheet } from "zmp-ui";

import FormError from "@/components/FormError/FormError";
import { CLAIM_LIMITS } from "@/features/claims/services/claimService";
import { OFFER_TEXT } from "@/features/claims/utils/claimText";

const OFFERS = Object.keys(OFFER_TEXT) as QualityClaimOffer[];

/**
 * CLAIM-02.0: Chủ HTX chọn một cách xử lý đề xuất (bắt buộc, không chọn sẵn) và lời nhắn không bắt buộc, ví dụ mức giảm giá.
 * `onConfirm` trả true khi lưu xong để đóng sheet.
 */
export function AcceptClaimSheet({
  visible,
  busy,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  busy: boolean;
  onClose: () => void;
  onConfirm: (offer: QualityClaimOffer, note: string) => Promise<boolean>;
}) {
  const [offer, setOffer] = useState<QualityClaimOffer | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  // Đóng là xóa lựa chọn, để lần mở sau không mang lựa chọn cũ.
  useEffect(() => {
    if (visible) return;
    setOffer(null);
    setNote("");
    setError("");
  }, [visible]);

  const submit = async () => {
    if (!offer) {
      setError("Chọn cách xử lý đề xuất cho thương lái.");
      return;
    }
    setError("");
    if (await onConfirm(offer, note.trim())) onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} autoHeight mask handler swipeToClose={!busy} maskClosable={!busy} title="Chấp nhận khiếu nại?">
      <div className="sheet-form form">
        <p className="form__intro">
          Chỉ ghi lại cách xử lý HTX đề xuất; hóa đơn và công nợ chưa thay đổi. Khi thương lái đồng ý, HTX lập phiếu trả hàng hoặc giảm giá
          hóa đơn. Phản hồi đã gửi thì không sửa được.
        </p>
        <div className="claim-offers" role="radiogroup" aria-label="Cách xử lý đề xuất (bắt buộc)">
          <p className="claim-offers__label">Cách xử lý đề xuất (bắt buộc)</p>
          {OFFERS.map((key) => {
            const active = offer === key;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={active}
                className={`claim-offer${active ? " is-active" : ""}`}
                disabled={busy}
                onClick={() => {
                  setOffer(key);
                  setError("");
                }}
              >
                <Icon icon={active ? "zi-radio-checked" : "zi-radio-unchecked"} />
                <span>{OFFER_TEXT[key]}</span>
              </button>
            );
          })}
        </div>
        <Input.TextArea
          label="Lời nhắn cho thương lái (không bắt buộc)"
          placeholder="Ví dụ: mức giảm giá HTX đề xuất"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={CLAIM_LIMITS.note}
          showCount
          disabled={busy}
        />
        <FormError text={error} />
        <div className="sheet-actions">
          <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void submit()}>
            Chấp nhận khiếu nại
          </Button>
          <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={onClose}>
            Không, quay lại
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
