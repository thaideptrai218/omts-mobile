import type { TraderRequestView } from "@/features/organization/models/TraderRequest";
import { useCallback, useEffect, useState } from "react";
import { Button, useSnackbar } from "zmp-ui";

import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Empty } from "@/components/Empty/Empty";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { ReasonSheet } from "@/components/ReasonSheet/ReasonSheet";
import { errorText } from "@/utils/errorText";
import { FIELD, MESSAGES } from "@/constants/messages";
import { approveTraderRequest, listTraderRequests, rejectTraderRequest } from "@/features/organization/services/traderRequestsService";

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
  const [rejectRound, setRejectRound] = useState(0);
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

  const reject = async (text: string) => {
    if (!rejecting) return false;
    if (!text || text.length > MAX_REASON) {
      setError(MESSAGES.MSG01(FIELD.reason));
      return false;
    }
    setBusy(true);
    setError("");
    try {
      await rejectTraderRequest(rejecting.accountId, text);
      done(rejecting.accountId, `Đã từ chối yêu cầu của ${rejecting.displayName}.`);
      return true;
    } catch (err) {
      setError(errorText(err));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const startReject = (request: TraderRequestView) => {
    setError("");
    setRejectRound((round) => round + 1);
    setRejecting(request);
  };

  return (
    <ManagePage title="Duyệt thương lái">
      <Loadable data={requests} error={loadError} reload={() => void load()}>
        {(list) =>
          list.length === 0 ? (
            <Empty icon="zi-check-circle" title="Không có yêu cầu nào đang chờ" text="Khi thương lái gửi yêu cầu từ Zalo, bạn sẽ nhận thông báo." />
          ) : (
            <ul className="request-list">
              {list.map((r) => (
                <li key={r.accountId} className="card request">
                  <p className="request__name">{r.displayName}</p>
                  <p className="request__meta">
                    {r.phoneNumber} · {requestedAt(r.requestedAt)}
                  </p>
                  {r.note && <p className="request__note">“{r.note}”</p>}
                  <div className="request__actions">
                    <Button fullWidth size="large" onClick={() => setApproving(r)}>
                      Duyệt
                    </Button>
                    <Button fullWidth size="large" variant="secondary" type="danger" onClick={() => startReject(r)}>
                      Từ chối
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )
        }
      </Loadable>

      <ConfirmSheet
        visible={approving !== null}
        title="Duyệt tài khoản thương lái"
        message={approving ? `${approving.displayName} (${approving.phoneNumber}) sẽ dùng được các chức năng của thương lái ngay.` : ""}
        confirmText="Duyệt"
        busy={busy}
        onClose={() => setApproving(null)}
        onConfirm={() => void approve()}
      />

      {/* Mỗi lần mở là một sheet mới, để lý do đã gõ cho người trước không sang người sau. */}
      <ReasonSheet
        key={rejectRound}
        visible={rejecting !== null}
        title="Từ chối yêu cầu"
        intro="Thương lái sẽ thấy lý do này khi mở app."
        confirmText="Từ chối"
        required
        danger
        maxLength={MAX_REASON}
        busy={busy}
        onClose={() => setRejecting(null)}
        onConfirm={reject}
      >
        <FormError text={error} />
      </ReasonSheet>
    </ManagePage>
  );
}

export default TraderRequestsPage;
