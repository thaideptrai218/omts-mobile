import { expoNetworkRepository } from "@/features/connectivity/repositories/expo-network-repository";
import { ConnectivityService } from "@/features/connectivity/services/connectivity-service";

export const connectivityService = new ConnectivityService(
  expoNetworkRepository,
);
