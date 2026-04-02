import { api } from "./axios";

export const tripApi = {
  create(payload) {
    return api.post("/api/trips", payload);
  },

  getDetail(id) {
    return api.get(`/api/trips/${id}`);
  },

  toggleReaction(id) {
    return api.put(`/api/trips/${id}/reaction`);
  },
  listComments(id, params = {}) {
    return api.get(`/api/trips/${id}/comments`, { params });
  },

  createComment(id, payload) {
    return api.post(`/api/trips/${id}/comments`, payload);
  },
};
