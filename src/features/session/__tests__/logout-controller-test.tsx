import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useLogoutController } from "@/features/session/hooks/use-logout-controller";
import { deferredResult } from "@/shared/testing/deferred-result";
import type { LogoutResult } from "@/features/session/domain/logout";

const successfulResult = {
  localCleanup: "cleared",
  navigateToLogin: true,
  serverRevoke: "revoked",
  warningCode: null,
} as const;

function createDependencies() {
  return {
    logoutService: {
      logout: jest.fn().mockResolvedValue(successfulResult),
    },
    onLoggedOut: jest.fn(),
    onUnexpectedError: jest.fn(),
  };
}

describe("logout controller", () => {
  test("keeps navigation callback failures outside logout service errors", async () => {
    const dependencies = createDependencies();
    dependencies.onLoggedOut.mockImplementation(() => { throw new Error("navigation failed"); });
    const { result } = await renderHook(() => useLogoutController(dependencies));
    await act(async () => {
      await expect(result.current.confirm("online")).rejects.toThrow("navigation failed");
    });
    expect(dependencies.onUnexpectedError).not.toHaveBeenCalled();
    expect(result.current.visible).toBe(false);
    expect(result.current.confirming).toBe(false);
  });

  test("does not navigate from a late logout result after unmount", async () => {
    const dependencies = createDependencies();
    const completion = deferredResult<LogoutResult>();
    dependencies.logoutService.logout.mockReturnValue(completion.promise);
    const { result, unmount } = await renderHook(() => useLogoutController(dependencies));
    await act(() => { void result.current.confirm("online"); });
    await unmount();
    await act(() => completion.resolve(successfulResult));
    expect(dependencies.onLoggedOut).not.toHaveBeenCalled();
  });
  test("opens and cancels the confirmation before a logout starts", async () => {
    const dependencies = createDependencies();
    const { result } = await renderHook(() => useLogoutController(dependencies));

    await act(() => result.current.open());
    expect(result.current.visible).toBe(true);
    await act(() => result.current.cancel());
    expect(result.current.visible).toBe(false);
    expect(dependencies.logoutService.logout).not.toHaveBeenCalled();
  });

  test("submits once and delegates navigation with the service result", async () => {
    const dependencies = createDependencies();
    let finishLogout: ((value: typeof successfulResult) => void) | undefined;
    dependencies.logoutService.logout.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishLogout = resolve;
        }),
    );
    const { result } = await renderHook(() => useLogoutController(dependencies));
    await act(() => result.current.open());

    await act(() => {
      void result.current.confirm("online");
      void result.current.confirm("online");
    });
    expect(dependencies.logoutService.logout).toHaveBeenCalledTimes(1);
    expect(result.current.confirming).toBe(true);

    await act(() => finishLogout?.(successfulResult));
    await waitFor(() => expect(result.current.confirming).toBe(false));
    expect(dependencies.onLoggedOut).toHaveBeenCalledWith(successfulResult);
    expect(result.current.visible).toBe(false);
  });

  test("passes offline status without inventing a queue in the controller", async () => {
    const dependencies = createDependencies();
    const { result } = await renderHook(() => useLogoutController(dependencies));

    await act(() => result.current.confirm("offline"));

    expect(dependencies.logoutService.logout).toHaveBeenCalledWith("offline");
  });

  test("keeps the dialog recoverable after an unexpected service exception", async () => {
    const dependencies = createDependencies();
    dependencies.logoutService.logout.mockRejectedValue(
      new Error("unexpected implementation failure"),
    );
    const { result } = await renderHook(() => useLogoutController(dependencies));
    await act(() => result.current.open());

    await act(() => result.current.confirm("online"));

    expect(dependencies.onUnexpectedError).toHaveBeenCalledTimes(1);
    expect(dependencies.onLoggedOut).not.toHaveBeenCalled();
    expect(result.current.visible).toBe(true);
    expect(result.current.confirming).toBe(false);
  });
});
