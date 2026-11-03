import AppProviders from "@/contexts/AppProviders";
import MainLayout from "@/layouts/MainLayout";
import AppRoutes from "@/routes/AppRoutes";

function App() {
  return (
    <AppProviders>
      <MainLayout>
        <AppRoutes />
      </MainLayout>
    </AppProviders>
  );
}

export default App;
