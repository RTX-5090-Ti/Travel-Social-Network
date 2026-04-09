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
};
