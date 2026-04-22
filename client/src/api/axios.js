import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

// axios riêng để gọi refresh, tránh đụng vòng lặp interceptor
// tạo api instance
const refreshClient = axios.create({
  baseURL,
  withCredentials: true,
});

// Dùng chung 1 promise refresh nếu nhiều request cùng bị 401
let refreshPromise = null;

function notifySessionExpired(
  message = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
) {
  window.dispatchEvent(
    new CustomEvent("auth:expired", {
      detail: { message },
    }),
  );
}

export async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = refreshClient.post("/api/auth/refresh").finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status; //401, 404, 500

    // lỗi mạng hoặc không có response thì trả lỗi luôn
    if (!originalRequest || !status) {
      return Promise.reject(error);
    }

    const url = originalRequest.url || "";

    const isRefreshRequest = url.includes("/api/auth/refresh");
    const isLoginRequest = url.includes("/api/auth/login");
    const isRegisterRequest = url.includes("/api/auth/register");
    const isLogoutRequest = url.includes("/api/auth/logout");

    const skipAuthRefresh = originalRequest.skipAuthRefresh === true; //401 thì đừng auto refresh
    const skipSessionExpired = originalRequest.skipSessionExpired === true; //fail thì đừng bắn event session expired

    // Chỉ xử lý auto refresh khi là 401
    if (status !== 401) {
      return Promise.reject(error);
    }

    // Không retry mấy request auth này để tránh vòng lặp
    if (
      skipAuthRefresh ||
      isRefreshRequest ||
      isLoginRequest ||
      isRegisterRequest ||
      isLogoutRequest
    ) {
      return Promise.reject(error);
    }

    // request này đã retry rồi thì thôi
    if (originalRequest._retry) {
      if (!skipSessionExpired) {
        notifySessionExpired();
      }
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      await refreshAccessToken();

      // refresh xong thì chạy lại request cũ
      return api(originalRequest);
    } catch (refreshError) {
      if (!skipSessionExpired) {
        notifySessionExpired();
      }
      return Promise.reject(refreshError);
    }
  },
);
