export type NotificationChannel = "InApp" | "Push" | "Email" | "Sms" | "Zalo";

export type ChannelPreferenceView = {
  channel: NotificationChannel;
  enabled: boolean;
  eligible: boolean;
  /** EMAIL_NOT_VERIFIED, ZALO_NOT_CONFIGURED, NO_PUSH_DEVICE hoặc null. */
  ineligibleReason: string | null;
};

export type CategoryPreferenceView = {
  category: string;
  mandatory: boolean;
  channels: ChannelPreferenceView[];
};

export type NotificationPreferenceChange = {
  category: string;
  channel: NotificationChannel;
  enabled: boolean;
};

export type NotificationPreferencesSaved = {
  categories: CategoryPreferenceView[];
  message: string;
  notice: string | null;
};
