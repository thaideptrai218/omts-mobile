import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";

import {
  applyNotificationPreferenceSelection,
  listNotificationPreferenceSelections,
  type NotificationPreferenceSelection,
  type NotificationPreferenceSettings,
  type SaveNotificationPreferencesResult,
} from "@/features/notifications/domain/notification-preferences";
import type { PushPermissionState } from "@/features/notifications/domain/push-permission";
import type { PushPermissionRepository } from "@/features/notifications/repositories/push-permission-repository";
import type { NotificationPreferencesService } from "@/features/notifications/services/notification-preferences-service";
import { useRequestScope } from "@/shared/hooks/use-request-scope";
import {
  resolveKnownMessage,
  type ResolvedMessage,
} from "@/shared/messages/message-catalog";

type ReadyControllerState = Readonly<{
  feedback: ResolvedMessage | null;
  pushPermission: PushPermissionState;
  requestingPushPermission: boolean;
  saving: boolean;
  settings: NotificationPreferenceSettings;
  status: "ready";
}>;

export type NotificationPreferencesControllerState =
  | Readonly<{ retrying: boolean; status: "loading" }>
  | Readonly<{ message: string; retrying: boolean; status: "error" }>
  | Readonly<{ status: "session-expired" }>
  | ReadyControllerState;

type ControllerDependencies = Readonly<{
  onSessionExpired: () => void;
  preferencesService: NotificationPreferencesService;
  pushPermissionRepository: PushPermissionRepository;
}>;

function resolvePreferenceMessage(
  message:
    | Readonly<{ code: "MSG19" | "MSG22" | "MSG23" }>
    | Readonly<{ channelName: string; code: "MSG21" }>
    | Readonly<{ code: "MSG10"; objectName: string }>,
): ResolvedMessage {
  if (message.code === "MSG10") {
    return resolveKnownMessage("MSG10", { objectName: message.objectName });
  }
  if (message.code === "MSG21") {
    return resolveKnownMessage("MSG21", { channelName: message.channelName });
  }
  return resolveKnownMessage(message.code);
}

export function useNotificationPreferencesController({
  onSessionExpired,
  preferencesService,
  pushPermissionRepository,
}: ControllerDependencies) {
  const canonicalSettings = useRef<NotificationPreferenceSettings | null>(null);
  const saveScope = useRequestScope(preferencesService, pushPermissionRepository);
  const permissionScope = useRequestScope(preferencesService, pushPermissionRepository);
  const notifyLoadSessionExpired = useEffectEvent(onSessionExpired);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [state, setState] = useState<NotificationPreferencesControllerState>({
    retrying: false,
    status: "loading",
  });

  useEffect(() => {
    let cancelled = false;
    canonicalSettings.current = null;

    Promise.resolve().then(() => {
      if (cancelled) return null;
      setState({ retrying: false, status: "loading" });
      return Promise.all([
        preferencesService.load(),
        pushPermissionRepository.read(),
      ]);
    }).then(
      (result) => {
        if (cancelled || !result) return;
        const [preferences, pushPermission] = result;

        if (preferences.status === "session-expired") {
          canonicalSettings.current = null;
          setState({ status: "session-expired" });
          notifyLoadSessionExpired();
          return;
        }

        canonicalSettings.current = preferences.settings;
        setState({
          feedback: null,
          pushPermission,
          requestingPushPermission: false,
          saving: false,
          settings: preferences.settings,
          status: "ready",
        });
      },
      () => {
        if (cancelled) return;
        setState({
          message: resolveKnownMessage("MSG04", {
            serviceName: "Dịch vụ tùy chọn thông báo",
          }).message,
          retrying: false,
          status: "error",
        });
      },
    );

    return () => {
      cancelled = true;
    };
  }, [loadAttempt, preferencesService, pushPermissionRepository]);

  const load = useCallback(() => {
    if (state.status !== "error" || state.retrying) return;
    setState((current) =>
      current.status === "error"
        ? { ...current, retrying: true }
        : current,
    );
    setLoadAttempt((current) => current + 1);
  }, [state]);

  const change = useCallback((selection: NotificationPreferenceSelection) => {
    if (saveScope.isBlocked()) return;
    setState((current) =>
      current.status !== "ready"
        ? current
        : {
            ...current,
            feedback: null,
            settings: applyNotificationPreferenceSelection(
              current.settings,
              selection,
            ),
          },
    );
  }, [saveScope]);

  const cancel = useCallback(() => {
    if (saveScope.isBlocked()) return false;
    setState((current) =>
      current.status !== "ready" || !canonicalSettings.current
        ? current
        : {
            ...current,
            feedback: null,
            settings: canonicalSettings.current,
          },
    );
    return true;
  }, [saveScope]);

  const save = useCallback(async () => {
    if (state.status !== "ready") return;
    const request = saveScope.begin();
    if (!request) return;
    const settingsBeingSaved = state.settings;
    setState((current) => current.status === "ready"
      ? { ...current, feedback: null, saving: true }
      : current);

    let result: SaveNotificationPreferencesResult;
    try {
      result = await preferencesService.save({
        selections: listNotificationPreferenceSelections(settingsBeingSaved),
      });
    } catch {
      if (!request.isActive()) return;
      setState((current) =>
        current.status === "ready"
          ? {
              ...current,
              feedback: resolveKnownMessage("MSG04", {
                serviceName: "Dịch vụ tùy chọn thông báo",
              }),
              saving: false,
            }
          : current,
      );
      return;
    } finally {
      request.finish();
    }
    if (!request.isActive()) return;

    if (result.status === "session-expired") {
      canonicalSettings.current = null;
      setState({ status: "session-expired" });
      onSessionExpired();
      return;
    }

    if (result.status === "invalid-preference") {
      setState((current) =>
        current.status === "ready"
          ? {
              ...current,
              feedback: resolvePreferenceMessage(result.message),
              saving: false,
            }
          : current,
      );
      return;
    }

    canonicalSettings.current = result.settings;
    setState((current) =>
      current.status === "ready"
        ? {
            ...current,
            feedback: result.warning
              ? resolvePreferenceMessage(result.warning)
              : resolvePreferenceMessage(result.message),
            saving: false,
            settings: result.settings,
          }
        : current,
    );
  }, [onSessionExpired, preferencesService, saveScope, state]);

  const requestPushPermission = useCallback(async () => {
    if (state.status !== "ready") return;
    const request = permissionScope.begin();
    if (!request) return;
    setState((current) => current.status === "ready"
      ? { ...current, feedback: null, requestingPushPermission: true }
      : current);

    try {
      const pushPermission = await pushPermissionRepository.request();
      if (!request.isActive()) return;
      setState((current) =>
        current.status === "ready"
          ? {
              ...current,
              // The permission card explains OS denial. MSG22's saved-channel
              // wording is reserved for an actual preferences-save response.
              feedback: null,
              pushPermission,
              requestingPushPermission: false,
            }
          : current,
      );
    } catch {
      if (!request.isActive()) return;
      setState((current) =>
        current.status === "ready"
          ? {
              ...current,
              feedback: resolveKnownMessage("MSG04", {
                serviceName: "Quyền thông báo của thiết bị",
              }),
              requestingPushPermission: false,
            }
          : current,
      );
    } finally {
      request.finish();
    }
  }, [permissionScope, pushPermissionRepository, state]);

  return {
    cancel,
    change,
    load,
    requestPushPermission,
    save,
    state,
  } as const;
}
