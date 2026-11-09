import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { API_BASE } from '../config';
import { storage } from './storage';
import type { Envelope, Paged, TokenPair } from '../types/api';

const ACCESS_KEY = 'mhq_access';
const REFRESH_KEY = 'mhq_refresh';
export const SESSION_EXPIRED_EVENT = 'mhq:session-expired';

export const tokens = {
  access: () => storage.get(ACCESS_KEY),
  refresh: () => storage.get(REFRESH_KEY),
  save(pair: { access_token: string; refresh_token: string }) {
    storage.set(ACCESS_KEY, pair.access_token);
    storage.set(REFRESH_KEY, pair.refresh_token);
  },
  clear() {
    storage.remove(ACCESS_KEY);
    storage.remove(REFRESH_KEY);
  },
};

/** Normalised error thrown by every API helper. */
export class ApiError extends Error {
  status: number;
  code: string;
  retryAfter?: number;
  constructor(message: string, status = 0, code = 'UNKNOWN', retryAfter?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  if (axios.isCancel(err)) return new ApiError('Request cancelled', 0, 'CANCELLED');
  if (axios.isAxiosError(err)) {
    const res = (err as AxiosError<Envelope<unknown> & { detail?: unknown }>).response;
    if (!res) {
      return new ApiError(
        err.code === 'ECONNABORTED'
          ? 'The server took too long to respond. Please try again.'
          : 'Cannot reach the server. Check your connection and that the API is running.',
        0,
        'NETWORK',
      );
    }
    const body = res.data;
    const apiErr = body?.error;
    let message = apiErr?.message || (typeof body?.detail === 'string' ? body.detail : '') || `Request failed (${res.status})`;
    // Surface the first field-level validation message instead of the generic one.
    const issue = apiErr?.details?.errors?.[0];
    if (apiErr?.code === 'VALIDATION_ERROR' && issue?.msg) {
      const field = issue.loc?.filter((p) => p !== 'body' && p !== 'query').join('.');
      message = field ? `${field}: ${issue.msg.replace(/^Value error, /, '')}` : issue.msg;
    }
    let retryAfter: number | undefined;
    if (res.status === 429) {
      retryAfter = Number(res.headers?.['retry-after']) || undefined;
      message = retryAfter ? `Too many requests. Please wait ${retryAfter}s and try again.` : 'Too many requests. Please slow down and try again.';
    }
    return new ApiError(message, res.status, apiErr?.code || `HTTP_${res.status}`, retryAfter);
  }
  return new ApiError(err instanceof Error ? err.message : 'Something went wrong.');
}

export const http = axios.create({ baseURL: API_BASE, timeout: 40_000 });

http.interceptors.request.use((config) => {
  const token = tokens.access();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- Token refresh: one refresh in flight no matter how many requests got a 401 ---
let refreshing: Promise<RefreshResult> | null = null;

type RefreshResult = { accessToken: string | null; error: ApiError | null };

async function refreshAccessToken(): Promise<RefreshResult> {
  const refresh = tokens.refresh();
  if (!refresh) return { accessToken: null, error: new ApiError('No refresh session is available.', 401, 'SESSION_EXPIRED') };

  try {
    // Plain axios: bypass our interceptors so a failing refresh can't recurse.
    const { data } = await axios.post<Envelope<TokenPair>>(
      `${API_BASE}/auth/refresh`,
      { refresh_token: refresh },
      { timeout: http.defaults.timeout },
    );
    if (!data?.success || !data.data?.access_token || !data.data?.refresh_token) {
      // A malformed/server-side response is not proof that the refresh session is invalid.
      return { accessToken: null, error: new ApiError('The server returned an invalid refresh response. Please retry.', 502, 'INVALID_REFRESH_RESPONSE') };
    }
    tokens.save(data.data);
    return { accessToken: data.data.access_token, error: null };
  } catch (err) {
    const apiError = toApiError(err);
    // Only an explicit authentication rejection means the refresh session is invalid.
    // Network errors, rate limits, proxy failures and 5xx responses must not destroy it.
    if (apiError.status === 401) {
      tokens.clear();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    return { accessToken: null, error: apiError };
  }
}

type RetriableConfig = AxiosRequestConfig & { _retried?: boolean };

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const isAuthCall = String(original?.url ?? '').startsWith('/auth/');
    if (error.response?.status === 401 && original && !original._retried && !isAuthCall && tokens.refresh()) {
      original._retried = true;
      refreshing ??= refreshAccessToken().finally(() => { refreshing = null; });
      const result = await refreshing;
      if (result.accessToken) {
        original.headers = { ...original.headers, Authorization: `Bearer ${result.accessToken}` };
        return http(original);
      }
      // Preserve the refresh failure's status. In particular, don't turn a transient
      // refresh 500/network failure into the original 401 (which looks like logout).
      if (result.error) return Promise.reject(result.error);
    }
    return Promise.reject(toApiError(error));
  },
);

// --- Envelope helpers ---
export async function getData<T>(url: string, params?: object, signal?: AbortSignal): Promise<T> {
  return (await http.get<Envelope<T>>(url, { params, signal })).data.data;
}

export async function getPaged<T>(url: string, params?: object, signal?: AbortSignal): Promise<Paged<T>> {
  const body = (await http.get<Envelope<T>>(url, { params, signal })).data;
  return { data: body.data, pagination: body.pagination ?? null };
}

export async function sendData<T>(method: 'post' | 'put' | 'patch' | 'delete', url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return (await http.request<Envelope<T>>({ method, url, data: body, ...config })).data.data;
}
