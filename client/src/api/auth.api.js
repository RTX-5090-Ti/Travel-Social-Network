import { api, refreshAccessToken } from "./axios";

export const authApi = {
  login: (payload) => api.post("/api/auth/login", payload),
  register: (payload) => api.post("/api/auth/register", payload),
  me: (config = {}) => api.get("/api/auth/me", config),
  refresh: () => api.post("/api/auth/refresh"),
  logout: () => api.post("/api/auth/logout"),
  reactivateAccount: (payload) => api.post("/api/auth/reactivate", payload),
  deactivateAccount: () => api.patch("/api/auth/deactivate"),
  deleteAccount: () => api.patch("/api/auth/delete-account"),
  changePassword: (payload) => api.patch("/api/auth/change-password", payload),

  //thử khôi phục session đăng nhập của user.
  async bootstrapSession() {
    try {
      const res = await api.get("/api/auth/me", {
        skipAuthRefresh: true,
        skipSessionExpired: true,
      });
      return res.data.user || null;
    } catch (error) {
      if (error?.response?.status !== 401) {
        throw error;
      }
    }

    try {
      await refreshAccessToken();

      const res = await api.get("/api/auth/me", {
        skipAuthRefresh: true,
        skipSessionExpired: true,
      });

      return res.data.user || null;
    } catch {
      return null;
    }
  },

  updateAvatar(formData) {
    return api.patch("/api/users/me/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};
