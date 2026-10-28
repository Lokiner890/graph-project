// single source of truth for URLs, use in routes, <Link to>, navigate() and redirect()
export const ROUTES = {
  home: '/',
  auth: '/auth',
  login: '/auth/login',
  private: '/private',
} as const;
