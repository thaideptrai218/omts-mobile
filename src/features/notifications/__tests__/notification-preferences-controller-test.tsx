import { act, renderHook, waitFor } from "@testing-library/react-native";

import type {
  NotificationPreferenceSettings,
  SaveNotificationPreferencesResult,
} from "@/features/notifications/domain/notification-preferences";
import { useNotificationPreferencesController } from "@/features/notifications/hooks/use-notification-preferences-controller";
import { createNotificationPreferencesService } from "@/features/notifications/services/notification-preferences-service";
import { deferredResult } from "@/shared/testing/deferred-result";
import type { PushPermissionState } from "@/features/notifications/domain/push-permission";

const settings: NotificationPreferenceSettings = {
  channels: [{ id: "in-app", label: "Trong ứng dụng" }],
  items: [
    {
      channels: [{ channelId: "in-app", editable: true, enabled: true }],
      id: "water-alert",
      label: "Cảnh báo chất lượng nước",
      mandatory: false,
    },
  ],
};

function createDependencies() {
  const repository = {
    load: jest.fn().mockResolvedValue({ settings, status: "loaded" as const }),
    save: jest.fn().mockImplementation(async ({ selections }) => ({
      message: { code: "MSG10" as const, objectName: "Tùy chọn thông báo" },
      settings: {
        ...settings,
        items: settings.items.map((item) => ({
          ...item,
          channels: item.channels.map((cell) => ({
            ...cell,
            enabled:
              selections.find(
                (selection: { channelId: string; notificationTypeId: string }) =>
                  selection.notificationTypeId === item.id &&
                  selection.channelId === cell.channelId,
              )?.enabled ?? cell.enabled,
          })),
        })),
      },
      status: "saved" as const,
    })),
  };

  return {
    onSessionExpired: jest.fn(),
    preferencesService: createNotificationPreferencesService(repository),
    pushPermissionRepository: {
      read: jest.fn().mockResolvedValue({
        canAskAgain: true,
        status: "undetermined" as const,
      }),
      request: jest.fn().mockResolvedValue({
        canAskAgain: false,
        status: "denied" as const,
      }),
    },
    repository,
  };
}

describe("notification preferences controller", () => {
  test("ignores a save result from the previous service scope", async () => {
    const previous = createDependencies();
    const completion = deferredResult<SaveNotificationPreferencesResult>();
    previous.repository.save.mockReturnValue(completion.promise);
    const { result, rerender } = await renderHook(
      ({ dependencies }: { dependencies: ReturnType<typeof createDependencies> }) =>
        useNotificationPreferencesController(dependencies),
      { initialProps: { dependencies: previous } },
    );
    await waitFor(() => expect(result.current.state.status).toBe("ready"));
    await act(() => { void result.current.save(); });

    const next = createDependencies();
    const nextSettings = { ...settings, items: [] };
    next.repository.load.mockResolvedValue({ settings: nextSettings, status: "loaded" });
    await rerender({ dependencies: next });
    await waitFor(() => expect(result.current.state).toMatchObject({ status: "ready", settings: nextSettings }));
    await act(() => completion.resolve({ message: { code: "MSG19" }, status: "session-expired" }));

    expect(result.current.state).toMatchObject({ status: "ready", settings: nextSettings });
    expect(previous.onSessionExpired).not.toHaveBeenCalled();
  });

  test("does not apply an old permission result to the next service scope", async () => {
    const previous = createDependencies();
    const completion = deferredResult<PushPermissionState>();
    previous.pushPermissionRepository.request.mockReturnValue(completion.promise);
    const { result, rerender } = await renderHook(
      ({ dependencies }: { dependencies: ReturnType<typeof createDependencies> }) =>
        useNotificationPreferencesController(dependencies),
      { initialProps: { dependencies: previous } },
    );
    await waitFor(() => expect(result.current.state.status).toBe("ready"));
    await act(() => { void result.current.requestPushPermission(); });
    await rerender({ dependencies: createDependencies() });
    await waitFor(() => expect(result.current.state).toMatchObject({ requestingPushPermission: false }));
    await act(() => completion.resolve({ canAskAgain: false, status: "denied" }));
    expect(result.current.state).toMatchObject({ pushPermission: { status: "undetermined" } });
  });
  test("loads canonical settings and restores them when cancelling a draft", async () => {
    const dependencies = createDependencies();
    const { result } = await renderHook(() =>
      useNotificationPreferencesController(dependencies),
    );

    await waitFor(() => expect(result.current.state.status).toBe("ready"));
    await act(() =>
      result.current.change({
        channelId: "in-app",
        enabled: false,
        notificationTypeId: "water-alert",
      }),
    );
    expect(
      result.current.state.status === "ready" &&
        result.current.state.settings.items[0].channels[0].enabled,
    ).toBe(false);

    await act(() => result.current.cancel());
    expect(
      result.current.state.status === "ready" &&
        result.current.state.settings.items[0].channels[0].enabled,
    ).toBe(true);
  });

  test("saves the draft and promotes the response to canonical state", async () => {
    const dependencies = createDependencies();
    const { result } = await renderHook(() =>
      useNotificationPreferencesController(dependencies),
    );
    await waitFor(() => expect(result.current.state.status).toBe("ready"));

    await act(() =>
      result.current.change({
        channelId: "in-app",
        enabled: false,
        notificationTypeId: "water-alert",
      }),
    );
    await act(() => result.current.save());

    expect(dependencies.repository.save).toHaveBeenCalledWith({
      selections: [
        {
          channelId: "in-app",
          enabled: false,
          notificationTypeId: "water-alert",
        },
      ],
    });
    expect(
      result.current.state.status === "ready" && result.current.state.feedback?.code,
    ).toBe("MSG10");
  });

  test("keeps draft changes made while the OS permission request is pending", async () => {
    const dependencies = createDependencies();
    let resolvePermission: ((value: { canAskAgain: false; status: "denied" }) => void) | undefined;
    dependencies.pushPermissionRepository.request.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePermission = resolve;
        }),
    );
    const { result } = await renderHook(() =>
      useNotificationPreferencesController(dependencies),
    );
    await waitFor(() => expect(result.current.state.status).toBe("ready"));

    await act(() => {
      void result.current.requestPushPermission();
    });
    await act(() =>
      result.current.change({
        channelId: "in-app",
        enabled: false,
        notificationTypeId: "water-alert",
      }),
    );
    await act(() => {
      resolvePermission?.({ canAskAgain: false, status: "denied" });
    });
    await waitFor(() =>
      expect(
        result.current.state.status === "ready" &&
          result.current.state.requestingPushPermission,
      ).toBe(false),
    );

    expect(
      result.current.state.status === "ready" &&
        result.current.state.settings.items[0].channels[0].enabled,
    ).toBe(false);
    expect(result.current.state).toMatchObject({ status: "ready", feedback: null });
  });

  test("delegates session expiry instead of deciding navigation", async () => {
    const dependencies = createDependencies();
    dependencies.repository.load.mockResolvedValue({
      message: { code: "MSG19" },
      status: "session-expired",
    });

    const { result } = await renderHook(() =>
      useNotificationPreferencesController(dependencies),
    );

    await waitFor(() => expect(result.current.state.status).toBe("session-expired"));
    expect(dependencies.onSessionExpired).toHaveBeenCalledTimes(1);
  });

  test("removes editable settings on expired save even if permission finishes later", async () => {
    const dependencies = createDependencies();
    const permission = deferredResult<PushPermissionState>();
    dependencies.pushPermissionRepository.request.mockReturnValue(permission.promise);
    dependencies.repository.save.mockResolvedValue({
      message: { code: "MSG19" }, status: "session-expired",
    });
    const { result } = await renderHook(() => useNotificationPreferencesController(dependencies));
    await waitFor(() => expect(result.current.state.status).toBe("ready"));
    await act(() => { void result.current.requestPushPermission(); });
    await act(() => result.current.save());
    expect(result.current.state).toEqual({ status: "session-expired" });
    await act(() => permission.resolve({ canAskAgain: false, status: "denied" }));
    await act(() => result.current.save());
    expect(result.current.state).toEqual({ status: "session-expired" });
    expect(dependencies.repository.save).toHaveBeenCalledTimes(1);
    expect(dependencies.onSessionExpired).toHaveBeenCalledTimes(1);
  });

  test("blocks duplicate saves, edits and cancel during a pending save", async () => {
    const dependencies = createDependencies();
    const completion = deferredResult<SaveNotificationPreferencesResult>();
    dependencies.repository.save.mockReturnValue(completion.promise);
    const { result } = await renderHook(() => useNotificationPreferencesController(dependencies));
    await waitFor(() => expect(result.current.state.status).toBe("ready"));
    let cancelAccepted: boolean | undefined;

    await act(() => {
      void result.current.save();
      void result.current.save();
      result.current.change({ channelId: "in-app", enabled: false, notificationTypeId: "water-alert" });
      cancelAccepted = result.current.cancel();
    });

    expect(dependencies.repository.save).toHaveBeenCalledTimes(1);
    expect(cancelAccepted).toBe(false);
    expect(result.current.state).toMatchObject({
      saving: true,
      settings: { items: [{ channels: [{ enabled: true }] }] },
    });
    await act(() => completion.resolve({
      message: { code: "MSG10", objectName: "Tùy chọn thông báo" },
      settings, status: "saved",
    }));
    expect(result.current.state).toMatchObject({ saving: false });
  });

  test("keeps both progress flags when save and permission requests start together", async () => {
    const dependencies = createDependencies();
    const saved = deferredResult<SaveNotificationPreferencesResult>();
    const permission = deferredResult<PushPermissionState>();
    dependencies.repository.save.mockReturnValue(saved.promise);
    dependencies.pushPermissionRepository.request.mockReturnValue(permission.promise);
    const { result } = await renderHook(() => useNotificationPreferencesController(dependencies));
    await waitFor(() => expect(result.current.state.status).toBe("ready"));

    await act(() => {
      void result.current.save();
      void result.current.requestPushPermission();
      void result.current.requestPushPermission();
    });
    expect(result.current.state).toMatchObject({ saving: true, requestingPushPermission: true });
    expect(dependencies.pushPermissionRepository.request).toHaveBeenCalledTimes(1);

    await act(() => permission.resolve({ canAskAgain: false, status: "denied" }));
    expect(result.current.state).toMatchObject({
      saving: true, requestingPushPermission: false,
      pushPermission: { status: "denied" },
    });
    await act(() => saved.resolve({
      message: { code: "MSG10", objectName: "Tùy chọn thông báo" },
      settings, status: "saved",
    }));
    expect(result.current.state).toMatchObject({ saving: false, pushPermission: { status: "denied" } });
  });

  test("retains an unsaved selection when the parent callback changes", async () => {
    const dependencies = createDependencies();
    const { result, rerender } = await renderHook(
      ({ onSessionExpired }: { onSessionExpired: () => void }) =>
        useNotificationPreferencesController({ ...dependencies, onSessionExpired }),
      { initialProps: { onSessionExpired: jest.fn() } },
    );
    await waitFor(() => expect(result.current.state.status).toBe("ready"));
    await act(() => result.current.change({
      channelId: "in-app", enabled: false, notificationTypeId: "water-alert",
    }));
    await rerender({ onSessionExpired: jest.fn() });
    expect(dependencies.repository.load).toHaveBeenCalledTimes(1);
    expect(result.current.state).toMatchObject({ settings: { items: [{ channels: [{ enabled: false }] }] } });
  });
});
