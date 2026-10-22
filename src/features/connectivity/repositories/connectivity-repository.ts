import type { ConnectivityStatus } from "@/features/connectivity/domain/connectivity";

export type ConnectivityListener = (status: ConnectivityStatus) => void;

export interface ConnectivityRepository {
  getCurrentStatus(): Promise<ConnectivityStatus>;
  subscribe(listener: ConnectivityListener): () => void;
}
