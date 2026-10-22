import { act, render, screen, userEvent } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ProfileController } from "@/features/profile/components/profile-controller";
import type { ProfileLoadResult } from "@/features/profile/services/profile-service";
import {
  createProfileServiceMock,
  profileFixture,
} from "@/features/profile/testing/profile-fixture";
import { deferredResult } from "@/shared/testing/deferred-result";

function createProps() {
  return {
    onChangeEmail: jest.fn(), onChangePhone: jest.fn(), onLogout: jest.fn(),
    onOpenNotifications: jest.fn(), onOpenPasswordChange: jest.fn(),
    onSessionExpired: jest.fn(), service: createProfileServiceMock(),
  };
}

function renderController(props = createProps()) {
  return render(
    <SafeAreaProvider initialMetrics={{
      frame: { height: 844, width: 390, x: 0, y: 0 },
      insets: { bottom: 34, left: 0, right: 0, top: 47 },
    }}>
      <ProfileController {...props} />
    </SafeAreaProvider>,
  );
}

describe("profile controller screen integration", () => {
  test("shows a named skeleton until the profile loads", async () => {
    const props = createProps();
    const completion = deferredResult<ProfileLoadResult>();
    props.service.load.mockReturnValue(completion.promise);
    await renderController(props);
    expect(screen.getByRole("progressbar", { name: "Đang tải hồ sơ cá nhân" })).toBeOnTheScreen();
    expect(screen.queryByLabelText("Tên hiển thị")).not.toBeOnTheScreen();
    await act(() => completion.resolve({ profile: profileFixture, status: "loaded" }));
    expect(await screen.findByLabelText("Tên hiển thị")).toHaveDisplayValue("Lê Minh Hải");
  });

  test("saves through the real form and keeps account actions connected", async () => {
    const user = userEvent.setup();
    const props = createProps();
    await renderController(props);
    const name = await screen.findByLabelText("Tên hiển thị");
    await user.clear(name);
    await user.type(name, "Hải mới");
    await user.press(screen.getByRole("button", { name: "Lưu tên hiển thị" }));
    expect(await screen.findByText("Hồ sơ cá nhân đã được lưu.")).toBeOnTheScreen();
    expect(props.service.save).toHaveBeenCalledWith({ displayName: "Hải mới", expectedRevision: "opaque-version-1" });
    await user.press(screen.getByRole("button", { name: "Đổi mật khẩu" }));
    expect(props.onOpenPasswordChange).toHaveBeenCalledTimes(1);
  });

  test("explains a conflict, keeps the draft visible and offers explicit discard/reload", async () => {
    const user = userEvent.setup();
    const props = createProps();
    props.service.save.mockResolvedValue({ status: "conflict", updatedBy: "Nguyễn An", updatedAt: "09:30" });
    await renderController(props);
    const name = await screen.findByLabelText("Tên hiển thị");
    await user.clear(name);
    await user.type(name, "Tên của tôi");
    await user.press(screen.getByRole("button", { name: "Lưu tên hiển thị" }));
    expect(await screen.findByText(/Hồ sơ vừa được cập nhật bởi Nguyễn An lúc 09:30/)).toBeOnTheScreen();
    expect(name).toHaveDisplayValue("Tên của tôi");
    expect(screen.getByRole("button", { name: "Lưu tên hiển thị" })).toBeDisabled();

    props.service.load.mockResolvedValue({ profile: { ...profileFixture, displayName: "Tên mới trên server" }, status: "loaded" });
    await user.press(screen.getByRole("button", { name: "Tải lại và bỏ thay đổi" }));
    expect(await screen.findByDisplayValue("Tên mới trên server")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Lưu tên hiển thị" })).toBeEnabled();
  });

  test("retries a failed initial load from the error screen", async () => {
    const user = userEvent.setup();
    const props = createProps();
    props.service.load.mockRejectedValueOnce(new Error("offline"));
    await renderController(props);
    expect(await screen.findByText("Chưa tải được hồ sơ")).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByLabelText("Tên hiển thị")).toBeOnTheScreen();
  });

  test("hides profile and mutation controls when the session expires", async () => {
    const props = createProps();
    props.service.load.mockResolvedValue({ status: "session-expired" });
    await renderController(props);
    expect(await screen.findByText("Cần đăng nhập lại")).toBeOnTheScreen();
    expect(screen.queryByLabelText("Tên hiển thị")).not.toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Thử lại" })).not.toBeOnTheScreen();
    expect(props.onSessionExpired).toHaveBeenCalledTimes(1);
  });
});
