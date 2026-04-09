import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./auth/AuthContext";
import { NotificationProvider } from "./notifications/NotificationContext";
import { ToastProvider } from "./toast/ToastContext";

createRoot(document.getElementById("root")).render(
  <ToastProvider>
    <AuthProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </AuthProvider>
  </ToastProvider>,
);
