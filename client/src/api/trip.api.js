import { api } from "./axios";

function getErrorStatus(error) {
  return Number(error?.response?.status || 0);
}

export function isTripUnavailableError(error) {
  const status = getErrorStatus(error);
  return status === 404 || status === 403;
}

export function getTripUnavailableMessage(
  error,
  fallback = "Không tải được chi tiết journey.",
) {
  if (isTripUnavailableError(error)) {
    return "Journey này không còn khả dụng hoặc bạn không có quyền xem.";
  }

  return error?.response?.data?.message || fallback;
}

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
