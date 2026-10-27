import { useSetAtom } from "jotai";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button, Header, Icon, Input, Modal, Page, Sheet, useNavigate, useSnackbar } from "zmp-ui";

import FormError from "@/components/form-error";
import PasswordField from "@/components/password-field";
import { maskContact } from "@/services/acs/masking";
import { errorText, FIELD, MESSAGES } from "@/services/acs/messages";
import { confirmContactChange, getProfile, startContactChange, updateProfile } from "@/services/acs/profile";
import type { ProfileView, VerificationChannel } from "@/services/acs/types";
import { normalizeContact } from "@/services/acs/validation";
import { resendCode } from "@/services/acs/verification";
import { isApiError } from "@/services/api/errors";
import { flashMessageAtom } from "@/state/session";
import { pendingVerificationAtom, type PendingVerification } from "@/state/verification";

const SUBJECT_LABEL: Record<ProfileView["subjectType"], string> = {
  SystemAdministrator: "Quản trị hệ thống",
  CooperativeOwner: "Chủ HTX",
  Staff: "Nhân viên",
  Trader: "Thương lái",
};

const MAX_DISPLAY_NAME = 200;

/**
 * ACS-05 hồ sơ cá nhân: tên hiển thị sửa trực tiếp (kèm rowVersion để phát hiện người khác vừa sửa,
 * MSG06); email và số điện thoại đổi qua mã xác minh gửi tới liên hệ mới (MSG62), liên hệ cũ vẫn dùng
 * tới khi xác minh xong. Tên đăng nhập, loại tài khoản, vai trò và vùng chỉ đọc (MSG20).
 */
function ProfilePage() {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const setPending = useSetAtom(pendingVerificationAtom);
  const setFlash = useSetAtom(flashMessageAtom);
  const [profile, setProfile] = useState<ProfileView | null>(null);
  const [loadError, setLoadError] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState("");
  const [contactSheet, setContactSheet] = useState<VerificationChannel | null>(null);

  const load = useCallback(async () => {
    setLoadError("");
    try {
      const p = await getProfile();
      setProfile(p);
      setDisplayName(p.displayName);
    } catch (err) {
      setLoadError(errorText(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const name = displayName.trim();
    if (!name || name.length > MAX_DISPLAY_NAME) {
      setError(MESSAGES.MSG01(FIELD.displayName));
      return;
    }
    if (name === profile.displayName) {
      setError(MESSAGES.MSG01(FIELD.displayName));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const saved = await updateProfile(name, profile.rowVersion);
      setProfile(saved.profile);
      setDisplayName(saved.profile.displayName);
      openSnackbar({ text: saved.message || MESSAGES.MSG10("Personal profile"), type: "success", duration: 4000 });
    } catch (err) {
      if (isApiError(err, "MSG06")) setConflict(err.message);
      else setError(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  const isStaff = profile?.subjectType === "Staff";

  return (
    <Page className="screen screen--detail" hideScrollbar>
      <Header title="Hồ sơ cá nhân" className="detail-header" />
      <div className="screen__body">
        {!profile && !loadError && <div className="skeleton skeleton--form" aria-busy />}
        {loadError && (
          <div className="empty">
            <p className="empty__title">Không tải được hồ sơ</p>
            <p className="empty__text">{loadError}</p>
            <Button size="large" onClick={() => void load()}>
              Thử lại
            </Button>
          </div>
        )}

        {profile && (
          <form className="form" onSubmit={save} noValidate>
            <section className="card readonly">
              <dl className="info info--flat">
                <div>
                  <dt>Tên đăng nhập</dt>
                  <dd>
                    <button type="button" className="readonly__value" onClick={() => openSnackbar({ text: MESSAGES.MSG20, type: "info", duration: 6000 })}>
                      {profile.username}
                      <Icon icon="zi-lock" />
                    </button>
                  </dd>
                </div>
                <div>
                  <dt>Loại tài khoản</dt>
                  <dd>{SUBJECT_LABEL[profile.subjectType]}</dd>
                </div>
                {isStaff && (
                  <div>
                    <dt>Vai trò và vùng nuôi</dt>
                    <dd>
                      {profile.grants.length === 0 ? (
                        "Chưa được cấp quyền"
                      ) : (
                        <ul className="plain-list">
                          {profile.grants.map((g, i) => (
                            <li key={i}>
                              {g.role}, {g.allZones ? "toàn HTX" : (g.zoneName ?? "một vùng")}
                            </li>
                          ))}
                        </ul>
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            </section>

            <Input
              label="Tên hiển thị"
              size="large"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={MAX_DISPLAY_NAME}
              autoComplete="name"
              disabled={saving}
            />

            <ContactRow
              label="Email"
              value={profile.email}
              verified={profile.emailVerified}
              action={profile.email && profile.emailVerified ? "Đổi email" : profile.email ? "Gửi mã xác minh" : "Thêm email"}
              onAction={() => setContactSheet("Email")}
            />
            <ContactRow
              label="Số điện thoại"
              value={profile.phoneNumber}
              verified={profile.phoneVerified}
              action={profile.phoneNumber ? "Đổi số điện thoại" : "Thêm số điện thoại"}
              onAction={() => setContactSheet("Sms")}
            />

            <FormError text={error} />
            <Button htmlType="submit" fullWidth size="large" loading={saving} disabled={saving}>
              Lưu thay đổi
            </Button>
          </form>
        )}
      </div>

      <Modal
        visible={!!conflict}
        title="Dữ liệu vừa được cập nhật"
        description={conflict}
        onClose={() => setConflict("")}
        verticalActions
        actions={[
          {
            text: "Reload",
            highLight: true,
            onClick: () => {
              setConflict("");
              void load();
            },
          },
          { text: "Cancel", close: true },
        ]}
      />

      {profile && (
        <ContactChangeSheet
          channel={contactSheet}
          profile={profile}
          onClose={() => setContactSheet(null)}
          onStarted={(pending) => {
            setPending(pending);
            setContactSheet(null);
            navigate("/verify");
          }}
          onConfirmedNotice={(text, warning) => setFlash({ text, type: warning ? "warning" : "success", duration: warning ? 8000 : 4000 })}
        />
      )}
    </Page>
  );
}

function ContactRow({ label, value, verified, action, onAction }: { label: string; value: string | null; verified: boolean; action: string; onAction: () => void }) {
  return (
    <div className="contact-row">
      <div className="contact-row__text">
        <span className="contact-row__label">{label}</span>
        <span className="contact-row__value">{value ?? "Chưa có"}</span>
        {value && (
          <span className={`badge ${verified ? "badge--success" : "badge--warning"}`}>{verified ? "Verified" : "Not verified"}</span>
        )}
      </div>
      <Button size="medium" variant="secondary" onClick={onAction}>
        {action}
      </Button>
    </div>
  );
}

/**
 * Nhập liên hệ mới và mật khẩu hiện tại (backend yêu cầu, để phiên bị đánh cắp không chiếm được tài khoản),
 * gửi mã tới liên hệ mới rồi chuyển sang màn xác minh. Khi mã đúng, xác nhận và quay lại hồ sơ.
 */
function ContactChangeSheet({
  channel,
  profile,
  onClose,
  onStarted,
  onConfirmedNotice,
}: {
  channel: VerificationChannel | null;
  profile: ProfileView;
  onClose: () => void;
  onStarted: (pending: PendingVerification) => void;
  onConfirmedNotice: (text: string, warning: boolean) => void;
}) {
  const [value, setValue] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isSms = channel === "Sms";

  useEffect(() => {
    if (!channel) return;
    // Email chưa xác minh (Chủ HTX nhập sẵn) có thể xác minh ngay, nên điền sẵn.
    setValue(channel === "Email" && profile.email && !profile.emailVerified ? profile.email : "");
    setCurrentPassword("");
    setError("");
  }, [channel, profile.email, profile.emailVerified]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!channel) return;
    const target = normalizeContact(channel, value);
    if (!target) {
      setError(MESSAGES.MSG01(isSms ? FIELD.phone : FIELD.email));
      return;
    }
    if (!currentPassword) {
      setError(MESSAGES.MSG01(FIELD.currentPassword));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const started = await startContactChange(channel, target, currentPassword);
      const purpose = isSms ? "ChangePhone" : profile.emailVerified ? "ChangeEmail" : "VerifyEmail";
      onStarted({
        purpose,
        channel,
        maskedTarget: maskContact(channel, target),
        verificationId: started.verification.verificationId,
        sentAt: Date.now(),
        sendsLeft: started.verification.sendsLeft,
        notice: started.message,
        resend: () => resendCode(started.verification.verificationId, true),
        onVerified: async (token, go) => {
          const confirmed = await confirmContactChange(token);
          onConfirmedNotice(confirmed.notice ?? MESSAGES.MSG10("Personal profile"), confirmed.oldDocumentsHidden);
          go("/account/profile", { replace: true });
        },
      });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={!!channel} onClose={onClose} autoHeight mask handler swipeToClose title={isSms ? "Số điện thoại mới" : "Email mới"}>
      <form className="sheet-form form" onSubmit={submit} noValidate>
        <Input
          label={isSms ? "Số điện thoại mới" : "Email mới"}
          size="large"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          inputMode={isSms ? "tel" : "email"}
          autoCapitalize="none"
          disabled={busy}
        />
        <PasswordField label="Mật khẩu hiện tại" value={currentPassword} onChange={setCurrentPassword} disabled={busy} />
        <p className="form__hint">{isSms ? "Mã SMS sẽ được gửi đến số mới." : "Mã xác minh sẽ được gửi đến email mới."} Liên hệ cũ vẫn dùng cho tới khi xác minh xong.</p>
        <FormError text={error} />
        <Button htmlType="submit" fullWidth size="large" loading={busy} disabled={busy}>
          {isSms ? "Gửi mã SMS" : "Gửi mã xác minh"}
        </Button>
      </form>
    </Sheet>
  );
}

export default ProfilePage;
