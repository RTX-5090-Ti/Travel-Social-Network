import { Navigate } from "react-router-dom";

import { useAuth } from "../../auth/useAuth";
import AuthLoadingScreen from "../auth/AuthLoadingScreen";

export default function AdminRoute({ children }) {
  const { bootstrapping, isAuthenticated, user } = useAuth();

  if (bootstrapping) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}
