import { getSystemInfo } from "zmp-sdk";
import {
  AnimationRoutes,
  App,
  Route,
  SnackbarProvider,
  ZMPRouter,
} from "zmp-ui";
import { AppProps } from "zmp-ui/app";

import BottomNav from "@/components/bottom-nav";
import Splash from "@/components/splash";
import AccountPage from "@/pages/account";
import FeaturePage from "@/pages/feature";
import HomePage from "@/pages/index";
import NotificationsPage from "@/pages/notifications";
import TracePage from "@/pages/trace";

const Layout = () => {
  return (
    <App theme={getSystemInfo().zaloTheme as AppProps["theme"]}>
      <SnackbarProvider>
        <ZMPRouter>
          <AnimationRoutes>
            <Route path="/" element={<HomePage />}></Route>
            <Route path="/trace" element={<TracePage />}></Route>
            <Route path="/notifications" element={<NotificationsPage />}></Route>
            <Route path="/account" element={<AccountPage />}></Route>
            <Route path="/feature/:key" element={<FeaturePage />}></Route>
          </AnimationRoutes>
          <BottomNav />
        </ZMPRouter>
      </SnackbarProvider>
      {/* Trang chính đã render sẵn bên dưới; splash phủ lên rồi mờ dần. */}
      <Splash />
    </App>
  );
};
export default Layout;
