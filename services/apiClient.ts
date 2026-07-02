import axios from "axios";
import { API_BASE_URL } from "@/config/api";
import { API_ENDPOINTS } from "@/config/endpoints";
import { getAccessToken, getRefreshToken, unwrapApiPayload } from "@/utils/authHelpers";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData && config.headers) {
      // Let the browser set multipart/form-data with the correct boundary
      if (typeof config.headers.delete === "function") {
        config.headers.delete("Content-Type");
      } else {
        delete (config.headers as Record<string, string>)["Content-Type"];
      }
    }

    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as { _retry?: boolean; headers?: Record<string, string> } | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      typeof window !== "undefined"
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refresh_token");

      if (refreshToken) {
        try {
          const refreshRes = await axios.post(
            `${API_BASE_URL}${API_ENDPOINTS.REFRESH_TOKEN}`,
            { refresh_token: refreshToken },
            { headers: { "Content-Type": "application/json" } }
          );
          const data = unwrapApiPayload<Record<string, unknown>>(refreshRes.data);
          const newAccessToken = getAccessToken(data);
          const newRefreshToken = getRefreshToken(data);

          if (newAccessToken) {
            localStorage.setItem("token", newAccessToken);
            if (newRefreshToken) localStorage.setItem("refresh_token", newRefreshToken);
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
          }
        } catch {
          // Fall through to logout handling
        }
      }

      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("auth_unauthorized"));
    }

    const message = error.response
      ? error.response?.data?.message ||
        error.response?.data?.error ||
        `Request failed (${error.response.status})`
      : error.code === "ERR_NETWORK" || !error.response
        ? "Unable to reach the server. Check your connection or try again."
        : error.message || "An unexpected network error occurred. Please try again.";

    return Promise.reject({
      message,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

export default apiClient;
