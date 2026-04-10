import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./auth/AuthContext";
import { ChatProvider } from "./chat/ChatContext";
import { NotificationProvider } from "./notifications/NotificationContext";
import { SocketProvider } from "./socket/SocketProvider";
import { ThemeProvider } from "./theme/ThemeContext";
import { ToastProvider } from "./toast/ToastContext";

createRoot(document.getElementById("root")).render(
  <ThemeProvider>
    <ToastProvider>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <ChatProvider>
              <App />
            </ChatProvider>
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </ToastProvider>
  </ThemeProvider>,
);
