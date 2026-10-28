import { api, ApiError } from '@/lib/api';
import { removeAccessToken, setAccessToken } from '@/lib/session';

const fetchMock = vi.fn<typeof fetch>();

const jsonResponse = (data: unknown, init?: ResponseInit) => new Response(JSON.stringify(data), {
  ...init,
  headers: { 'Content-Type': 'application/json' },
});

// the url and init of the last fetch call
const lastRequest = () => {
  const [url, init] = fetchMock.mock.lastCall ?? [];

  return { url, init, headers: new Headers(init?.headers) };
};

beforeEach(() => {
  vi.stubEnv('VITE_API_URL', 'https://api.test/v1/');
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockResolvedValue(jsonResponse({ id: 1 }));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
  removeAccessToken();
});

test('should request the path from VITE_API_URL and return the parsed JSON', async () => {
  const data = await api<{ id: number }>('/users/1');

  const { url, init, headers } = lastRequest();

  expect(data).toEqual({ id: 1 });
  expect(url).toBe('https://api.test/v1/users/1');
  expect(init?.method).toBe('GET');
  expect(headers.get('Accept')).toBe('application/json');
  expect(headers.has('Authorization')).toBe(false);
});

test('should send the access token from the cookie', async () => {
  setAccessToken('token');

  await api('users');

  expect(lastRequest().headers.get('Authorization')).toBe('Bearer token');
});

test('should keep an explicit Authorization header', async () => {
  setAccessToken('token');

  await api('users', { headers: { Authorization: 'Basic abc' } });

  expect(lastRequest().headers.get('Authorization')).toBe('Basic abc');
});

test('should send the passed token instead of the cookie', async () => {
  setAccessToken('token');

  await api('users', { token: 'other' });

  expect(lastRequest().headers.get('Authorization')).toBe('Bearer other');
});

test('should add the query string without empty values', async () => {
  // a filter the user didn't set
  const filters: { role?: string } = {};

  await api('users', { query: { page: 2, search: 'a b', active: true, role: filters.role, team: null } });

  expect(lastRequest().url).toBe('https://api.test/v1/users?page=2&search=a+b&active=true');
});

test('should send objects as JSON', async () => {
  await api('users', { method: 'post', body: { name: 'Ann' } });

  const { init, headers } = lastRequest();

  expect(init?.method).toBe('POST');
  expect(init?.body).toBe('{"name":"Ann"}');
  expect(headers.get('Content-Type')).toBe('application/json');
});

test('should send FormData as is', async () => {
  const body = new FormData();

  await api('avatar', { method: 'PUT', body });

  const { init, headers } = lastRequest();

  expect(init?.body).toBe(body);
  // set by fetch with the multipart boundary
  expect(headers.has('Content-Type')).toBe(false);
});

test('should send binary data as is', async () => {
  const body = new Uint8Array([1, 2, 3]);

  await api('files', { method: 'PUT', body });

  expect(lastRequest().init?.body).toBe(body);
});

test('should send no body for null', async () => {
  await api('users/1/archive', { method: 'POST', body: null });

  const { init, headers } = lastRequest();

  expect(init?.body).toBeNull();
  expect(headers.has('Content-Type')).toBe(false);
});

test('should pass fetch options through', async () => {
  const { signal } = new AbortController();

  await api('users', { signal, headers: { 'X-Request-Id': '1' } });

  const { init, headers } = lastRequest();

  expect(init?.signal).toBe(signal);
  expect(headers.get('X-Request-Id')).toBe('1');
});

test('should return null for an empty response', async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

  await expect(api('users/1', { method: 'DELETE' })).resolves.toBeNull();
});

test('should return text for a non-JSON response', async () => {
  fetchMock.mockResolvedValue(new Response('pong'));

  await expect(api('ping')).resolves.toBe('pong');
});

test('should throw ApiError with the status and the response body', async () => {
  const errors = { email: ['is taken'] };

  fetchMock.mockResolvedValue(jsonResponse(errors, { status: 422, statusText: 'Unprocessable Entity' }));

  const error = await api('users?token=secret', { method: 'POST', body: {} }).catch((e: unknown) => e);

  expect(error).toBeInstanceOf(ApiError);
  expect(error).toMatchObject({
    name: 'ApiError',
    status: 422,
    statusText: 'Unprocessable Entity',
    data: errors,
    // without the query string
    message: 'POST users failed with status 422',
  });
});

test('should throw ApiError when the error body is malformed', async () => {
  fetchMock.mockResolvedValue(new Response('{', {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  }));

  await expect(api('users')).rejects.toMatchObject({ status: 500, data: null });
});

test('should throw network errors as is', async () => {
  const error = new TypeError('Failed to fetch');

  fetchMock.mockRejectedValue(error);

  await expect(api('users')).rejects.toBe(error);
});
