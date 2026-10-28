// Typed fetch wrapper for the backend API at VITE_API_URL.
// The response type is not checked at runtime: `api<User>()` trusts the backend to return a User.

import { getAccessToken } from '@/lib/session';

type QueryValue = string | number | boolean | null | undefined;

export type ApiOptions = Omit<RequestInit, 'body'> & {
  // access token, defaults to the cookie (getAccessToken); an Authorization header wins
  token?: string;
  // query string, `null` / `undefined` values are skipped
  query?: Record<string, QueryValue>;
  // objects and arrays are sent as JSON; strings, FormData, URLSearchParams, Blob and binary data as is
  body?: unknown;
};

// thrown for every non-2xx response; ErrorPage reports only 5xx to Sentry and sends 401 to login
export class ApiError extends Error {
  readonly status: number;

  readonly statusText: string;

  // parsed response body (JSON or text, null when empty), e.g. backend validation messages
  readonly data: unknown;

  constructor(method: string, path: string, response: Response, data: unknown) {
    // without the query string, it can contain personal data and the message goes to Sentry
    super(`${method} ${path.split('?')[0]} failed with status ${response.status}`);
    this.name = 'ApiError';
    this.status = response.status;
    this.statusText = response.statusText;
    this.data = data;
  }
}

const isRawBody = (body: unknown): body is BodyInit => typeof body === 'string' ||
  body instanceof FormData ||
  body instanceof URLSearchParams ||
  body instanceof Blob ||
  body instanceof ArrayBuffer ||
  // typed arrays (Uint8Array, etc.) and DataView
  ArrayBuffer.isView(body);

const buildUrl = (path: string, query: Record<string, QueryValue> = {}) => {
  // `||`: an empty VITE_API_URL (as in .env.example) means the API is on the same origin
  const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== null && typeof value !== 'undefined') {
      params.append(key, String(value));
    }
  });

  const search = params.toString();

  return `${baseUrl}/${path.replace(/^\/+/, '')}${search ? `?${search}` : ''}`;
};

// null for an empty body (204, etc.), JSON for JSON responses, text otherwise
const readBody = async (response: Response): Promise<unknown> => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  return response.headers.get('Content-Type')?.includes('json') ? JSON.parse(text) : text;
};

// sets Content-Type for JSON, FormData and Blob get theirs (with the multipart boundary) from fetch
const toRequestBody = (body: unknown, headers: Headers): BodyInit | null => {
  if (isRawBody(body)) {
    return body;
  }

  if (body === null || typeof body === 'undefined') {
    return null;
  }

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return JSON.stringify(body);
};

export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const {
    token = getAccessToken(),
    query,
    body,
    headers: initHeaders,
    ...init
  } = options;
  const method = (init.method ?? 'GET').toUpperCase();
  const url = buildUrl(path, query);
  const headers = new Headers(initHeaders);

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // network errors and aborts are thrown by fetch as is
  const response = await fetch(url, { ...init, method, headers, body: toRequestBody(body, headers) });

  if (!response.ok) {
    // a malformed error body must not hide the status
    const data = await readBody(response).catch(() => null);

    throw new ApiError(method, path, response, data);
  }

  return readBody(response) as Promise<T>;
}
