import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorBody, ApiFieldError } from '@/types';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';


let csrfToken: string | null = null;
export const setCsrfToken = (token: string | null): void => {
  csrfToken = token;
};

type SessionExpiredHandler = () => void;
let onSessionExpired: SessionExpiredHandler | null = null;
export const setSessionExpiredHandler = (handler: SessionExpiredHandler | null): void => {
  onSessionExpired = handler;
};

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (csrfToken && config.method && config.method.toLowerCase() !== 'get') {
    config.headers.set('X-CSRF-Token', csrfToken);
  }
  return config;
});

interface RetriableConfig extends AxiosRequestConfig {
  _retried?: boolean;
}

/** Endpoints where a 401 means "wrong credentials / no session", not "access token expired". */
const NO_REFRESH_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout'];

let refreshInFlight: Promise<void> | null = null;

/** Single-flight: any number of concurrent 401s share one refresh request (the token rotates on each call). */
function refreshSession(): Promise<void> {
  refreshInFlight ??= api
    .post<{ data: { csrfToken: string } }>('/auth/refresh')
    .then((res) => setCsrfToken(res.data.data.csrfToken))
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const url = config?.url ?? '';

    if (status === 401 && config && !config._retried && !NO_REFRESH_PATHS.some((path) => url.startsWith(path))) {
      config._retried = true;
      try {
        await refreshSession();
        return api(config);
      } catch (refreshError) {
        // Only a definitive auth failure ends the session; a network blip during refresh must not log the user out.
        if (axios.isAxiosError(refreshError) && refreshError.response?.status === 401) {
          setCsrfToken(null);
          onSessionExpired?.();
        }
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);

/** Human-readable message for any thrown value. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) {
      if (error.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
      // No response at all: the request was blocked (CORS, wrong address, extension) or the API is down.
      // Show exactly what was attempted so the cause can be found quickly, and log the full error.
      const attempted = `${(error.config?.method ?? 'get').toUpperCase()} ${error.config?.baseURL ?? ''}${error.config?.url ?? ''}`;
      console.error('API request failed without a response', { attempted, code: error.code, message: error.message, apiUrl: API_URL, pageOrigin: typeof window === 'undefined' ? undefined : window.location.origin });
      return `Cannot reach the server. Check your connection and try again. (${attempted} · ${error.code ?? 'no code'})`;
    }
    if (error.response.status === 429) return error.response.data?.message ?? 'Too many requests. Please wait a moment.';
    return error.response.data?.message ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export function getFieldErrors(error: unknown): ApiFieldError[] {
  return axios.isAxiosError<ApiErrorBody>(error) ? (error.response?.data?.errors ?? []) : [];
}

export const getErrorStatus = (error: unknown): number | undefined =>
  axios.isAxiosError(error) ? error.response?.status : undefined;