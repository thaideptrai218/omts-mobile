import { render, screen, userEvent } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ProfileScreen } from "@/features/profile/screens/profile-screen";
import { resolveKnownMessage } from "@/shared/messages/message-catalog";

const safeAreaMetrics = {
  frame: { height: 844, width: 390, x: 0, y: 0 },
  insets: { bottom: 34, left: 0, right: 0, top: 47 },
};

const defaultProps = {
  account: {
    accessSummary: ["Quản lý vùng — Vùng Đông", "Kế toán — Toàn hợp tác xã"],
    accountCode: "ACC-0012",
    accountTypeLabel: "Nhân viên hợp tác xã",
    email: { value: "hai@example.com", verified: true },
    phone: { value: "0900000001", verified: true },
    username: "le.minh.hai",
  },
  onChangeDisplayName: jest.fn(),
  onChangeEmail: jest.fn(),
  onChangePhone: jest.fn(),
  onLogout: jest.fn(),
  onOpenNotifications: jest.fn(),
  onOpenPasswordChange: jest.fn(),
  onSaveProfile: jest.fn(),
  values: { displayName: "Lê Minh Hải" },
};

async function renderScreen(
  overrides: Partial<React.ComponentProps<typeof ProfileScreen>> = {},
) {
  return render(
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>
      <ProfileScreen {...defaultProps} {...overrides} />
    </SafeAreaProvider>,
  );
}

describe("ProfileScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders personal identity and zone-role summaries from supplied data", async () => {
    await renderScreen();

    expect(screen.getByText("Tên đăng nhập: le.minh.hai")).toBeOnTheScreen();
    expect(screen.getByText("• Quản lý vùng — Vùng Đông")).toBeOnTheScreen();
    expect(screen.getByText("• Kế toán — Toàn hợp tác xã")).toBeOnTheScreen();
    expect(screen.queryByText("Chủ HTX Trung Nam")).not.toBeOnTheScreen();
  });

  test("edits only the display name through the direct save action", async () => {
    const user = userEvent.setup();
    const onChangeDisplayName = jest.fn();
    const onSaveProfile = jest.fn();

    await renderScreen({ onChangeDisplayName, onSaveProfile });
    await user.type(screen.getByLabelText("Tên hiển thị"), " mới");
    await user.press(
      screen.getByRole("button", { name: "Lưu tên hiển thị" }),
    );

    expect(onChangeDisplayName).toHaveBeenCalled();
    expect(onSaveProfile).toHaveBeenCalledTimes(1);
  });

  test("starts separate verification flows for contact changes", async () => {
    const user = userEvent.setup();
    const onChangeEmail = jest.fn();
    const onChangePhone = jest.fn();

    await renderScreen({ onChangeEmail, onChangePhone });
    await user.press(screen.getByRole("button", { name: "Thay đổi email" }));
    await user.press(
      screen.getByRole("button", { name: "Thay đổi số điện thoại" }),
    );

    expect(onChangeEmail).toHaveBeenCalledTimes(1);
    expect(onChangePhone).toHaveBeenCalledTimes(1);
  });

  test("shows safe save feedback and locks actions while pending", async () => {
    await renderScreen({
      feedback: resolveKnownMessage("MSG10", {
        objectName: "Hồ sơ cá nhân",
      }),
      pending: true,
    });

    expect(screen.getByText("Hồ sơ cá nhân đã được lưu.")).toBeOnTheScreen();
    expect(screen.getByLabelText("Tên hiển thị")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Đăng xuất" })).toBeDisabled();
  });
});
