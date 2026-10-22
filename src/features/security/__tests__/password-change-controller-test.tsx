import { act, renderHook, waitFor } from "@testing-library/react-native";

import { usePasswordChangeController } from "@/features/security/hooks/use-password-change-controller";
import { deferredResult } from "@/shared/testing/deferred-result";
import type { PasswordChangeResult } from "@/features/security/services/password-change-service";

type PasswordChangeController = ReturnType<
  typeof usePasswordChangeController
>;

function createDependencies() {
  return {
    onChanged: jest.fn(),
    onSessionExpired: jest.fn(),
    service: {
      change: jest.fn().mockResolvedValue({ status: "changed" as const }),
    },
  };
}

async function enterValidValues(
  result: Readonly<{ current: PasswordChangeController }>,
) {
  await act(() => result.current.onChangeCurrentPassword("Temporary1"));
  await act(() => result.current.onChangePassword("NewPassword1"));
  await act(() =>
    result.current.onChangePasswordConfirmation("NewPassword1"),
  );
}

function renderController(dependencies = createDependencies()) {
  return renderHook(() => usePasswordChangeController(dependencies));
}

describe("password change controller", () => {
  test("offline rejection shows MSG07, clears secrets, and does not advance the gate", async () => {
    const dependencies = createDependencies();
    dependencies.service.change.mockResolvedValue({ status: "offline" });
    const { result } = await renderController(dependencies);
    await enterValidValues(result);
    await act(() => result.current.submit());
    expect(result.current.feedback?.code).toBe("MSG07");
    expect(result.current.values.password).toBe("");
    expect(dependencies.onChanged).not.toHaveBeenCalled();
    expect(dependencies.onSessionExpired).not.toHaveBeenCalled();
  });

  test("does not turn a navigation callback error into a failed password change", async () => {
    const dependencies = createDependencies();
    dependencies.onChanged.mockImplementation(() => { throw new Error("navigation failed"); });
    const { result } = await renderController(dependencies);
    await enterValidValues(result);
    await act(async () => {
      await expect(result.current.submit()).rejects.toThrow("navigation failed");
    });
    expect(result.current.feedback?.code).toBe("MSG18");
    expect(result.current.values.password).toBe("");
    expect(result.current.pending).toBe(false);
  });

  test("does not invoke navigation when a completed request outlives the screen", async () => {
    const dependencies = createDependencies();
    const completion = deferredResult<PasswordChangeResult>();
    dependencies.service.change.mockReturnValue(completion.promise);
    const { result, unmount } = await renderController(dependencies);
    await enterValidValues(result);
    await act(() => { void result.current.submit(); });
    await unmount();
    await act(() => completion.resolve({ status: "changed" }));
    expect(dependencies.onChanged).not.toHaveBeenCalled();
  });
  test("keeps editable values for local validation correction", async () => {
    const dependencies = createDependencies();
    const { result } = await renderController(dependencies);
    await act(() => result.current.onChangePassword("short"));

    await act(() => result.current.submit());

    expect(dependencies.service.change).not.toHaveBeenCalled();
    expect(result.current.values.password).toBe("short");
    expect(result.current.errors.currentPassword).toBeDefined();
  });

  test("clears every secret after a terminal rejection", async () => {
    const dependencies = createDependencies();
    dependencies.service.change.mockResolvedValue({
      status: "current-password-invalid",
    });
    const { result } = await renderController(dependencies);
    await enterValidValues(result);

    await act(() => result.current.submit());

    expect(result.current.values).toEqual({
      currentPassword: "",
      password: "",
      passwordConfirmation: "",
    });
    expect(result.current.feedback?.code).toBe("MSG17");
  });

  test("prevents duplicate submit while the service request is pending", async () => {
    const dependencies = createDependencies();
    let resolveChange: ((value: { status: "changed" }) => void) | undefined;
    dependencies.service.change.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveChange = resolve;
        }),
    );
    const { result } = await renderController(dependencies);
    await enterValidValues(result);

    await act(() => {
      void result.current.submit();
      void result.current.submit();
    });
    expect(dependencies.service.change).toHaveBeenCalledTimes(1);
    expect(result.current.pending).toBe(true);

    await act(() => resolveChange?.({ status: "changed" }));
    await waitFor(() => expect(result.current.pending).toBe(false));
    expect(dependencies.onChanged).toHaveBeenCalledTimes(1);
    expect(result.current.values.currentPassword).toBe("");
  });

  test("delegates session expiry after clearing secrets", async () => {
    const dependencies = createDependencies();
    dependencies.service.change.mockResolvedValue({
      status: "session-expired",
    });
    const { result } = await renderController(dependencies);
    await enterValidValues(result);

    await act(() => result.current.submit());

    expect(result.current.feedback?.code).toBe("MSG19");
    expect(result.current.values.password).toBe("");
    expect(dependencies.onSessionExpired).toHaveBeenCalledTimes(1);
  });
});
