import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { ConnectivityStatus } from "@/features/connectivity/domain/connectivity";
import { connectivityService } from "@/features/connectivity/services/connectivity-service.instance";
import type { ConnectivityService } from "@/features/connectivity/services/connectivity-service";

type ConnectivityContextValue = Readonly<{
  status: ConnectivityStatus;
}>;

export type ConnectivityStatusSource = Pick<
  ConnectivityService,
  "getCurrentStatus" | "subscribe"
>;

type ConnectivityProviderProps = PropsWithChildren<{
  service?: ConnectivityStatusSource;
}>;

const ConnectivityContext = createContext<ConnectivityContextValue | null>(
  null,
);

export function ConnectivityProvider({
  children,
  service = connectivityService,
}: ConnectivityProviderProps) {
  const [status, setStatus] = useState<ConnectivityStatus>("unknown");

  useEffect(() => {
    let isActive = true;
    let hasLiveUpdate = false;

    const unsubscribe = service.subscribe((nextStatus) => {
      hasLiveUpdate = true;
      if (isActive) setStatus(nextStatus);
    });

    service
      .getCurrentStatus()
      .then((initialStatus) => {
        if (isActive && !hasLiveUpdate) setStatus(initialStatus);
      })
      .catch(() => {
        if (isActive && !hasLiveUpdate) setStatus("unknown");
      });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [service]);

  const value = useMemo(() => ({ status }), [status]);

  return (
    <ConnectivityContext.Provider value={value}>
      {children}
    </ConnectivityContext.Provider>
  );
}

export function useConnectivity(): ConnectivityContextValue {
  const value = useContext(ConnectivityContext);

  if (!value) {
    throw new Error(
      "useConnectivity must be used inside ConnectivityProvider.",
    );
  }

  return value;
}
