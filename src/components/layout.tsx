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
import ChangePasswordPage from "@/pages/account/change-password";
import NotificationPreferencesPage from "@/pages/account/notification-preferences";
import ProfilePage from "@/pages/account/profile";
import LinkAccountPage from "@/pages/auth/link";
import PhoneGatePage from "@/pages/auth/phone-gate";
import RecoverPage, { RecoverResetPage } from "@/pages/auth/recover";
import VerifyPage from "@/pages/auth/verify";
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
          {/* Điều hướng theo phiên: cổng sau đăng nhập, màn bảo vệ, phiên hết hạn (MSG19). */}
          <SessionGuard />
          <OfflineBanner />
          <AnimationRoutes>
            {/* Công khai: truy xuất không cần đăng nhập (quy định của Zalo). */}
            <Route path="/" element={<HomePage />}></Route>
            <Route path="/trace" element={<TracePage />}></Route>
            <Route path="/notifications" element={<NotificationsPage />}></Route>
            <Route path="/account" element={<AccountPage />}></Route>
            <Route path="/feature/:key" element={<FeaturePage />}></Route>
            {/* Tài khoản (ACS-01…07): vào bằng liên kết tài khoản Zalo, không có form mật khẩu. */}
            <Route path="/link" element={<LinkAccountPage />}></Route>
            <Route path="/verify" element={<VerifyPage />}></Route>
            <Route path="/recover" element={<RecoverPage />}></Route>
            <Route path="/recover/reset" element={<RecoverResetPage />}></Route>
            <Route path="/gate/password" element={<ChangePasswordPage forced />}></Route>
            <Route path="/gate/phone" element={<PhoneGatePage />}></Route>
            <Route path="/account/profile" element={<ProfilePage />}></Route>
            <Route path="/account/password" element={<ChangePasswordPage />}></Route>
            <Route path="/account/notifications" element={<NotificationPreferencesPage />}></Route>
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
