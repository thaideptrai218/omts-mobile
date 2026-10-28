import { useCallback, useEffect, useState } from "react";
import { Button, Header, Icon, Input, Modal, Page, Sheet, useSnackbar } from "zmp-ui";

import FormError from "@/components/form-error";
import { errorText, MESSAGES } from "@/services/acs/messages";
import { approveTraderRequest, listTraderRequests, rejectTraderRequest } from "@/services/acs/trader-requests";
import type { TraderRequestView } from "@/services/acs/types";

const MAX_REASON = 1000;

function requestedAt(value: string | null) {
  return value ? new Date(value).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";
}

/**
 * Chủ HTX duyệt yêu cầu tài khoản thương lái gửi từ Mini App (cùng API với bản web). Duyệt thì tài khoản dùng
 * được ngay và thương lái nhận thông báo; từ chối phải ghi lý do, thương lái thấy lý do khi mở app.
 */
function TraderRequestsPage() {
  const { openSnackbar } = useSnackbar();
  const [requests, setRequests] = useState<TraderRequestView[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [approving, setApproving] = useState<TraderRequestView | null>(null);
  const [rejecting, setRejecting] = useState<TraderRequestView | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoadError("");
    try {
      setRequests(await listTraderRequests());
    } catch (err) {
      setLoadError(errorText(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const done = (accountId: string, text: string) => {
    setRequests((current) => current?.filter((r) => r.accountId !== accountId) ?? null);
    openSnackbar({ text, type: "success", duration: 4000 });
  };

  const approve = async () => {
    if (!approving) return;
    setBusy(true);
    try {
      await approveTraderRequest(approving.accountId);
      done(approving.accountId, `Đã duyệt tài khoản thương lái của ${approving.displayName}.`);
      setApproving(null);
    } catch (err) {
      openSnackbar({ text: errorText(err), type: "error", duration: 6000 });
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    if (!rejecting) return;
    const text = reason.trim();
    if (!text || text.length > MAX_REASON) {
      setError(MESSAGES.MSG01("Reason"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await rejectTraderRequest(rejecting.accountId, text);
      done(rejecting.accountId, `Đã từ chối yêu cầu của ${rejecting.displayName}.`);
      setRejecting(null);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page className="screen screen--detail" hideScrollbar>
      <Header title="Duyệt thương lái" className="detail-header" />
      <div className="screen__body">
        {!requests && !loadError && <div className="skeleton skeleton--form" aria-busy />}
        {loadError && (
          <div className="empty">
            <p className="empty__title">Không tải được danh sách</p>
            <p className="empty__text">{loadError}</p>
            <Button size="large" onClick={() => void load()}>
              Thử lại
            </Button>
          </div>
        )}
        {requests?.length === 0 && (
          <div className="empty">
            <span className="empty__badge">
              <Icon icon="zi-check-circle" size={32} />
            </span>
            <p className="empty__title">Không có yêu cầu nào đang chờ</p>
            <p className="empty__text">Khi thương lái gửi yêu cầu từ Zalo, bạn sẽ nhận thông báo.</p>
          </div>
        )}
        {requests && requests.length > 0 && (
          <ul className="request-list">
            {requests.map((r) => (
              <li key={r.accountId} className="card request">
                <p className="request__name">{r.displayName}</p>
                <p className="request__meta">
                  {r.phoneNumber} · {requestedAt(r.requestedAt)}
                </p>
                {r.note && <p className="request__note">“{r.note}”</p>}
                <div className="request__actions">
                  <Button size="large" variant="secondary" onClick={() => { setReason(""); setError(""); setRejecting(r); }}>
                    Từ chối
                  </Button>
                  <Button size="large" onClick={() => setApproving(r)}>
                    Duyệt
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        visible={approving !== null}
        title="Duyệt tài khoản thương lái"
        description={approving ? `${approving.displayName} (${approving.phoneNumber}) sẽ dùng được các chức năng của thương lái ngay.` : ""}
        onClose={() => setApproving(null)}
        actions={[
          { text: "Để sau", close: true },
          { text: "Duyệt", highLight: true, disabled: busy, onClick: () => void approve() },
        ]}
      />

      <Sheet visible={rejecting !== null} onClose={() => setRejecting(null)} autoHeight mask handler swipeToClose title="Từ chối yêu cầu">
        <div className="sheet-form form">
          <p className="form__intro">Thương lái sẽ thấy lý do này khi mở app.</p>
          <Input.TextArea label="Lý do" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={MAX_REASON} showCount disabled={busy} />
          <FormError text={error} />
          <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void reject()}>
            Từ chối
          </Button>
        </div>
      </Sheet>
    </Page>
  );
}

export default TraderRequestsPage;
