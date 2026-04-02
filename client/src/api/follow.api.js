import { api } from "./axios";

export const followApi = {
  getSummary() {
    return api.get("/api/follow/summary");
  },

  listFollowers() {
    return api.get("/api/follow/followers");
  },

  listFollowing() {
    return api.get("/api/follow/following");
  },

  getStatus(userId) {
    return api.get(`/api/follow/${userId}/status`);
  },

  follow(userId) {
    return api.post(`/api/follow/${userId}`);
  },

  unfollow(userId) {
    return api.delete(`/api/follow/${userId}`);
  },
};
