import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useRecoveryNewPasswordController } from "@/features/recovery/hooks/use-recovery-new-password-controller";
import { deferredResult } from "@/shared/testing/deferred-result";
import type { RecoveryCompletionResult } from "@/features/recovery/services/recovery-completion-service";

type RecoveryController = ReturnType<typeof useRecoveryNewPasswordController>;

function createDependencies() {
  return {
    onCompleted: jest.fn(),
    service: {
      complete: jest.fn().mockResolvedValue({ status: "completed" as const }),
    },
  };
}

function renderController(dependencies = createDependencies()) {
  return renderHook(() => useRecoveryNewPasswordController(dependencies));
}

async function enterValidValues(
  result: Readonly<{ current: RecoveryController }>,
) {
  await act(() => result.current.onChangePassword("NewPassword1"));
  await act(() =>
    result.current.onChangePasswordConfirmation("NewPassword1"),
  );
}

describe("recovery new-password controller", () => {
  test("does not report a service failure when the completion callback throws", async () => {
    const dependencies = createDependencies();
    dependencies.onCompleted.mockImplementation(() => { throw new Error("navigation failed"); });
    const { result } = await renderController(dependencies);
    await enterValidValues(result);
    await act(async () => {
      await expect(result.current.submit()).rejects.toThrow("navigation failed");
    });
    expect(result.current.feedback).toBeNull();
    expect(result.current.values.password).toBe("");
    expect(result.current.pending).toBe(false);
  });

  test("ignores completion after the screen unmounts", async () => {
    const dependencies = createDependencies();
    const completion = deferredResult<RecoveryCompletionResult>();
    dependencies.service.complete.mockReturnValue(completion.promise);
    const { result, unmount } = await renderController(dependencies);
    await enterValidValues(result);
    await act(() => { void result.current.submit(); });
    await unmount();
    await act(() => completion.resolve({ status: "completed" }));
    expect(dependencies.onCompleted).not.toHaveBeenCalled();
  });
  test("keeps local validation values so the user can correct them", async () => {
    const dependencies = createDependencies();
    const { result } = await renderController(dependencies);
    await act(() => result.current.onChangePassword("short"));

    await act(() => result.current.submit());

    expect(dependencies.service.complete).not.toHaveBeenCalled();
    expect(result.current.values.password).toBe("short");
    expect(result.current.errors.password).toBeDefined();
  });

  test("passes only the new password to a service already bound to recovery proof", async () => {
    const dependencies = createDependencies();
    const { result } = await renderController(dependencies);
    await enterValidValues(result);

    await act(() => result.current.submit());

    expect(dependencies.service.complete).toHaveBeenCalledWith({
      newPassword: "NewPassword1",
    });
    expect(dependencies.onCompleted).toHaveBeenCalledTimes(1);
    expect(result.current.values.password).toBe("");
  });

  test("clears secrets and shows MSG16 when the recovery attempt is invalid", async () => {
    const dependencies = createDependencies();
    dependencies.service.complete.mockResolvedValue({
      status: "attempt-invalid",
    });
    const { result } = await renderController(dependencies);
    await enterValidValues(result);

    await act(() => result.current.submit());

    expect(result.current.feedback?.code).toBe("MSG16");
    expect(result.current.values).toEqual({
      password: "",
      passwordConfirmation: "",
    });
  });

  test("prevents duplicate completion requests", async () => {
    const dependencies = createDependencies();
    let complete: ((value: { status: "completed" }) => void) | undefined;
    dependencies.service.complete.mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    const { result } = await renderController(dependencies);
    await enterValidValues(result);

    await act(() => {
      void result.current.submit();
      void result.current.submit();
    });
    expect(dependencies.service.complete).toHaveBeenCalledTimes(1);
    expect(result.current.pending).toBe(true);

    await act(() => complete?.({ status: "completed" }));
    await waitFor(() => expect(result.current.pending).toBe(false));
  });
});
