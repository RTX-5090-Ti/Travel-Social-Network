import { api } from "./axios";

export const userApi = {
  listMyTrips(params = {}) {
    return api.get("/api/users/me/trips", { params });
  },

  updateProfile(payload) {
    return api.patch("/api/users/me/profile", payload);
  },

  updateCover(formData) {
    return api.patch("/api/users/me/cover", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  getProfile(userId, params = {}) {
    return api.get(`/api/users/${userId}/profile`, { params });
  },

  getProfileMedia(userId, params = {}) {
    return api.get(`/api/users/${userId}/media`, { params });
  },

  getSummary(userId) {
    return api.get(`/api/users/${userId}/summary`);
  },
};
