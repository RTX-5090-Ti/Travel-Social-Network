import { Navigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import AuthLoadingScreen from "../auth/AuthLoadingScreen";

export default function PublicRoute({ children }) {
  const { bootstrapping, isAuthenticated } = useAuth();

  if (bootstrapping) {
    return <AuthLoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}
