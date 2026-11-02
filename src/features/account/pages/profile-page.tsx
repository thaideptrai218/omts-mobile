import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button, Header, Icon, Input, Modal, Page, useSnackbar } from "zmp-ui";

import FormError from "@/shared/ui/form-error";
import { errorText, FIELD, MESSAGES } from "@/shared/lib/messages";
import { getProfile, updateProfile } from "@/features/account/api/profile";
import type { ProfileView } from "@/shared/api/account-contracts";
import { isApiError } from "@/shared/api/errors";

const SUBJECT_LABEL: Record<ProfileView["subjectType"], string> = {
  SystemAdministrator: "Quản trị hệ thống",
  CooperativeOwner: "Chủ HTX",
  Staff: "Nhân viên",
  Trader: "Thương lái",
};

const MAX_DISPLAY_NAME = 200;

/**
 * ACS-05 hồ sơ cá nhân: tên hiển thị sửa trực tiếp (kèm rowVersion để phát hiện người khác vừa sửa,
 * MSG06). Email và số điện thoại chỉ xem: số điện thoại là số Zalo đã liên kết, mobile không có luồng
 * đổi liên hệ bằng mật khẩu hay mã xác minh. Tên đăng nhập, loại tài khoản, vai trò và vùng chỉ đọc (MSG20).
 */
function ProfilePage() {
  const { openSnackbar } = useSnackbar();
  const [profile, setProfile] = useState<ProfileView | null>(null);
  const [loadError, setLoadError] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState("");

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
      openSnackbar({ text: MESSAGES.MSG10("hồ sơ cá nhân"), type: "success", duration: 4000 });
    } catch (err) {
      if (isApiError(err, "MSG06")) setConflict(errorText(err));
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

            <ContactRow label="Số điện thoại Zalo đã liên kết" value={profile.phoneNumber} />
            <ContactRow label="Email" value={profile.email} />
            <p className="form__hint">Muốn đổi số điện thoại hoặc email, liên hệ HTX.</p>

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
            text: "Tải lại",
            highLight: true,
            onClick: () => {
              setConflict("");
              void load();
            },
          },
          { text: "Hủy", close: true },
        ]}
      />
    </Page>
  );
}

function ContactRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="contact-row">
      <div className="contact-row__text">
        <span className="contact-row__label">{label}</span>
        <span className="contact-row__value">{value ?? "Chưa có"}</span>
      </div>
    </div>
  );
}

export default ProfilePage;
