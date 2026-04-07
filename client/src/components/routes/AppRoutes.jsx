import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AuthLoadingScreen from "../auth/AuthLoadingScreen";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";

const LoginPage = lazy(() => import("../../pages/LoginPage"));
const FeedPage = lazy(() => import("../../pages/FeedPage"));
const ProfilePage = lazy(() => import("../../pages/ProfilePage"));
const ArchivePage = lazy(() => import("../../pages/ArchivePage"));

export default function AppRoutes() {
  return (
    <Suspense fallback={<AuthLoadingScreen />}>
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

        <Route
          path="/profile/:userId"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/archive"
          element={
            <ProtectedRoute>
              <ArchivePage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
