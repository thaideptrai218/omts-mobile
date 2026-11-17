import type { NotificationPreferences, NotificationPushChange } from "@/features/notifications/models/NotificationPreferences";
import { useCallback, useEffect, useState } from "react";
import { Button, Modal, Switch, useSnackbar } from "zmp-ui";

import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Section } from "@/components/Section/Section";
import { MESSAGES } from "@/constants/messages";
import { errorText } from "@/utils/errorText";
import { getNotificationPreferences, saveNotificationPreferences } from "@/features/notifications/services/notificationsService";
import { openPushSettings, pushAvailable, requestPushPermission } from "@/features/notifications/services/pushService";
import { KINDS } from "@/features/notifications/utils/notificationKinds";

/**
 * ACS-07 tùy chọn thông báo: mọi thông báo luôn có trong app; với từng loại, người dùng chọn có đẩy về điện thoại hay không.
 * Loại bắt buộc luôn đẩy (MSG23). Kênh đẩy theo quyết định ở OMTS-215: chưa chốt thì hiện "chưa khả dụng"; khi chốt, bật lần
 * đầu sẽ xin quyền và đăng ký thiết bị, bị từ chối thì MSG22.
 */
function NotificationPreferencesPage() {
  const { openSnackbar } = useSnackbar();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loadError, setLoadError] = useState("");
  const [values, setValues] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [askPush, setAskPush] = useState(false);
  const [pushDenied, setPushDenied] = useState(false);
  const [notice, setNotice] = useState("");

  const apply = useCallback((next: NotificationPreferences) => {
    setPrefs(next);
    setValues(Object.fromEntries(next.types.map((t) => [t.type, t.push])));
  }, []);

  const load = useCallback(async () => {
    setLoadError("");
    try {
      apply(await getNotificationPreferences());
    } catch (err) {
      setLoadError(errorText(err));
    }
  }, [apply]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = (type: string, push: boolean) => {
    // Bật lần đầu mà chưa máy nào cho phép nhận thông báo: giải thích rồi mới xin quyền (CLAUDE.md mục 5).
    if (push && prefs && !prefs.pushAllowedOnDevice && pushAvailable()) {
      setAskPush(true);
      return;
    }
    setValues((v) => ({ ...v, [type]: push }));
  };

  const save = async () => {
    if (!prefs) return;
    const items: NotificationPushChange[] = prefs.types
      .filter((t) => !t.mandatory && (values[t.type] ?? t.push) !== t.push)
      .map((t) => ({ type: t.type, push: values[t.type] ?? t.push }));
    if (items.length === 0) {
      openSnackbar({ text: "Không có thay đổi nào.", type: "info", duration: 3000 });
      return;
    }
    setSaving(true);
    setError("");
    try {
      const saved = await saveNotificationPreferences(items);
      apply(saved);
      openSnackbar({ text: MESSAGES.MSG10("tùy chọn thông báo"), type: "success", duration: 4000 });
      if (saved.notice) setNotice(MESSAGES.MSG22);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  const grantPush = async () => {
    setAskPush(false);
    try {
      const result = await requestPushPermission();
      if (result === "denied") setPushDenied(true);
      await load();
    } catch (err) {
      setError(errorText(err));
    }
  };

  const available = pushAvailable();

  return (
    <ManagePage
      title="Tùy chọn thông báo"
      footer={
        prefs && available ? (
          <Button fullWidth size="large" loading={saving} disabled={saving} onClick={() => void save()}>
            Lưu tùy chọn
          </Button>
        ) : undefined
      }
    >
      <Loadable data={prefs} error={loadError} reload={() => void load()}>
        {(p) => (
          <Section title="Báo về điện thoại">
            <p className="form__intro">
              Mọi thông báo đều có trong mục Thông báo của app. Bật thêm ở đây để điện thoại báo ngay cả khi không mở app.
            </p>
            {!available && <p className="pref__note">Chưa dùng được: hệ thống đang hoàn thiện cách gửi thông báo về điện thoại.</p>}
            <ul className="pref__rows card pref">
              {p.types.map((t) => {
                const label = KINDS[t.type]?.title ?? t.name;
                const checked = t.mandatory ? true : (values[t.type] ?? t.push);
                return (
                  <li key={t.type} className="pref__row">
                    <div className="pref__text">
                      <span className="pref__label">{label}</span>
                      {t.mandatory && <span className="pref__reason">{MESSAGES.MSG23}</span>}
                    </div>
                    <Switch checked={checked} disabled={t.mandatory || !available} aria-label={`${label}: báo về điện thoại`} onChange={(e) => toggle(t.type, e.target.checked)} />
                  </li>
                );
              })}
            </ul>
            {error && (
              <div className="block">
                <FormError text={error} />
              </div>
            )}
          </Section>
        )}
      </Loadable>

      <Modal
        visible={askPush}
        title="Nhận thông báo trên điện thoại"
        description="OMTS sẽ gửi cảnh báo nước, đơn hàng mới và việc được giao tới Zalo của bạn ngay cả khi không mở app. Zalo sẽ hỏi bạn có cho phép không; bạn có thể từ chối và vẫn xem thông báo trong app."
        onClose={() => setAskPush(false)}
        actions={[
          { text: "Để sau", close: true },
          { text: "Cho phép", highLight: true, onClick: () => void grantPush() },
        ]}
      />
      <Modal
        visible={pushDenied || !!notice}
        title="Thông báo trên điện thoại chưa bật"
        description={notice || MESSAGES.MSG22}
        onClose={() => {
          setPushDenied(false);
          setNotice("");
        }}
        verticalActions
        actions={[
          ...(available ? [{ text: "Mở cài đặt thông báo", highLight: true, onClick: () => void openPushSettings() }] : []),
          { text: "Đã hiểu", close: true },
        ]}
      />
    </ManagePage>
  );
}

export default NotificationPreferencesPage;
