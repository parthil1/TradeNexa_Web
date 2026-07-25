import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import type { AxiosRequestConfig } from "axios";
import apiClient from "@/services/apiClient";
import { formatApiErrorMessage } from "@/utils/apiErrors";

export interface AxiosBaseQueryArgs {
  url: string;
  method?: AxiosRequestConfig["method"];
  params?: AxiosRequestConfig["params"];
  data?: AxiosRequestConfig["data"];
}

export interface AxiosBaseQueryError {
  status?: number;
  message: string;
  data?: unknown;
}

/**
 * RTK Query transport backed by the existing axios client.
 *
 * Using apiClient (instead of fetchBaseQuery) keeps the Authorization header,
 * 401 refresh-and-retry queue, and FormData handling that live in its
 * interceptors — RTK Query only adds the caching layer on top.
 */
export const axiosBaseQuery =
  (): BaseQueryFn<AxiosBaseQueryArgs, unknown, AxiosBaseQueryError> =>
  async ({ url, method = "GET", params, data }) => {
    try {
      const response = await apiClient.request({ url, method, params, data });
      return { data: response.data };
    } catch (error) {
      const err = error as { status?: number; data?: unknown };
      return {
        error: {
          status: err.status,
          message: formatApiErrorMessage(error, "Request failed"),
          data: err.data,
        },
      };
    }
  };
