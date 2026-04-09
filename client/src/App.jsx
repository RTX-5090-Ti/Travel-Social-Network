import { BrowserRouter } from "react-router-dom";
import ToastViewport from "./components/toast/ToastViewport";
import AuthEventBridge from "./components/auth/AuthEventBridge";
import AppRoutes from "./components/routes/AppRoutes";
import { TripOverlayProvider } from "./trip-overlay/TripOverlayContext";

export default function App() {
  return (
    <BrowserRouter>
      <TripOverlayProvider>
        <AuthEventBridge />
        <ToastViewport />
        <AppRoutes />
      </TripOverlayProvider>
    </BrowserRouter>
  );
}
