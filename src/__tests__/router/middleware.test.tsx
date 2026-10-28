import { createMemoryRouter } from 'react-router';

import { ROUTES } from '@/constants/routes';
import { removeAccessToken, setAccessToken } from '@/lib/session';
import { authMiddleware } from '@/router/Router';

const createRouter = (privateLoader: () => unknown) => createMemoryRouter(
  [
    { path: ROUTES.login, Component: () => null },
    {
      middleware: [authMiddleware],
      children: [{ path: ROUTES.private, loader: privateLoader, Component: () => null }],
    },
  ],
  { initialEntries: [ROUTES.home] },
);

afterEach(() => {
  removeAccessToken();
});

test('should redirect to login without running private loaders when there is no token', async () => {
  const privateLoader = vi.fn(() => null);
  const router = createRouter(privateLoader);

  await router.navigate(ROUTES.private);

  expect(router.state.location.pathname).toBe(ROUTES.login);
  expect(privateLoader).not.toHaveBeenCalled();
});

test('should run private loaders when there is a token', async () => {
  setAccessToken('token');
  const privateLoader = vi.fn(() => null);
  const router = createRouter(privateLoader);

  await router.navigate(ROUTES.private);

  expect(router.state.location.pathname).toBe(ROUTES.private);
  expect(privateLoader).toHaveBeenCalledTimes(1);
});
