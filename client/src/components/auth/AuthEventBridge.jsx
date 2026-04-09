import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { useToast } from "../../toast/useToast";

export default function AuthEventBridge() {
  const navigate = useNavigate();
  const { user, clearAuth, bootstrapping } = useAuth();
  const { showToast } = useToast();
  const lastExpiredAtRef = useRef(0);

  useEffect(() => {
    function handleExpired(event) {
      if (bootstrapping) {
        return;
      }

      const hadUser = !!user;
      clearAuth();

      const message =
        event?.detail?.message ||
        "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";

      const now = Date.now();
      const duplicatedTooSoon = now - lastExpiredAtRef.current < 1200;

      if (hadUser && !duplicatedTooSoon) {
        lastExpiredAtRef.current = now;
        showToast(message, "warning");
      }

      navigate("/login", { replace: true });
    }

    window.addEventListener("auth:expired", handleExpired);

    return () => {
      window.removeEventListener("auth:expired", handleExpired);
    };
  }, [bootstrapping, user, clearAuth, navigate, showToast]);

  return null;
}
