import {
  fireEvent,
  render,
  screen,
  userEvent,
} from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import type { NotificationPreferenceSettings } from "@/features/notifications/domain/notification-preferences";
import { NotificationPreferencesScreen } from "@/features/notifications/screens/notification-preferences-screen";

const safeAreaMetrics = {
  frame: { height: 844, width: 390, x: 0, y: 0 },
  insets: { bottom: 34, left: 0, right: 0, top: 47 },
};

const settings: NotificationPreferenceSettings = {
  channels: [
    { id: "in-app", label: "Trong ứng dụng" },
    { id: "push", label: "Thông báo đẩy" },
    { id: "email", label: "Email" },
  ],
  items: [
    {
      channels: [
        {
          channelId: "in-app",
          editable: false,
          enabled: true,
          reason: { code: "MSG23" },
        },
        {
          channelId: "push",
          editable: false,
          enabled: false,
          reason: { code: "MSG22" },
        },
        { channelId: "email", editable: true, enabled: false },
      ],
      description: "Thông tin quan trọng phục vụ vận hành vùng nuôi.",
      id: "water-alert-test",
      label: "Cảnh báo chất lượng nước",
      mandatory: true,
    },
  ],
};

const undeterminedPushPermission = {
  canAskAgain: true,
  status: "undetermined",
} as const;

function renderScreen(
  props: React.ComponentProps<typeof NotificationPreferencesScreen>,
) {
  return render(
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>
      <NotificationPreferencesScreen {...props} />
    </SafeAreaProvider>,
  );
}

describe("NotificationPreferencesScreen", () => {
  test("does not claim preferences were saved merely because OS permission is denied", async () => {
    await renderScreen({
      onCancel: jest.fn(), onChange: jest.fn(), onRequestPushPermission: jest.fn(),
      onSave: jest.fn(),
      pushPermission: { canAskAgain: false, status: "denied" },
      settings: { channels: [], items: [] }, status: "ready",
    });
    expect(screen.getByText(/Thiết bị đang tắt thông báo đẩy/)).toBeOnTheScreen();
    expect(screen.queryByText(/Các kênh hợp lệ khác vẫn được lưu/)).not.toBeOnTheScreen();
  });
  test("renders a narrow-screen card with visible locked reasons", async () => {
    await renderScreen({
      onCancel: jest.fn(),
      onChange: jest.fn(),
      onRequestPushPermission: jest.fn(),
      onSave: jest.fn(),
      pushPermission: undeterminedPushPermission,
      settings,
      status: "ready",
    });

    expect(screen.getByText("Cảnh báo chất lượng nước")).toBeOnTheScreen();
    expect(screen.getByText("Bắt buộc")).toBeOnTheScreen();
    expect(screen.getByText(/bắt buộc và không thể tắt/)).toBeOnTheScreen();
    expect(screen.getByText(/Thiết bị đã từ chối/)).toBeOnTheScreen();
    const deniedPushSwitch = screen.getByRole("switch", {
      name: "Thông báo đẩy cho Cảnh báo chất lượng nước",
    });
    expect(deniedPushSwitch).toBeDisabled();
    expect(deniedPushSwitch).toHaveProp(
      "accessibilityHint",
      expect.stringMatching(/Thiết bị đã từ chối/),
    );
  });

  test("emits the identity of an editable cell", async () => {
    const onChange = jest.fn();

    await renderScreen({
      onCancel: jest.fn(),
      onChange,
      onRequestPushPermission: jest.fn(),
      onSave: jest.fn(),
      pushPermission: undeterminedPushPermission,
      settings,
      status: "ready",
    });
    fireEvent(
      screen.getByRole("switch", {
        name: "Email cho Cảnh báo chất lượng nước",
      }),
      "valueChange",
      true,
    );

    expect(onChange).toHaveBeenCalledWith({
      channelId: "email",
      enabled: true,
      notificationTypeId: "water-alert-test",
    });
  });

  test("requests OS permission only from the explicit action", async () => {
    const user = userEvent.setup();
    const onRequestPushPermission = jest.fn();

    await renderScreen({
      onCancel: jest.fn(),
      onChange: jest.fn(),
      onRequestPushPermission,
      onSave: jest.fn(),
      pushPermission: undeterminedPushPermission,
      settings,
      status: "ready",
    });

    expect(onRequestPushPermission).not.toHaveBeenCalled();
    await user.press(
      screen.getByRole("button", { name: "Cho phép thông báo" }),
    );
    expect(onRequestPushPermission).toHaveBeenCalledTimes(1);
  });

  test("renders a deliberate loading state", async () => {
    await renderScreen({ status: "loading" });
    expect(screen.getByRole("progressbar")).toBeOnTheScreen();
  });

  test("renders a retryable load error", async () => {
    const onRetry = jest.fn();
    await renderScreen({
      message: "Không thể kết nối tới máy chủ.",
      onRetry,
      status: "error",
    });

    expect(screen.getByText("Chưa tải được tùy chọn")).toBeOnTheScreen();
  });
});
