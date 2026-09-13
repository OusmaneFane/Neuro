import axios, { type AxiosError } from 'axios';

/** Vite n'interpole pas ${APP_URL} dans .env : une valeur du type "${APP_URL}/api" casse les requêtes. */
function resolveApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  if (raw == null || String(raw).trim() === '' || String(raw).includes('${')) {
    return '/api';
  }
  return String(raw).replace(/\/$/, '');
}

export const baseURL = resolveApiBaseUrl();

export const api = axios.create({ baseURL, timeout: 30_000 });

const ACCESS_KEY = 'medipass_access_token';
const REFRESH_KEY = 'medipass_refresh_token';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => (token ? prom.resolve(token) : prom.reject(error)));
  failedQueue = [];
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Only set JSON Content-Type for non-FormData; FormData needs browser-set boundary
  if (config.data !== undefined && !(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const originalRequest = err.config as typeof err.config & { _retry?: boolean };

    if (err.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      const refresh = getRefreshToken();

      if (!refresh) {
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(err);
      }

      try {
        const { data } = await axios.post<{ accessToken: string }>(`${baseURL}/auth/refresh`, null, {
          headers: { Authorization: `Bearer ${refresh}` },
        });
        setTokens(data.accessToken, (data as { refreshToken?: string }).refreshToken || refresh);
        processQueue(null, data.accessToken);
        if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);
