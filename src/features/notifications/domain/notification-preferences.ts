export type NotificationChannel = Readonly<{
  id: string;
  label: string;
}>;

export type LockedNotificationPreferenceReason =
  | Readonly<{
      channelName: string;
      code: "MSG21";
    }>
  | Readonly<{ code: "MSG22" }>
  | Readonly<{ code: "MSG23" }>;

export type NotificationPreferenceCell = Readonly<
  {
    channelId: string;
    enabled: boolean;
  } &
    (
      | Readonly<{
          editable: true;
          reason?: never;
        }>
      | Readonly<{
          editable: false;
          reason: LockedNotificationPreferenceReason;
        }>
    )
>;

export type NotificationPreferenceItem = Readonly<{
  channels: readonly NotificationPreferenceCell[];
  description?: string;
  id: string;
  mandatory: boolean;
  label: string;
}>;

export type NotificationPreferenceSettings = Readonly<{
  channels: readonly NotificationChannel[];
  items: readonly NotificationPreferenceItem[];
}>;

export type NotificationPreferenceSelection = Readonly<{
  channelId: string;
  enabled: boolean;
  notificationTypeId: string;
}>;

export type SaveNotificationPreferencesInput = Readonly<{
  selections: readonly NotificationPreferenceSelection[];
}>;

export type LoadNotificationPreferencesResult =
  | Readonly<{
      settings: NotificationPreferenceSettings;
      status: "loaded";
    }>
  | Readonly<{
      message: Readonly<{ code: "MSG19" }>;
      status: "session-expired";
    }>;

export type SaveNotificationPreferencesResult =
  | Readonly<{
      message: Readonly<{
        code: "MSG10";
        objectName: string;
      }>;
      settings: NotificationPreferenceSettings;
      status: "saved";
      warning?: Readonly<{ code: "MSG22" }>;
    }>
  | Readonly<{
      message: LockedNotificationPreferenceReason;
      status: "invalid-preference";
    }>
  | Readonly<{
      message: Readonly<{ code: "MSG19" }>;
      status: "session-expired";
    }>;

export type ChangeNotificationPreferenceResult =
  | Readonly<{
      selection: NotificationPreferenceSelection;
      status: "changed";
    }>
  | Readonly<{
      reason: LockedNotificationPreferenceReason;
      status: "blocked";
    }>;

export function changeNotificationPreference(
  settings: NotificationPreferenceSettings,
  selection: NotificationPreferenceSelection,
): ChangeNotificationPreferenceResult {
  const item = settings.items.find(
    (candidate) => candidate.id === selection.notificationTypeId,
  );
  const cell = item?.channels.find(
    (candidate) => candidate.channelId === selection.channelId,
  );

  if (!item || !cell) {
    throw new Error(
      `Unknown notification preference: ${selection.notificationTypeId}:${selection.channelId}`,
    );
  }

  if (!cell.editable && selection.enabled !== cell.enabled) {
    return { reason: cell.reason, status: "blocked" };
  }

  return { selection, status: "changed" };
}

export function applyNotificationPreferenceSelection(
  settings: NotificationPreferenceSettings,
  selection: NotificationPreferenceSelection,
): NotificationPreferenceSettings {
  const change = changeNotificationPreference(settings, selection);
  if (change.status === "blocked") return settings;

  return {
    ...settings,
    items: settings.items.map((item) =>
      item.id !== selection.notificationTypeId
        ? item
        : {
            ...item,
            channels: item.channels.map((cell) =>
              cell.channelId === selection.channelId
                ? { ...cell, enabled: selection.enabled }
                : cell,
            ),
          },
    ),
  };
}

export function listNotificationPreferenceSelections(
  settings: NotificationPreferenceSettings,
): readonly NotificationPreferenceSelection[] {
  return settings.items.flatMap((item) =>
    item.channels.map((cell) => ({
      channelId: cell.channelId,
      enabled: cell.enabled,
      notificationTypeId: item.id,
    })),
  );
}
