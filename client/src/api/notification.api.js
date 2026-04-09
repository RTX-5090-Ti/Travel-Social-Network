import { api } from "./axios";

export const notificationApi = {
  list(params = {}) {
    return api.get("/api/notifications", { params });
  },

  getSummary() {
    return api.get("/api/notifications/summary");
  },

  markAllRead() {
    return api.post("/api/notifications/read-all");
  },

  deleteSelected(notificationIds = []) {
    return api.post("/api/notifications/delete-selected", {
      notificationIds,
    });
  },

  deleteAll() {
    return api.post("/api/notifications/delete-all");
  },
};
