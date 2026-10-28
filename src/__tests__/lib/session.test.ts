import Cookies from 'js-cookie';

import { STORAGE_KEYS } from '@/constants/storage';
import { getAccessToken, removeAccessToken, setAccessToken } from '@/lib/session';

const ATTRIBUTES = { path: '/', sameSite: 'strict', secure: false };

afterEach(() => {
  removeAccessToken();
  vi.restoreAllMocks();
});

test('should save, read and remove the access token', () => {
  setAccessToken('token');

  expect(getAccessToken()).toBe('token');

  removeAccessToken();

  expect(getAccessToken()).toBeUndefined();
});

test('should set and remove the cookie with the same attributes', () => {
  const set = vi.spyOn(Cookies, 'set');
  const remove = vi.spyOn(Cookies, 'remove');
  const expires = new Date('2030-01-01');

  setAccessToken('token', expires);
  removeAccessToken();

  // not Secure: tests run on http://localhost
  expect(set).toHaveBeenCalledWith(STORAGE_KEYS.accessToken, 'token', { ...ATTRIBUTES, expires });
  expect(remove).toHaveBeenCalledWith(STORAGE_KEYS.accessToken, ATTRIBUTES);
});

test('should set a Secure cookie on https', async () => {
  vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, protocol: 'https:' });
  vi.resetModules();
  const set = vi.spyOn((await import('js-cookie')).default, 'set');
  const session = await import('@/lib/session');

  session.setAccessToken('token');

  expect(set).toHaveBeenCalledWith(STORAGE_KEYS.accessToken, 'token', expect.objectContaining({ secure: true }));
});
