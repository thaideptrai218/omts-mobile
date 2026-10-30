// ZaUI stylesheet
import "zmp-ui/zaui.css";
// Tailwind stylesheet
import "@/shared/styles/tailwind.scss";
// Your stylesheet
import "@/shared/styles/app.scss";

// React core
import React from "react";
import { createRoot } from "react-dom/client";

// Mount the app
import Layout from "@/app/layout";
import { startConnectivityWatch } from "@/shared/platform/connectivity";
import { restoreSession } from "@/shared/auth/session";

// Expose app configuration
import appConfig from "../app-config.json";

if (!window.APP_CONFIG) {
  window.APP_CONFIG = appConfig as unknown as Window["APP_CONFIG"];
}

// Phiên đã lưu được đọc trước khi render để màn đầu tiên đã đúng trạng thái đăng nhập, không nháy.
restoreSession();
startConnectivityWatch();

const root = createRoot(document.getElementById("app")!);
root.render(React.createElement(Layout));
