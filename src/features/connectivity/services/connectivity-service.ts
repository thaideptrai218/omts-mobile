import type {
  ConnectivityListener,
  ConnectivityRepository,
} from "@/features/connectivity/repositories/connectivity-repository";

export class ConnectivityService {
  constructor(private readonly repository: ConnectivityRepository) {}

  getCurrentStatus() {
    return this.repository.getCurrentStatus();
  }

  subscribe(listener: ConnectivityListener) {
    return this.repository.subscribe(listener);
  }
}
