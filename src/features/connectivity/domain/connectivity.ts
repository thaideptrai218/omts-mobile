export type ConnectivityStatus = "offline" | "online" | "unknown";

export type ConnectivitySnapshot = Readonly<{
  isConnected?: boolean;
  isInternetReachable?: boolean;
}>;

export function toConnectivityStatus(
  snapshot: ConnectivitySnapshot,
): ConnectivityStatus {
  if (
    snapshot.isConnected === false ||
    snapshot.isInternetReachable === false
  ) {
    return "offline";
  }

  if (
    snapshot.isConnected === true ||
    snapshot.isInternetReachable === true
  ) {
    return "online";
  }

  return "unknown";
}
