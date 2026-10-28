import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import * as Sentry from '@sentry/react';
import { render, screen, waitFor } from '@testing-library/react';

import { ROUTES } from '@/constants/routes';
import { ApiError } from '@/lib/api';
import { isChunkReloadPending } from '@/lib/chunkReload';
import { getAccessToken, removeAccessToken, setAccessToken } from '@/lib/session';
import { createRoutes } from '@/router/Router';

vi.mock('@sentry/react', async importOriginal => ({
  ...await importOriginal<typeof import('@sentry/react')>(),
  captureException: vi.fn(),
}));

vi.mock('@/lib/chunkReload', () => ({
  isChunkReloadPending: vi.fn(() => false),
}));

const renderRoute = (path: string, routes = createRoutes()) => {
  const router = createMemoryRouter(routes, { initialEntries: [path] });

  render(<RouterProvider router={router} />);

  return router;
};

const renderFailingRoute = (loader: () => never) => {
  const routes = createRoutes();

  routes[0].children?.push({ path: '/broken', loader, Component: () => null });

  return renderRoute('/broken', routes);
};

const apiError = (status: number, statusText = '') => new ApiError('GET', '/users', new Response(null, { status, statusText }), null);

afterEach(() => {
  removeAccessToken();
  vi.mocked(isChunkReloadPending).mockReturnValue(false);
  vi.clearAllMocks();
});

test('should redirect to login from a private route without a token', async () => {
  const router = renderRoute(ROUTES.private);

  expect(await screen.findByRole('heading', { name: 'LogIn' })).toBeInTheDocument();
  expect(router.state.location.pathname).toBe(ROUTES.login);
});

test('should open a private route with a token', async () => {
  setAccessToken('token');

  renderRoute(ROUTES.private);

  expect(await screen.findByTestId('home-page')).toBeInTheDocument();
});

test('should render not found page for an unknown route', async () => {
  renderRoute('/unknown');

  expect(await screen.findByTestId('not-found-page')).toBeInTheDocument();
});

test('should render error page and report the error when a route fails', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => null);
  const error = new Error('Broken route');

  renderFailingRoute(() => {
    throw error;
  });

  expect(await screen.findByTestId('error-page')).toBeInTheDocument();
  expect(Sentry.captureException).toHaveBeenCalledWith(error);
});

test('should not report thrown responses like 404', async () => {
  renderFailingRoute(() => {
    throw new Response(null, { status: 404, statusText: 'Not Found' });
  });

  expect(await screen.findByText('404 Not Found')).toBeInTheDocument();
  expect(Sentry.captureException).not.toHaveBeenCalled();
});

test('should not report 4xx API errors', async () => {
  renderFailingRoute(() => {
    throw apiError(404, 'Not Found');
  });

  expect(await screen.findByText('404 Not Found')).toBeInTheDocument();
  expect(Sentry.captureException).not.toHaveBeenCalled();
});

test('should report 5xx API errors', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => null);
  const error = apiError(500);

  renderFailingRoute(() => {
    throw error;
  });

  // HTTP/2 responses have no statusText
  expect(await screen.findByText('500')).toBeInTheDocument();
  expect(Sentry.captureException).toHaveBeenCalledWith(error);
});

test('should remove the access token and redirect to login on a 401 API error', async () => {
  setAccessToken('expired');

  const router = renderFailingRoute(() => {
    throw apiError(401);
  });

  expect(await screen.findByRole('heading', { name: 'LogIn' })).toBeInTheDocument();
  expect(router.state.location.pathname).toBe(ROUTES.login);
  expect(getAccessToken()).toBeUndefined();
  expect(Sentry.captureException).not.toHaveBeenCalled();
});

test('should show the loader and not report while the page reloads after a chunk error', async () => {
  vi.mocked(isChunkReloadPending).mockReturnValue(true);

  renderFailingRoute(() => {
    throw new TypeError('Failed to fetch dynamically imported module');
  });

  // ErrorPage has rendered (it reads the reload state), not the initial HydrateFallback loader
  await waitFor(() => expect(isChunkReloadPending).toHaveBeenCalled());
  expect(screen.getByTestId('page-loader')).toBeInTheDocument();
  expect(screen.queryByTestId('error-page')).not.toBeInTheDocument();
  expect(Sentry.captureException).not.toHaveBeenCalled();
});
