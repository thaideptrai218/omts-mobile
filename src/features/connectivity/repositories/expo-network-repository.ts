import * as Network from "expo-network";

import { toConnectivityStatus } from "@/features/connectivity/domain/connectivity";
import type {
  ConnectivityListener,
  ConnectivityRepository,
} from "@/features/connectivity/repositories/connectivity-repository";

export const expoNetworkRepository: ConnectivityRepository = {
  async getCurrentStatus() {
    const networkState = await Network.getNetworkStateAsync();
    return toConnectivityStatus(networkState);
  },

  subscribe(listener: ConnectivityListener) {
    const subscription = Network.addNetworkStateListener((networkState) => {
      listener(toConnectivityStatus(networkState));
    });

    return () => subscription.remove();
  },
};
