import { useAtomValue } from "jotai";
import { useLayoutEffect } from "react";
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
import OfflineBanner from "@/components/offline-banner";
import SessionGuard from "@/components/session-guard";
import Splash from "@/components/splash";
import AccountPage from "@/pages/account";
import NotificationPreferencesPage from "@/pages/account/notification-preferences";
import ProfilePage from "@/pages/account/profile";
import TraderRequestsPage from "@/pages/account/trader-requests";
import LinkAccountPage from "@/pages/auth/link";
import FeaturePage from "@/pages/feature";
import HomePage from "@/pages/index";
import NotificationsPage from "@/pages/notifications";
import TracePage from "@/pages/trace";
import { textSizeAtom } from "@/state/text-size";

const Layout = () => {
  const textSize = useAtomValue(textSizeAtom);

  // Cỡ chữ đặt ở thẻ <html> để mọi kích thước tính bằng rem trong app.scss đổi theo.
  useLayoutEffect(() => {
    document.documentElement.dataset.textSize = textSize;
  }, [textSize]);

  return (
    <App theme={getSystemInfo().zaloTheme as AppProps["theme"]}>
      <SnackbarProvider>
        <ZMPRouter>
          {/* Điều hướng theo phiên: màn bảo vệ, phiên hết hạn (MSG19). */}
          <SessionGuard />
          <OfflineBanner />
          <AnimationRoutes>
            {/* Công khai: truy xuất không cần đăng nhập (quy định của Zalo). */}
            <Route path="/" element={<HomePage />}></Route>
            <Route path="/trace" element={<TracePage />}></Route>
            <Route path="/notifications" element={<NotificationsPage />}></Route>
            <Route path="/account" element={<AccountPage />}></Route>
            <Route path="/feature/:key" element={<FeaturePage />}></Route>
            {/* Tài khoản: chỉ vào bằng liên kết tài khoản qua số điện thoại Zalo, không có mật khẩu hay mã xác minh. */}
            <Route path="/link" element={<LinkAccountPage />}></Route>
            <Route path="/account/profile" element={<ProfilePage />}></Route>
            <Route path="/account/notifications" element={<NotificationPreferencesPage />}></Route>
            <Route path="/account/trader-requests" element={<TraderRequestsPage />}></Route>
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
