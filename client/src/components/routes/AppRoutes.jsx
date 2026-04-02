import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../../pages/LoginPage";
import FeedPage from "../../pages/FeedPage";
import ProfilePage from "../../pages/ProfilePage";
import ProtectedRoute from "../../components/routes/ProtectedRoute";
import PublicRoute from "../../components/routes/PublicRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <FeedPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
