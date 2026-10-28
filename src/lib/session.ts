// The access token cookie, use these instead of `Cookies` directly: a cookie is removed only
// with the same attributes it was set with, so set and remove must share them.
// JavaScript can read this cookie (it can't be httpOnly), see README "Access token" for the safer setup.

import Cookies from 'js-cookie';

import { STORAGE_KEYS } from '@/constants/storage';

const ATTRIBUTES = {
  path: '/',
  // the token is sent in the Authorization header, the cookie is never needed cross-site
  sameSite: 'strict',
  // Safari rejects Secure cookies on http://localhost
  secure: window.location.protocol === 'https:',
} as const;

export const getAccessToken = () => Cookies.get(STORAGE_KEYS.accessToken);

// expires: the token expiry from the login response, so the cookie doesn't outlive the token;
// without it the cookie is removed when the browser closes
export const setAccessToken = (token: string, expires?: Date) => {
  Cookies.set(STORAGE_KEYS.accessToken, token, { ...ATTRIBUTES, expires });
};

export const removeAccessToken = () => {
  Cookies.remove(STORAGE_KEYS.accessToken, ATTRIBUTES);
};
