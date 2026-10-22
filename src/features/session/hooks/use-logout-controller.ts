import { useCallback, useState } from "react";

import type { ConnectivityStatus } from "@/features/connectivity/domain/connectivity";
import type { LogoutResult } from "@/features/session/domain/logout";
import type { LogoutService } from "@/features/session/services/logout-service";
import { useRequestScope } from "@/shared/hooks/use-request-scope";

type LogoutControllerDependencies = Readonly<{
  logoutService: LogoutService;
  onLoggedOut: (result: LogoutResult) => void;
  onUnexpectedError?: () => void;
}>;

export function useLogoutController({
  logoutService,
  onLoggedOut,
  onUnexpectedError,
}: LogoutControllerDependencies) {
  const requestScope = useRequestScope(logoutService);
  const [confirming, setConfirming] = useState(false);
  const [visible, setVisible] = useState(false);

  const open = useCallback(() => {
    if (!requestScope.isBlocked()) setVisible(true);
  }, [requestScope]);

  const cancel = useCallback(() => {
    if (!requestScope.isBlocked()) setVisible(false);
  }, [requestScope]);

  const confirm = useCallback(
    async (connectivity: ConnectivityStatus) => {
      const request = requestScope.begin();
      if (!request) return;
      setConfirming(true);

      let result: LogoutResult;
      try {
        result = await logoutService.logout(connectivity);
      } catch {
        if (!request.isActive()) return;
        setConfirming(false);
        onUnexpectedError?.();
        return;
      } finally {
        request.finish();
      }
      if (!request.isActive()) return;
      setConfirming(false);
      setVisible(false);
      onLoggedOut(result);
    },
    [logoutService, onLoggedOut, onUnexpectedError, requestScope],
  );

  return { cancel, confirm, confirming, open, visible } as const;
}
