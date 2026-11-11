import type { CategoryPreferenceView, NotificationChannel, NotificationPreferenceChange } from "@/features/notifications/models/NotificationPreferences";
import { useCallback, useEffect, useState } from "react";
import { Button, Modal, Switch, useSnackbar } from "zmp-ui";

import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Section } from "@/components/Section/Section";
import { errorText } from "@/utils/errorText";
import { MESSAGES } from "@/constants/messages";
import { getNotificationPreferences, saveNotificationPreferences } from "@/features/notifications/services/notificationsService";
import { openPushSettings, pushAvailable, requestPushPermission } from "@/features/notifications/services/pushService";

const CATEGORY_LABEL: Record<string, string> = {
  ORDERS: "Đơn hàng mới",
  WORK: "Công việc được giao",
  DEADLINE_REMINDERS: "Nhắc hạn",
  WATER_ALERTS: "Cảnh báo chất lượng nước",
  TRACEABILITY_QR_SENT: "Đã gửi QR truy xuất",
  SALES_NOTICES: "Thông báo bán hàng",
};

const CHANNELS: { key: NotificationChannel; label: string; name: string }[] = [
  { key: "InApp", label: "Trong ứng dụng", name: "trong ứng dụng" },
  { key: "Push", label: "Thông báo trên điện thoại", name: "thông báo trên điện thoại" },
  { key: "Email", label: "Email", name: "Email" },
  { key: "Zalo", label: "Tin nhắn Zalo", name: "tin nhắn Zalo" },
];

/** Chia các nhóm thông báo thành vài mục rõ ràng để không phải dò một danh sách dài tới 24 công tắc. */
const SECTIONS: { title: string; categories: string[] }[] = [
  { title: "Cảnh báo", categories: ["WATER_ALERTS"] },
  { title: "Công việc", categories: ["WORK", "DEADLINE_REMINDERS"] },
  { title: "Đơn hàng và bán hàng", categories: ["ORDERS", "SALES_NOTICES", "TRACEABILITY_QR_SENT"] },
];

function sectionsOf(list: CategoryPreferenceView[]) {
  const known = SECTIONS.map((s) => ({ title: s.title, items: list.filter((c) => s.categories.includes(c.category)) }));
  const other = list.filter((c) => !SECTIONS.some((s) => s.categories.includes(c.category)));
  return [...known, { title: "Khác", items: other }].filter((s) => s.items.length > 0);
}

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

  const pageError = error || loadError;

  return (
    <ManagePage
      title="Tùy chọn thông báo"
      footer={
        categories ? (
          <Button fullWidth size="large" loading={saving} disabled={saving} onClick={() => void save()}>
            Lưu tùy chọn
          </Button>
        ) : undefined
      }
    >
      <Loadable data={categories} error={loadError} reload={() => void load()}>
        {(list) => (
          <>
            {sectionsOf(list).map((section) => (
              <Section key={section.title} title={section.title}>
                <div className="form">
                  {section.items.map((c) => {
                    const categoryLabel = CATEGORY_LABEL[c.category] ?? "Thông báo khác";
                    return (
                      <section key={c.category} className="card pref">
                        <h3 className="pref__title">{categoryLabel}</h3>
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
                              ? "Chưa dùng được: hệ thống đang hoàn thiện cách gửi này."
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
                                  aria-label={`${categoryLabel}: ${channel.label}`}
                                  onChange={(e) => toggle(c.category, channel.key, e.target.checked)}
                                />
                              </li>
                            );
                          })}
                        </ul>
                      </section>
                    );
                  })}
                </div>
              </Section>
            ))}
            {pageError && (
              <div className="block">
                <FormError text={pageError} />
              </div>
            )}
          </>
        )}
      </Loadable>

      <Modal
        visible={askPush}
        title="Nhận thông báo trên điện thoại"
        description="OMTS sẽ gửi cảnh báo nước, đơn hàng mới và việc được giao tới Zalo của bạn ngay cả khi không mở app. Zalo sẽ hỏi bạn có cho phép không; bạn có thể từ chối và vẫn dùng các kênh khác."
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
          ...(pushAvailable() ? [{ text: "Mở cài đặt thông báo", highLight: true, onClick: () => void openPushSettings() }] : []),
          { text: "Đã hiểu", close: true },
        ]}
      />
    </ManagePage>
  );
}

export default NotificationPreferencesPage;
