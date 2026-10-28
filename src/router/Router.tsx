import type { ComponentType } from 'react';
import {
  createBrowserRouter,
  type MiddlewareFunction,
  redirect,
  type RouteObject,
} from 'react-router';
import { RouterProvider } from 'react-router/dom';

import PageLoader from '@/components/ui/PageLoader';
import { ROUTES } from '@/constants/routes';
import { getAccessToken } from '@/lib/session';
import ErrorPage from '@/pages/ErrorPage';

// runs before any loader of the private routes, so private data is never requested without a token
export const authMiddleware: MiddlewareFunction = () => {
  if (!getAccessToken()) {
    throw redirect(ROUTES.login);
  }
};

// loads a module only when its route is visited (code splitting)
const lazyDefault = (load: () => Promise<{ default: ComponentType }>) => async () => (await load()).default;

// A factory, not a constant: react-router mutates `lazy` objects once they load,
// so every router (app, tests) needs its own fresh copy of the route objects.
export const createRoutes = (): Array<RouteObject> => [
  {
    // root route: PageLoader while the first lazy route loads, ErrorPage for any route error
    HydrateFallback: PageLoader,
    ErrorBoundary: ErrorPage,
    children: [
      // public
      {
        path: ROUTES.home,
        lazy: { Component: lazyDefault(() => import('@/pages/Home')) },
      },

      // auth, rendered inside AuthLayout
      {
        path: ROUTES.auth,
        lazy: { Component: lazyDefault(() => import('@/layouts/AuthLayout')) },
        children: [
          {
            path: ROUTES.login,
            lazy: { Component: lazyDefault(() => import('@/pages/LogIn')) },
          },
        ],
      },

      // private, redirect to login without an access token
      {
        middleware: [authMiddleware],
        children: [
          {
            path: ROUTES.private,
            lazy: { Component: lazyDefault(() => import('@/pages/Home')) },
          },
        ],
      },

      {
        path: '*',
        lazy: { Component: lazyDefault(() => import('@/pages/NotFound')) },
      },
    ],
  },
];

// created once at module level, so the router isn't rebuilt on re-render
const router = createBrowserRouter(createRoutes());

const Router = () => <RouterProvider router={router} />;

export default Router;
