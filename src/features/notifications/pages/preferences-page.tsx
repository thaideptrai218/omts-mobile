import { useCallback, useEffect, useState } from "react";
import { Button, Header, Modal, Page, Switch, useSnackbar } from "zmp-ui";

import FormError from "@/shared/ui/form-error";
import { errorText, MESSAGES } from "@/shared/lib/messages";
import { getNotificationPreferences, saveNotificationPreferences } from "@/features/notifications/api/notifications";
import { openPushSettings, pushAvailable, requestPushPermission } from "@/features/notifications/api/push";
import type { CategoryPreferenceView, NotificationChannel, NotificationPreferenceChange } from "@/shared/api/account-contracts";

const CATEGORY_LABEL: Record<string, string> = {
  ORDERS: "Đơn hàng mới",
  WORK: "Công việc được giao",
  DEADLINE_REMINDERS: "Nhắc hạn",
  WATER_ALERTS: "Cảnh báo chất lượng nước",
  TRACEABILITY_QR_SENT: "Đã gửi QR truy xuất",
  SALES_NOTICES: "Thông báo bán hàng",
};

const CHANNELS: { key: NotificationChannel; label: string; name: string }[] = [
  { key: "InApp", label: "Trong app", name: "trong app" },
  { key: "Push", label: "Push", name: "Push" },
  { key: "Email", label: "Email", name: "Email" },
  { key: "Zalo", label: "Zalo OA", name: "Zalo OA" },
];

const key = (category: string, channel: NotificationChannel) => `${category}:${channel}`;

/**
 * ACS-07 tùy chọn thông báo: mỗi nhóm một thẻ với bốn kênh. Nhóm bắt buộc khóa In-app (MSG23); kênh
 * chưa đủ điều kiện bị vô hiệu kèm lý do (MSG21). Push theo quyết định ở OMTS-215: chưa chốt thì hiện
 * "chưa khả dụng"; khi chốt, bật Push lần đầu sẽ xin quyền và đăng ký thiết bị, bị từ chối thì MSG22.
 */
function NotificationPreferencesPage() {
  const { openSnackbar } = useSnackbar();
  const [categories, setCategories] = useState<CategoryPreferenceView[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [values, setValues] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [askPush, setAskPush] = useState(false);
  const [pushDenied, setPushDenied] = useState(false);
  const [notice, setNotice] = useState("");

  const apply = useCallback((list: CategoryPreferenceView[]) => {
    setCategories(list);
    const next: Record<string, boolean> = {};
    for (const c of list) for (const ch of c.channels) next[key(c.category, ch.channel)] = ch.enabled;
    setValues(next);
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

  const pushEligible = categories?.some((c) => c.channels.some((ch) => ch.channel === "Push" && ch.eligible)) ?? false;

  const toggle = (category: string, channel: NotificationChannel, enabled: boolean) => {
    if (channel === "Push" && enabled && !pushEligible && pushAvailable()) {
      setAskPush(true);
      return;
    }
    setValues((v) => ({ ...v, [key(category, channel)]: enabled }));
  };

  const save = async () => {
    if (!categories) return;
    const items: NotificationPreferenceChange[] = [];
    for (const c of categories) {
      for (const ch of c.channels) {
        const locked = c.mandatory && (ch.channel === "InApp" || ch.channel === "Push");
        if (locked || !ch.eligible) continue;
        items.push({ category: c.category, channel: ch.channel, enabled: values[key(c.category, ch.channel)] ?? ch.enabled });
      }
    }
    setSaving(true);
    setError("");
    try {
      const saved = await saveNotificationPreferences(items);
      apply(saved.categories);
      openSnackbar({ text: MESSAGES.MSG10("tùy chọn thông báo"), type: "success", duration: 4000 });
      setNotice(saved.notice ?? "");
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

  return (
    <Page className="screen screen--detail" hideScrollbar>
      <Header title="Tùy chọn thông báo" className="detail-header" />
      <div className="screen__body form">
        {!categories && !loadError && <div className="skeleton skeleton--form" aria-busy />}
        {loadError && (
          <div className="empty">
            <p className="empty__title">Không tải được tùy chọn</p>
            <p className="empty__text">{loadError}</p>
            <Button size="large" onClick={() => void load()}>
              Thử lại
            </Button>
          </div>
        )}

        {categories?.map((c) => (
          <section key={c.category} className="card pref">
            <h2 className="pref__title">{CATEGORY_LABEL[c.category] ?? c.category}</h2>
            {c.mandatory && <p className="pref__note">{MESSAGES.MSG23}</p>}
            <ul className="pref__rows">
              {CHANNELS.map((channel) => {
                const view = c.channels.find((ch) => ch.channel === channel.key);
                if (!view) return null;
                const locked = c.mandatory && (channel.key === "InApp" || channel.key === "Push");
                const pushUnavailable = channel.key === "Push" && !pushAvailable();
                const disabled = locked || pushUnavailable || (!view.eligible && !(channel.key === "Push" && pushAvailable()));
                const checked = locked ? true : (values[key(c.category, channel.key)] ?? view.enabled);
                const reason = pushUnavailable
                  ? "Push chưa khả dụng: kênh thông báo đang chờ chốt (OMTS-215)."
                  : locked
                    ? null
                    : !view.eligible && channel.key !== "Push"
                      ? MESSAGES.MSG21(channel.name)
                      : null;
                return (
                  <li key={channel.key} className="pref__row">
                    <div className="pref__text">
                      <span className="pref__label">{channel.label}</span>
                      {reason && <span className="pref__reason">{reason}</span>}
                      {locked && <span className="pref__reason">Luôn bật</span>}
                    </div>
                    <Switch
                      checked={checked}
                      disabled={disabled}
                      aria-label={`${CATEGORY_LABEL[c.category] ?? c.category}: ${channel.label}`}
                      onChange={(e) => toggle(c.category, channel.key, e.target.checked)}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {categories && (
          <>
            <FormError text={error} />
            <Button fullWidth size="large" loading={saving} disabled={saving} onClick={() => void save()}>
              Lưu tùy chọn
            </Button>
          </>
        )}
      </div>

      <Modal
        visible={askPush}
        title="Nhận thông báo đẩy"
        description="OMTS sẽ gửi cảnh báo nước, đơn hàng mới và việc được giao tới Zalo của bạn ngay cả khi không mở app. Zalo sẽ hỏi bạn có cho phép không; bạn có thể từ chối và vẫn dùng các kênh khác."
        onClose={() => setAskPush(false)}
        actions={[
          { text: "Để sau", close: true },
          { text: "Cho phép", highLight: true, onClick: () => void grantPush() },
        ]}
      />
      <Modal
        visible={pushDenied || !!notice}
        title="Thông báo đẩy chưa bật"
        description={notice || MESSAGES.MSG22}
        onClose={() => {
          setPushDenied(false);
          setNotice("");
        }}
        verticalActions
        actions={[
          ...(pushAvailable() ? [{ text: "Mở cài đặt thông báo", highLight: true, onClick: () => void openPushSettings() }] : []),
          { text: "Đã hiểu", close: true },
        ]}
      />
    </Page>
  );
}

export default NotificationPreferencesPage;
