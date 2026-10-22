import { Text, View } from "react-native";
import {
  act,
  render,
  screen,
} from "@testing-library/react-native";
import {
  SafeAreaProvider,
  type Metrics,
} from "react-native-safe-area-context";

import { OfflineBanner } from "@/features/connectivity/components/offline-banner";
import {
  toConnectivityStatus,
  type ConnectivityStatus,
} from "@/features/connectivity/domain/connectivity";
import {
  ConnectivityProvider,
  type ConnectivityStatusSource,
  useConnectivity,
} from "@/features/connectivity/state/connectivity-provider";

const testSafeAreaMetrics: Metrics = {
  frame: { height: 800, width: 400, x: 0, y: 0 },
  insets: { bottom: 0, left: 0, right: 0, top: 24 },
};

function ConnectivityProbe() {
  const { status } = useConnectivity();

  return (
    <View>
      <Text>{status}</Text>
      <OfflineBanner />
    </View>
  );
}

describe("connectivity domain", () => {
  test.each([
    [{ isConnected: false }, "offline"],
    [{ isConnected: true }, "online"],
    [{ isInternetReachable: false }, "offline"],
    [{ isInternetReachable: true }, "online"],
    [{}, "unknown"],
  ] as const)("maps snapshot %j to %s", (snapshot, expected) => {
    expect(toConnectivityStatus(snapshot)).toBe(expected);
  });

  test("offline evidence wins when snapshot fields conflict", () => {
    expect(
      toConnectivityStatus({
        isConnected: true,
        isInternetReachable: false,
      }),
    ).toBe("offline");
  });
});

describe("ConnectivityProvider", () => {
  test("keeps a live update when an older initial lookup finishes later", async () => {
    let emitStatus: (status: ConnectivityStatus) => void = () => undefined;
    let resolveInitial: (status: ConnectivityStatus) => void = () => undefined;
    const unsubscribe = jest.fn();
    const service: ConnectivityStatusSource = {
      getCurrentStatus: jest.fn(
        () =>
          new Promise((resolve) => {
            resolveInitial = resolve;
          }),
      ),
      subscribe: jest.fn((listener) => {
        emitStatus = listener;
        return unsubscribe;
      }),
    };

    const rendered = await render(
      <SafeAreaProvider initialMetrics={testSafeAreaMetrics}>
        <ConnectivityProvider service={service}>
          <ConnectivityProbe />
        </ConnectivityProvider>
      </SafeAreaProvider>,
    );

    expect(screen.getByText("unknown")).toBeOnTheScreen();

    await act(() => emitStatus("offline"));
    expect(screen.getByText("offline")).toBeOnTheScreen();
    expect(
      screen.getByRole("alert", {
        name: /Không có kết nối/,
      }),
    ).toBeOnTheScreen();

    await act(() => resolveInitial("online"));
    expect(screen.getByText("offline")).toBeOnTheScreen();

    await rendered.unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  test("does not show an offline alert for a confirmed online status", async () => {
    const service: ConnectivityStatusSource = {
      getCurrentStatus: jest.fn().mockResolvedValue("online"),
      subscribe: jest.fn(() => jest.fn()),
    };

    await render(
      <SafeAreaProvider initialMetrics={testSafeAreaMetrics}>
        <ConnectivityProvider service={service}>
          <ConnectivityProbe />
        </ConnectivityProvider>
      </SafeAreaProvider>,
    );

    expect(await screen.findByText("online")).toBeOnTheScreen();
    expect(screen.queryByRole("alert")).not.toBeOnTheScreen();
  });
});
