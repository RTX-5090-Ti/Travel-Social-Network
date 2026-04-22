import { Navigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import AuthLoadingScreen from "../auth/AuthLoadingScreen";

export default function ProtectedRoute({ children }) {
  const { bootstrapping, isAuthenticated } = useAuth();

  // còn đang kiểm tra
  if (bootstrapping) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
