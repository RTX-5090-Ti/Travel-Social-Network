import { api } from "./axios";

export const userApi = {
  listMyTrips(params = {}) {
    return api.get("/api/users/me/trips", { params });
  },
};
