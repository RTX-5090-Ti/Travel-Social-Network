import { BrowserRouter } from "react-router-dom";
import ToastViewport from "./components/toast/ToastViewport";
import AuthEventBridge from "./components/auth/AuthEventBridge";
import AppRoutes from "./components/routes/AppRoutes";

export default function App() {
  return (
    <BrowserRouter>
      <AuthEventBridge />
      <ToastViewport />
      <AppRoutes />
    </BrowserRouter>
  );
}
