import { api } from "./axios";

export const adminApi = {
  getDashboard() {
    return api.get("/api/admin/dashboard");
  },

  listUsers(params = {}) {
    return api.get("/api/admin/users", { params });
  },

  updateUserState(userId, payload) {
    return api.patch(`/api/admin/users/${userId}/state`, payload);
  },

  listTrips(params = {}) {
    return api.get("/api/admin/trips", { params });
  },

  updateTripState(tripId, payload) {
    return api.patch(`/api/admin/trips/${tripId}/state`, payload);
  },
};
