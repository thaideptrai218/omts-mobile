import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useProfileController } from "@/features/profile/hooks/use-profile-controller";
import type { ProfileLoadResult, ProfileSaveResult, ProfileService } from "@/features/profile/services/profile-service";
import {
  createProfileServiceMock,
  profileFixture,
} from "@/features/profile/testing/profile-fixture";
import { deferredResult } from "@/shared/testing/deferred-result";

async function renderConflict() {
  const service = createProfileServiceMock();
  service.save.mockResolvedValue({
    status: "conflict",
    updatedAt: "22/10/2026 09:30",
    updatedBy: "Nguyễn An",
  });
  const hook = await renderHook(() => useProfileController({
    onSessionExpired: jest.fn(), service,
  }));
  await waitFor(() => expect(hook.result.current.state.status).toBe("ready"));
  await act(() => hook.result.current.changeDisplayName("Tên tôi nhập"));
  await act(() => hook.result.current.save());
  return { ...hook, service };
}

describe("profile conflict and load transitions", () => {
  test("does not retain the previous profile if a replacement service fails to load", async () => {
    const original = createProfileServiceMock();
    const onSessionExpired = jest.fn();
    const { result, rerender } = await renderHook(
      ({ service }: { service: ProfileService }) => useProfileController({ service, onSessionExpired }),
      { initialProps: { service: original } },
    );
    await waitFor(() => expect(result.current.state.status).toBe("ready"));
    const replacement = createProfileServiceMock();
    replacement.load.mockRejectedValue(new Error("replacement unavailable"));
    await rerender({ service: replacement });
    await waitFor(() => expect(result.current.state.status).toBe("error"));
    expect(result.current.state).not.toHaveProperty("profile");
    await act(() => result.current.save());
    expect(replacement.save).not.toHaveBeenCalled();
  });
  test("keeps the draft on conflict and blocks blind save retries", async () => {
    const { result, service } = await renderConflict();
    expect(result.current.state).toMatchObject({
      conflict: true,
      feedback: { code: "MSG06" },
      profile: { revision: "opaque-version-1" },
      values: { displayName: "Tên tôi nhập" },
    });
    await act(() => result.current.save());
    expect(service.save).toHaveBeenCalledTimes(1);
    expect(service.load).toHaveBeenCalledTimes(1);
  });

  test("replaces the draft only after an explicit successful reload", async () => {
    const { result, service } = await renderConflict();
    const completion = deferredResult<ProfileLoadResult>();
    service.load.mockReturnValue(completion.promise);
    await act(() => { result.current.reload(); result.current.reload(); });
    expect(result.current.state).toMatchObject({
      reloading: true, values: { displayName: "Tên tôi nhập" },
    });
    expect(service.load).toHaveBeenCalledTimes(2);

    const freshProfile = {
      ...profileFixture,
      account: { ...profileFixture.account, email: { value: "new@example.com", verified: true } },
      displayName: "Tên trên hệ thống",
      revision: "opaque-version-3",
    };
    await act(() => completion.resolve({ profile: freshProfile, status: "loaded" }));
    expect(result.current.state).toMatchObject({
      conflict: false, reloading: false,
      profile: freshProfile,
      values: { displayName: "Tên trên hệ thống" },
    });
  });

  test("retains both the draft and conflict lock if reload fails", async () => {
    const { result, service } = await renderConflict();
    service.load.mockRejectedValue(new Error("connection lost"));
    await act(() => result.current.reload());
    await waitFor(() => expect(result.current.state).toMatchObject({ reloading: false }));
    expect(result.current.state).toMatchObject({
      conflict: true,
      feedback: { code: "MSG04" },
      values: { displayName: "Tên tôi nhập" },
    });
    await act(() => result.current.save());
    expect(service.save).toHaveBeenCalledTimes(1);
  });

  test("shows a retryable initial load failure and recovers", async () => {
    const service = createProfileServiceMock();
    service.load.mockRejectedValueOnce(new Error("offline"));
    const { result } = await renderHook(() => useProfileController({
      onSessionExpired: jest.fn(), service,
    }));
    await waitFor(() => expect(result.current.state.status).toBe("error"));
    await act(() => result.current.reload());
    await waitFor(() => expect(result.current.state.status).toBe("ready"));
    expect(service.load).toHaveBeenCalledTimes(2);
  });

  test("blocks editing and delegates when loading finds an expired session", async () => {
    const service = createProfileServiceMock();
    service.load.mockResolvedValue({ status: "session-expired" });
    const onSessionExpired = jest.fn();
    const { result } = await renderHook(() => useProfileController({ service, onSessionExpired }));
    await waitFor(() => expect(result.current.state.status).toBe("session-expired"));
    await act(() => result.current.changeDisplayName("Tên không được gửi"));
    await act(() => result.current.save());
    expect(service.save).not.toHaveBeenCalled();
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  test("ignores an old load after switching service scope", async () => {
    const oldLoad = deferredResult<ProfileLoadResult>();
    const oldService = createProfileServiceMock();
    oldService.load.mockReturnValue(oldLoad.promise);
    const newService = createProfileServiceMock();
    const newProfile = { ...profileFixture, displayName: "Người mới" };
    newService.load.mockResolvedValue({ profile: newProfile, status: "loaded" });
    const onSessionExpired = jest.fn();
    const { result, rerender } = await renderHook(
      ({ service }: { service: ProfileService }) =>
        useProfileController({ service, onSessionExpired }),
      { initialProps: { service: oldService } },
    );
    await rerender({ service: newService });
    await waitFor(() => expect(result.current.state).toMatchObject({ values: { displayName: "Người mới" } }));
    await act(() => oldLoad.resolve({ profile: profileFixture, status: "loaded" }));
    expect(result.current.state).toMatchObject({ values: { displayName: "Người mới" } });
  });

  test("ignores a late mutation result after unmount", async () => {
    const completion = deferredResult<ProfileSaveResult>();
    const service = createProfileServiceMock();
    service.save.mockReturnValue(completion.promise);
    const onSessionExpired = jest.fn();
    const { result, unmount } = await renderHook(() => useProfileController({ service, onSessionExpired }));
    await waitFor(() => expect(result.current.state.status).toBe("ready"));
    await act(() => { void result.current.save(); });
    await unmount();
    await act(() => completion.resolve({ status: "session-expired" }));
    expect(onSessionExpired).not.toHaveBeenCalled();
  });
});
