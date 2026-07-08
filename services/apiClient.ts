import axios, { type InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "@/config/api";
import { API_ENDPOINTS } from "@/config/endpoints";
import { getAccessToken, getRefreshToken, unwrapApiPayload } from "@/utils/authHelpers";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/** Tracks whether a failed request has already been retried once (prevents infinite refresh loops). */
type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

/**
 * Auth endpoints that must never trigger token refresh.
 * Skipping refresh on these prevents infinite loops when login/refresh itself returns 401.
 */
const SKIP_REFRESH_URLS: string[] = [
  API_ENDPOINTS.REFRESH_TOKEN,
  API_ENDPOINTS.SEND_OTP,
  API_ENDPOINTS.VERIFY_OTP,
  API_ENDPOINTS.REGISTER,
  API_ENDPOINTS.LOGOUT,
];

function shouldSkipRefresh(url?: string): boolean {
  if (!url) return false;
  return SKIP_REFRESH_URLS.some((endpoint) => url.includes(endpoint));
}

/** True while a refresh-token request is in flight; blocks duplicate refresh calls. */
let isRefreshing = false;

/** Failed requests waiting for the in-flight refresh to finish. */
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

/** Resolve or reject all queued requests after refresh completes. */
function processRefreshQueue(error: unknown | null, token: string | null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error || !token) {
      reject(error ?? new Error("Token refresh failed"));
    } else {
      resolve(token);
    }
  });
  refreshQueue = [];
}

/** Clear session and redirect home (login entry point) when refresh is no longer valid. */
function handleAuthFailure() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  window.dispatchEvent(new Event("auth_unauthorized"));
  window.location.replace("/");
}

/**
 * Call the existing refresh-token API with the stored refresh token.
 * Uses standalone axios (not apiClient) so the response interceptor is not re-entered.
 */
async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const refreshRes = await axios.post(
    `${API_BASE_URL}${API_ENDPOINTS.REFRESH_TOKEN}`,
    { refresh_token: refreshToken },
    { headers: { "Content-Type": "application/json" } }
  );

  const data = unwrapApiPayload<Record<string, unknown>>(refreshRes.data);
  const newAccessToken = getAccessToken(data);
  const newRefreshToken = getRefreshToken(data);

  if (!newAccessToken) {
    throw new Error("Refresh response did not include an access token");
  }

  localStorage.setItem("token", newAccessToken);
  if (newRefreshToken) {
    localStorage.setItem("refresh_token", newRefreshToken);
  }

  return newAccessToken;
}

/** Attach the new access token and retry the original request (headers/body preserved). */
function retryRequestWithToken(
  originalRequest: RetryableRequestConfig,
  accessToken: string
) {
  if (originalRequest.headers && typeof originalRequest.headers.set === "function") {
    originalRequest.headers.set("Authorization", `Bearer ${accessToken}`);
  } else {
    originalRequest.headers = originalRequest.headers || {};
    (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${accessToken}`;
  }
  return apiClient(originalRequest);
}

function formatApiError(error: unknown) {
  const axiosError = error as {
    response?: { status?: number; data?: { message?: string; error?: string } };
    code?: string;
    message?: string;
  };

  const message = axiosError.response
    ? axiosError.response?.data?.message ||
      axiosError.response?.data?.error ||
      `Request failed (${axiosError.response.status})`
    : axiosError.code === "ERR_NETWORK" || !axiosError.response
      ? "Unable to reach the server. Check your connection or try again."
      : axiosError.message || "An unexpected network error occurred. Please try again.";

  return {
    message,
    status: axiosError.response?.status,
    data: axiosError.response?.data,
  };
}

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
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const isUnauthorized = error.response?.status === 401;
    const isBrowser = typeof window !== "undefined";

    // Never run refresh logic for login/refresh/logout endpoints themselves.
    if (!isUnauthorized || !isBrowser || !originalRequest || shouldSkipRefresh(originalRequest.url)) {
      return Promise.reject(formatApiError(error));
    }

    // Request was already retried once after refresh — avoid infinite loops and force logout.
    if (originalRequest._retry) {
      handleAuthFailure();
      return Promise.reject(formatApiError(error));
    }

    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      handleAuthFailure();
      return Promise.reject(formatApiError(error));
    }

    // Mark before refresh so this request is only retried once.
    originalRequest._retry = true;

    // Another request is already refreshing — queue this one until it completes.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: (token: string) => {
            resolve(retryRequestWithToken(originalRequest, token));
          },
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      const newAccessToken = await refreshAccessToken();
      processRefreshQueue(null, newAccessToken);
      return retryRequestWithToken(originalRequest, newAccessToken);
    } catch (refreshError) {
      processRefreshQueue(refreshError, null);
      handleAuthFailure();
      return Promise.reject(formatApiError(refreshError));
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;
