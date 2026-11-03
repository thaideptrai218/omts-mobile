import type { ReactNode } from "react";
import { ZMPRouter } from "zmp-ui";

import BottomNav from "@/components/BottomNav/BottomNav";
import OfflineBanner from "@/components/OfflineBanner/OfflineBanner";
import Splash from "@/components/Splash/Splash";
import SessionGuard from "@/features/auth/components/SessionGuard/SessionGuard";

/** Khung chung: theo dõi phiên, trạng thái mạng và thanh điều hướng của Mini App. */
function MainLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ZMPRouter>
        <SessionGuard />
        <OfflineBanner />
        {children}
        <BottomNav />
      </ZMPRouter>
      <Splash />
    </>
  );
}

export default MainLayout;
