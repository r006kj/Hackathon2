import type { ApiError } from '../types/api';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export class ApiException extends Error {
  constructor(public readonly data: ApiError, public readonly status: number) {
    super(data.message);
    this.name = 'ApiException';
  }
}

type Primitive = string | number | boolean | null | undefined;
type Params = Record<string, Primitive>;

function buildUrl(endpoint: string, params?: Params): string {
  const qs = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v != null) qs.set(k, String(v));
    }
  }
  const s = qs.toString();
  return `${BASE}${endpoint}${s ? `?${s}` : ''}`;
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('jwt');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface Options {
  params?: Params;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

async function request<T>(
  method: string,
  endpoint: string,
  body?: unknown,
  opts: Options = {},
): Promise<T> {
  const { params, signal, headers: extra } = opts;

  const res = await fetch(buildUrl(endpoint, params), {
    method,
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...extra,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const err: ApiError = await res.json();
    throw new ApiException(err, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get:    <T>(ep: string, opts?: Options)                  => request<T>('GET',    ep, undefined, opts),
  post:   <T>(ep: string, body: unknown, opts?: Options)   => request<T>('POST',   ep, body,      opts),
  patch:  <T>(ep: string, body: unknown, opts?: Options)   => request<T>('PATCH',  ep, body,      opts),
  delete: <T>(ep: string, opts?: Options)                  => request<T>('DELETE', ep, undefined, opts),
};