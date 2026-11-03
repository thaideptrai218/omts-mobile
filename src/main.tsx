// ZaUI stylesheet
import "zmp-ui/zaui.css";
// Tailwind stylesheet
import "@/assets/styles/tailwind.scss";
// Your stylesheet
import "@/assets/styles/app.scss";

// React core
import React from "react";
import { createRoot } from "react-dom/client";

// Mount the app
import App from "@/App.tsx";
import { startConnectivityWatch } from "@/services/connectivityService";
import { restoreSession } from "@/features/auth/services/sessionService";

// Expose app configuration
import appConfig from "../app-config.json";

if (!window.APP_CONFIG) {
  window.APP_CONFIG = appConfig as unknown as Window["APP_CONFIG"];
}

// Phiên đã lưu được đọc trước khi render để màn đầu tiên đã đúng trạng thái đăng nhập, không nháy.
restoreSession();
startConnectivityWatch();

const root = createRoot(document.getElementById("app")!);
root.render(React.createElement(App));
