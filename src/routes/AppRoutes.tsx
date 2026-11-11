import { AnimationRoutes, Route } from "zmp-ui";

import AccountPage from "@/features/account/pages/AccountPage";
import ProfilePage from "@/features/account/pages/ProfilePage";
import LinkAccountPage from "@/features/auth/pages/LinkAccountPage";
import NotificationsPage from "@/features/notifications/pages/InboxPage";
import NotificationPreferencesPage from "@/features/notifications/pages/PreferencesPage";
import TraderRequestsPage from "@/features/organization/pages/TraderRequestsPage";
import TracePage from "@/features/traceability/pages/TracePage";
import FeaturePage from "@/pages/FeaturePage";
import HomePage from "@/pages/HomePage";
import MenuGroupPage from "@/pages/MenuGroupPage";
import { ROUTES as FARM_ROUTES } from "@/routes/farmingRoutes";
import { ROUTES as ORG_ROUTES } from "@/routes/organizationRoutes";
import { ROUTES as PURCHASING_ROUTES } from "@/routes/purchasingRoutes";
import { ROUTES as DEVELOPMENT_ROUTES } from "@/routes/developmentRoutes";
import { ROUTES as SALES_ROUTES } from "@/routes/salesRoutes";
import { ROUTES as WORKFORCE_ROUTES } from "@/routes/workforceRoutes";

function AppRoutes() {
  return (
    <AnimationRoutes>
      {/* Truy xuất công khai; các chức năng nội bộ tiếp tục được kiểm tra phiên và quyền. */}
      <Route path="/" element={<HomePage />} />
      <Route path="/trace" element={<TracePage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/menu/:group" element={<MenuGroupPage />} />
      <Route path="/feature/:key" element={<FeaturePage />} />
      <Route path="/link" element={<LinkAccountPage />} />
      <Route path="/account/profile" element={<ProfilePage />} />
      <Route path="/account/notifications" element={<NotificationPreferencesPage />} />
      <Route path="/account/trader-requests" element={<TraderRequestsPage />} />
      {[...FARM_ROUTES, ...PURCHASING_ROUTES, ...ORG_ROUTES, ...SALES_ROUTES, ...WORKFORCE_ROUTES, ...DEVELOPMENT_ROUTES].map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}
    </AnimationRoutes>
  );
}

export default AppRoutes;
