import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";

import {
  validateProfileForm,
  type ProfileFormErrors,
  type ProfileFormValues,
} from "@/features/profile/domain/profile-form";
import type {
  ProfileService,
  ProfileSnapshot,
} from "@/features/profile/services/profile-service";
import {
  resolveKnownMessage,
  type ResolvedMessage,
} from "@/shared/messages/message-catalog";

type ReadyState = Readonly<{
  conflict: boolean;
  errors: ProfileFormErrors;
  feedback: ResolvedMessage | null;
  profile: ProfileSnapshot;
  reloading: boolean;
  saving: boolean;
  status: "ready";
  values: ProfileFormValues;
}>;

export type ProfileControllerState =
  | Readonly<{ status: "loading" }>
  | Readonly<{ message: string; retrying: boolean; status: "error" }>
  | Readonly<{ status: "session-expired" }>
  | ReadyState;

type Dependencies = Readonly<{
  onSessionExpired: () => void;
  service: ProfileService;
}>;

function readyState(profile: ProfileSnapshot): ReadyState {
  return {
    conflict: false,
    errors: {},
    feedback: null,
    profile,
    reloading: false,
    saving: false,
    status: "ready",
    values: { displayName: profile.displayName },
  };
}

function serviceFailure() {
  return resolveKnownMessage("MSG04", { serviceName: "Dịch vụ hồ sơ cá nhân" });
}

export function useProfileController({
  service,
  onSessionExpired,
}: Dependencies) {
  const requestInFlight = useRef(true);
  const generation = useRef(0);
  const serviceScope = useRef(service);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [state, setState] = useState<ProfileControllerState>({
    status: "loading",
  });
  const notifyLoadSessionExpired = useEffectEvent(onSessionExpired);

  useEffect(() => {
    const activeGeneration = ++generation.current;
    const replacingService = serviceScope.current !== service;
    serviceScope.current = service;
    let cancelled = false;
    requestInFlight.current = true;

    // Normalize synchronous adapter failures to the same safe load error path.
    Promise.resolve()
      .then(() => {
        if (cancelled) return null;
        if (replacingService) setState({ status: "loading" });
        return service.load();
      })
      .then(
        (result) => {
          if (cancelled || !result) return;
          requestInFlight.current = false;
          if (result.status === "offline") {
            const message = resolveKnownMessage("MSG07");
            setState((current) =>
              current.status === "ready"
                ? { ...current, feedback: message, reloading: false }
                : {
                    status: "error",
                    message: message.message,
                    retrying: false,
                  },
            );
            return;
          }
          if (result.status === "session-expired") {
            setState({ status: "session-expired" });
            notifyLoadSessionExpired();
            return;
          }
          setState(readyState(result.profile));
        },
        () => {
          if (cancelled) return;
          requestInFlight.current = false;
          setState((current) => {
            if (current.status === "ready") {
              return {
                ...current,
                feedback: serviceFailure(),
                reloading: false,
              };
            }
            return {
              message: serviceFailure().message,
              retrying: false,
              status: "error",
            };
          });
        },
      );

    return () => {
      cancelled = true;
      generation.current = activeGeneration + 1;
    };
  }, [loadAttempt, service]);

  const reload = useCallback(() => {
    if (requestInFlight.current || state.status === "session-expired") return;
    requestInFlight.current = true;
    setState((current) => {
      if (current.status === "ready") return { ...current, reloading: true };
      if (current.status === "error") return { ...current, retrying: true };
      return current;
    });
    setLoadAttempt((attempt) => attempt + 1);
  }, [state.status]);

  const changeDisplayName = useCallback((displayName: string) => {
    if (requestInFlight.current) return;
    setState((current) => {
      if (current.status !== "ready") return current;
      return {
        ...current,
        errors: {},
        feedback: current.conflict ? current.feedback : null,
        values: { displayName },
      };
    });
  }, []);

  const save = useCallback(async () => {
    if (requestInFlight.current || state.status !== "ready" || state.conflict)
      return;
    const validation = validateProfileForm(state.values);
    if (!validation.isValid) {
      setState({ ...state, errors: validation.errors, feedback: null });
      return;
    }

    const activeGeneration = generation.current;
    requestInFlight.current = true;
    setState({ ...state, errors: {}, feedback: null, saving: true });
    let result;
    try {
      result = await service.save({
        displayName: validation.data.displayName,
        expectedRevision: state.profile.revision,
      });
    } catch {
      if (generation.current !== activeGeneration) return;
      setState({ ...state, feedback: serviceFailure(), saving: false });
      return;
    } finally {
      if (generation.current === activeGeneration)
        requestInFlight.current = false;
    }
    if (generation.current !== activeGeneration) return;

    if (result.status === "session-expired") {
      setState({ status: "session-expired" });
      onSessionExpired();
    } else if (result.status === "saved") {
      setState({
        ...readyState(result.profile),
        feedback: resolveKnownMessage("MSG10", { objectName: "Hồ sơ cá nhân" }),
      });
    } else if (result.status === "conflict") {
      setState({
        ...state,
        conflict: true,
        feedback: resolveKnownMessage("MSG06", {
          userName: result.updatedBy,
          time: result.updatedAt,
        }),
        saving: false,
      });
    } else if (result.status === "offline") {
      setState({
        ...state,
        feedback: resolveKnownMessage("MSG07"),
        saving: false,
      });
    } else {
      setState({
        ...state,
        feedback: resolveKnownMessage("MSG20"),
        saving: false,
      });
    }
  }, [onSessionExpired, service, state]);

  return { changeDisplayName, reload, save, state } as const;
}
