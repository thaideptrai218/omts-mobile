import AppProviders from "@/contexts/AppProviders";
import { AppCrash } from "@/components/AppCrash/AppCrash";
import { ErrorBoundary } from "@/components/ErrorBoundary/ErrorBoundary";
import MainLayout from "@/layouts/MainLayout";
import AppRoutes from "@/routes/AppRoutes";

function App() {
  return (
    <AppProviders>
      {/* Lưới cuối: lỗi ở khung app (ngoài từng màn) cũng không để lại màn trắng. Lỗi của từng màn chặn ở AppRoutes. */}
      <ErrorBoundary fallback={() => <AppCrash />}>
        <MainLayout>
          <AppRoutes />
        </MainLayout>
      </ErrorBoundary>
    </AppProviders>
  );
}

export default App;
