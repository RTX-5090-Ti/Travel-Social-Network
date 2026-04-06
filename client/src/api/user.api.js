import { api } from "./axios";

export const userApi = {
  listMyTrips(params = {}) {
    return api.get("/api/users/me/trips", { params });
  },

  updateProfile(payload) {
    return api.patch("/api/users/me/profile", payload);
  },

  getProfile(userId, params = {}) {
    return api.get(`/api/users/${userId}/profile`, { params });
  },

  getSummary(userId) {
    return api.get(`/api/users/${userId}/summary`);
  },
};
