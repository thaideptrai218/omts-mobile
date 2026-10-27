import { defineConfig } from "vite";
import zaloMiniApp from "zmp-vite-plugin";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default () => {
  return defineConfig({
    root: "./src",
    base: "",
    // File .env nằm ở thư mục gốc dự án (root của Vite là ./src). Chỉ biến VITE_* vào bundle.
    envDir: "..",
    plugins: [zaloMiniApp(), react()],
    build: {
      assetsInlineLimit: 0,
    },
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    server: {
      // Khi dev, request /api đi qua dev server tới OMTS.Api chạy local để không vướng CORS.
      // Trong Zalo, app gọi thẳng VITE_API_BASE_URL (HTTPS, backend phải cho origin https://h5.zdn.vn).
      proxy: {
        "/api": {
          target: process.env.API_PROXY_TARGET || "http://localhost:5198",
          changeOrigin: true,
        },
      },
    },
  });
};
