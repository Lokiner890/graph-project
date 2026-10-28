import type { ReactElement } from 'react';
import {
  createMemoryRouter,
  type InitialEntry,
  type NonIndexRouteObject,
  type RouteObject,
} from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { render as rtlRender, type RenderOptions } from '@testing-library/react';

type Options = Omit<RenderOptions, 'wrapper'> & {
  // URL history to start from, e.g. ['/users/1?tab=info']
  initialEntries?: Array<InitialEntry>;
  // route of the rendered element: `path` with params, `loader`, `action`, `middleware`, etc.
  route?: Omit<NonIndexRouteObject, 'element' | 'Component' | 'children'>;
  // sibling routes, e.g. the page a link navigates to
  routes?: Array<RouteObject>;
};

// Render inside a data router, the same router type the app uses (createBrowserRouter),
// so components can use loaders, actions, useLoaderData, useFetcher, <Form>, etc.
// The element matches any URL unless `route.path` is set.
function render(
  ui: ReactElement,
  { initialEntries = ['/'], route, routes = [], ...renderOptions }: Options = {},
) {
  const router = createMemoryRouter(
    [{ path: '*', ...route, element: ui }, ...routes],
    { initialEntries },
  );

  // `router` gives access to the current location: router.state.location.pathname
  return { router, ...rtlRender(<RouterProvider router={router} />, renderOptions) };
}

// re-export everything
export * from '@testing-library/react';

// override render method
export { render };
