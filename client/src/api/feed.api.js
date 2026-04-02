import { api } from "./axios";

export const feedApi = {
  list(params = {}) {
    return api.get("/api/feed", { params });
  },
};
