import { api } from "./axios";

export const followApi = {
  getSummary() {
    return api.get("/api/follow/summary");
  },

  listMutuals(params = {}) {
    return api.get("/api/follow/mutuals", { params });
  },

  listMyFollowers(params = {}) {
    return api.get("/api/follow/followers", { params });
  },

  listMyFollowing(params = {}) {
    return api.get("/api/follow/following", { params });
  },

  listFollowersByUserId(userId, params = {}) {
    return api.get(`/api/follow/users/${userId}/followers`, { params });
  },

  listFollowingByUserId(userId, params = {}) {
    return api.get(`/api/follow/users/${userId}/following`, { params });
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
