import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useProfileController } from "@/features/profile/hooks/use-profile-controller";
import type { ProfileSaveResult } from "@/features/profile/services/profile-service";
import {
  createProfileServiceMock,
  profileFixture,
} from "@/features/profile/testing/profile-fixture";
import { deferredResult } from "@/shared/testing/deferred-result";

function createDependencies() {
  return { onSessionExpired: jest.fn(), service: createProfileServiceMock() };
}

async function renderController(dependencies = createDependencies()) {
  const hook = await renderHook(() => useProfileController(dependencies));
  await waitFor(() => expect(hook.result.current.state.status).toBe("ready"));
  return hook;
}

describe("profile controller save", () => {
  test("validates the draft without sending invalid data", async () => {
    const dependencies = createDependencies();
    const { result } = await renderController(dependencies);
    await act(() => result.current.changeDisplayName("   "));
    await act(() => result.current.save());

    expect(dependencies.service.save).not.toHaveBeenCalled();
    expect(result.current.state).toMatchObject({
      errors: { displayName: "Vui lòng nhập tên hiển thị." },
      values: { displayName: "   " },
    });
  });

  test("sends only the name and loaded revision, then uses canonical server values", async () => {
    const dependencies = createDependencies();
    const { result } = await renderController(dependencies);
    await act(() => result.current.changeDisplayName("  Hải mới  "));
    await act(() => result.current.save());

    expect(dependencies.service.save).toHaveBeenCalledWith({
      displayName: "Hải mới",
      expectedRevision: "opaque-version-1",
    });
    expect(result.current.state).toMatchObject({
      feedback: { code: "MSG10" },
      profile: { revision: "opaque-version-2" },
      saving: false,
      values: { displayName: "Hải mới" },
    });
    await act(() => result.current.save());
    expect(dependencies.service.save).toHaveBeenLastCalledWith({
      displayName: "Hải mới",
      expectedRevision: "opaque-version-2",
    });
  });

  test("prevents duplicate save and input changes during the request", async () => {
    const dependencies = createDependencies();
    const completion = deferredResult<ProfileSaveResult>();
    dependencies.service.save.mockReturnValue(completion.promise);
    const { result } = await renderController(dependencies);
    await act(() => {
      void result.current.save();
      void result.current.save();
      result.current.changeDisplayName("Không được gửi");
    });

    expect(dependencies.service.save).toHaveBeenCalledTimes(1);
    expect(result.current.state).toMatchObject({
      saving: true,
      values: { displayName: profileFixture.displayName },
    });
    await act(() => completion.resolve({ profile: profileFixture, status: "saved" }));
    expect(result.current.state).toMatchObject({ saving: false });
  });

  test("preserves the draft after a service failure without leaking server prose", async () => {
    const dependencies = createDependencies();
    dependencies.service.save.mockRejectedValue(new Error("PRIVATE_SQL_ERROR"));
    const { result } = await renderController(dependencies);
    await act(() => result.current.changeDisplayName("Tên chưa lưu"));
    await act(() => result.current.save());

    expect(result.current.state).toMatchObject({
      feedback: { code: "MSG04" },
      saving: false,
      values: { displayName: "Tên chưa lưu" },
    });
    expect(JSON.stringify(result.current.state)).not.toContain("PRIVATE_SQL_ERROR");
  });

  test("maps a defensive username rejection without adding username to the payload", async () => {
    const dependencies = createDependencies();
    dependencies.service.save.mockResolvedValue({ status: "username-readonly" });
    const { result } = await renderController(dependencies);
    await act(() => result.current.save());
    expect(result.current.state).toMatchObject({ feedback: { code: "MSG20" } });
    expect(dependencies.service.save.mock.calls[0][0]).not.toHaveProperty("username");
  });

  test("delegates session expiration and removes the editable profile", async () => {
    const dependencies = createDependencies();
    dependencies.service.save.mockResolvedValue({ status: "session-expired" });
    const { result } = await renderController(dependencies);
    await act(() => result.current.save());
    expect(result.current.state).toEqual({ status: "session-expired" });
    expect(dependencies.onSessionExpired).toHaveBeenCalledTimes(1);
  });

  test("does not reload or erase the draft when a parent callback changes", async () => {
    const service = createProfileServiceMock();
    const { result, rerender } = await renderHook(
      ({ onSessionExpired }: { onSessionExpired: () => void }) =>
        useProfileController({ service, onSessionExpired }),
      { initialProps: { onSessionExpired: jest.fn() } },
    );
    await waitFor(() => expect(result.current.state.status).toBe("ready"));
    await act(() => result.current.changeDisplayName("Tên đang nhập"));
    await rerender({ onSessionExpired: jest.fn() });

    expect(service.load).toHaveBeenCalledTimes(1);
    expect(result.current.state).toMatchObject({ values: { displayName: "Tên đang nhập" } });
  });
});
