import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["www", "dist", "node_modules"] },
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    files: ["src/services/**/*.ts", "src/features/*/services/**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        { selector: "TSTypeAliasDeclaration", message: "Tách kiểu dữ liệu sang models/ rồi import type vào service." },
        { selector: "TSInterfaceDeclaration", message: "Tách hợp đồng dữ liệu sang models/ rồi import type vào service." },
        { selector: "TSTypeLiteral", message: "Đặt kiểu request/response có tên trong models/ thay vì viết trực tiếp trong service." },
      ],
    },
  },
  {
    files: ["src/models/**/*.ts", "src/features/*/models/**/*.ts"],
    rules: {
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "no-restricted-syntax": [
        "error",
        { selector: "Program > :not(ImportDeclaration):not(ExportNamedDeclaration):not(TSTypeAliasDeclaration):not(TSInterfaceDeclaration)", message: "models/ chỉ chứa khai báo kiểu và import type; đặt logic hoặc dữ liệu chạy ở nơi sử dụng." },
        { selector: "ExportNamedDeclaration > :not(TSTypeAliasDeclaration):not(TSInterfaceDeclaration)", message: "Chỉ export kiểu dữ liệu trong models/; không export logic, dữ liệu chạy hoặc barrel." },
      ],
      "no-restricted-imports": ["error", { patterns: [{ group: ["@/services/*", "@/features/*/services/*", "@/pages/*", "@/features/*/pages/*", "@/hooks/*", "@/features/*/hooks/*", "@/layouts/*", "@/routes/*", "@/contexts/*"], message: "Model chỉ khai báo dữ liệu và phụ thuộc kiểu; không phụ thuộc service, hook hoặc màn hình." }] }],
    },
  },
  {
    files: ["src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [{ group: ["@/features/*", "@/layouts/*", "@/pages/*", "@/routes/*", "@/contexts/*", "@/App", "@/App.tsx", "@/app", "@/main"], message: "Component dùng chung nhận dữ liệu và giao diện nghiệp vụ qua props." }] }],
    },
  },
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [{ group: ["@/layouts/*", "@/pages/*", "@/routes/*", "@/contexts/*", "@/App", "@/App.tsx", "@/app", "@/main"], message: "Feature giữ nghiệp vụ; layout và router ở cấp ứng dụng ghép các feature." }] }],
    },
  },
);
