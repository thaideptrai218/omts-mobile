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

import BottomNav from "@/app/components/bottom-nav";
import OfflineBanner from "@/app/components/offline-banner";
import SessionGuard from "@/app/session-guard";
import Splash from "@/app/components/splash";
import AccountPage from "@/features/account/pages/account-page";
import NotificationPreferencesPage from "@/features/notifications/pages/preferences-page";
import ProfilePage from "@/features/account/pages/profile-page";
import TraderRequestsPage from "@/features/organization/pages/trader-requests";
import LinkAccountPage from "@/features/account/pages/link-page";
import FeaturePage from "@/features/dashboard/pages/unavailable-page";
import HomePage from "@/features/dashboard/pages/home-page";
import { ROUTES as SALES_ROUTES } from "@/features/sales/routes";
import { ROUTES as WORKFORCE_ROUTES } from "@/features/workforce/routes";
import { ROUTES as FARM_ROUTES } from "@/features/farming/routes";
import { ROUTES as ORG_ROUTES } from "@/features/organization/routes";
import { ROUTES as PURCHASING_ROUTES } from "@/features/purchasing/routes";
import NotificationsPage from "@/features/notifications/pages/inbox-page";
import TracePage from "@/features/traceability/pages/trace-page";
import { textSizeAtom } from "@/shared/preferences/text-size";

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
            {/* Quản lý của Chủ HTX: mỗi màn là một file tải riêng khi mở (lazyPage). */}
            {[...FARM_ROUTES, ...PURCHASING_ROUTES, ...ORG_ROUTES, ...SALES_ROUTES, ...WORKFORCE_ROUTES].map((r) => (
              <Route key={r.path} path={r.path} element={r.element}></Route>
            ))}
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
