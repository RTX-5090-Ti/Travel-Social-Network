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

  updateTrip(id, payload) {
    return api.patch(`/api/trips/${id}`, payload);
  },

  updatePrivacy(id, payload) {
    return api.patch(`/api/trips/${id}/privacy`, payload);
  },

  pinTrip(id) {
    return api.put(`/api/trips/${id}/pin`);
  },

  unpinTrip(id) {
    return api.delete(`/api/trips/${id}/pin`);
  },

  moveToTrash(id) {
    return api.patch(`/api/trips/${id}/trash`);
  },

  restoreFromTrash(id) {
    return api.patch(`/api/trips/${id}/restore`);
  },

  listTrash(params = {}) {
    return api.get("/api/trips/trash", { params });
  },

  saveTrip(id) {
    return api.post(`/api/trips/${id}/save`);
  },

  unsaveTrip(id) {
    return api.delete(`/api/trips/${id}/save`);
  },

  listSaved(params = {}) {
    return api.get("/api/trips/saved", { params });
  },

  hideTrip(id) {
    return api.patch(`/api/trips/${id}/hide`);
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
