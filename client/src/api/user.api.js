import { api } from "./axios";

export const userApi = {
  listMyTrips(params = {}) {
    return api.get("/api/users/me/trips", { params });
  },

  getProfile(userId, params = {}) {
    return api.get(`/api/users/${userId}/profile`, { params });
  },

  getSummary(userId) {
    return api.get(`/api/users/${userId}/summary`);
  },
};
