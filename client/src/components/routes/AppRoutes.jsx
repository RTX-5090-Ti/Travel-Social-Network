import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AuthLoadingScreen from "../auth/AuthLoadingScreen";
import AdminRoute from "./AdminRoute";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";

const LoginPage = lazy(() => import("../../pages/LoginPage"));
const FeedPage = lazy(() => import("../../pages/FeedPage"));
const ProfilePage = lazy(() => import("../../pages/ProfilePage"));
const ArchivePage = lazy(() => import("../../pages/ArchivePage"));
const SettingsPage = lazy(() => import("../../pages/SettingsPage"));
const AdminLayout = lazy(() => import("../admin/AdminLayout"));
const AdminDashboardPage = lazy(() => import("../../pages/AdminDashboardPage"));
const AdminUsersPage = lazy(() => import("../../pages/AdminUsersPage"));
const AdminTripsPage = lazy(() => import("../../pages/AdminTripsPage"));

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

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="trips" element={<AdminTripsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
