import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./auth/AuthContext";
import { ToastProvider } from "./toast/ToastContext";

createRoot(document.getElementById("root")).render(
  <ToastProvider>
    {/* quản lý toast toàn app  useToast() */}
    <AuthProvider>
      {/* quản lý user/session useAuth() */}
      <App />
    </AuthProvider>
  </ToastProvider>,
);
