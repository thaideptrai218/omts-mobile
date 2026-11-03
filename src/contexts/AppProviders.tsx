import { useAtomValue } from "jotai";
import { type ReactNode, useLayoutEffect } from "react";
import { getSystemInfo } from "zmp-sdk";
import { App as ZauiApp, SnackbarProvider } from "zmp-ui";
import type { AppProps } from "zmp-ui/app";

import { textSizeAtom } from "@/services/textSizeService";

/** Ghép các provider hiện có; Jotai tiếp tục dùng store mặc định của dịch vụ phiên. */
function AppProviders({ children }: { children: ReactNode }) {
  const textSize = useAtomValue(textSizeAtom);

  useLayoutEffect(() => {
    document.documentElement.dataset.textSize = textSize;
  }, [textSize]);

  return (
    <ZauiApp theme={getSystemInfo().zaloTheme as AppProps["theme"]}>
      <SnackbarProvider>{children}</SnackbarProvider>
    </ZauiApp>
  );
}

export default AppProviders;
