# PROJECT_NAME
TODO add project name

## Starting a new project from this template
Create the repository with **Use this template** on GitHub, go through the list, then delete this section.

**Project files**
- [ ] `package.json` — set `name`, reset `version` to `0.0.1`
- [ ] `index.html` — replace `PROJECT_NAME` (title) and `PROJECT_DESCRIPTION` (meta description)
- [ ] `public/favicon.svg` — replace the Vite logo with the project icon
- [ ] `README.md` — replace `PROJECT_NAME` and every `TODO` (description, related resources, deploy steps)
- [ ] `CHANGELOG.md` — replace the `v0.0.1` placeholder line with the first task
- [ ] `.env.example` and `src/vite-env.d.ts` — add the project's `VITE_*` variables (declare each one in both)

**Demo code**
- [ ] Replace the demo pages and routes (`Home`, `LogIn`, `AuthLayout`, the private route that reuses `Home`) with the real ones, keep `ROUTES` in `src/constants/routes.ts` in sync
- [ ] Check the cookie name in `STORAGE_KEYS.accessToken` (`src/constants/storage.ts`) matches the backend / auth flow, and save the token in the login action with `setAccessToken()`, see [Access token](#access-token)

**GitHub**
- [ ] Create the `dev`, `staging` and `production` branches, make `dev` the default branch
- [ ] Add the secrets `SONAR_URL` and `SONAR_TOKEN` (the SonarQube project key is the repository name)
- [ ] Add the `VITE_*` values as GitHub environment variables for the deploy builds, see [Environment variables in deploy](#environment-variables-in-deploy)

**Deploy**
- [ ] Add the staging / production deploy workflows and describe them in [Staging deploy](#staging-deploy) / [Production deploy](#production-deploy)
- [ ] Serve `index.html` with `Cache-Control: no-cache` (CloudFront, etc.), hashed `assets/` can be cached for a year, see [Chunk reload after deploy](#chunk-reload-after-deploy)
- [ ] Set `VITE_SENTRY_DSN` and `VITE_ENV` per environment to enable Sentry, see [Sentry](#sentry)
- [ ] After the first staging deploy, check the chunk reload: open the app, deploy again, click a link in the old tab, it should reload once into the new build

## Project description
TODO add project description

## Tech stack
- [React 19](https://react.dev/) + [TypeScript 6](https://www.typescriptlang.org/)
- [React Compiler](https://react.dev/learn/react-compiler) — automatic memoization, no manual `useMemo` / `useCallback` / `memo` needed
- [Vite 8](https://vite.dev/) — dev server and build
- [React Router 8](https://reactrouter.com/) — routing (data mode, `createBrowserRouter`, lazy-loaded routes)
- [Vitest 5](https://vitest.dev/) + [Testing Library](https://testing-library.com/docs/react-testing-library/intro/) — tests
- [ESLint 10](https://eslint.org/) with [`@coaxsoft/eslint-config-fe-react`](https://github.com/coaxsoft/eslint-config-fe-react) — linting and formatting
- [Sentry](https://docs.sentry.io/platforms/javascript/guides/react/) — error tracking
- [husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/lint-staged/lint-staged) — git hooks

## Pre Requirements
You will need to install these:
- Node >= 24 (see `.nvmrc`, run `nvm use`; `npm install` fails on older versions, `engine-strict` in `.npmrc`)
- npm >= 10

# Development environment
### Installation ###
- `npm install` (also installs the git hooks)
- copy env variables: `cp .env.example .env` and fill in the values
- run `npm run dev` to start the application in development mode on [http://localhost:3000](http://localhost:3000)

## Related resources
- [Production](#)
- [Staging](#)
- [API Documentation](#)
- [FrontEnd repository](#)
- [Backend repository](#)
TODO other resources

## Commands

In the project directory, you can run:

### `npm run dev`
Runs the app in development mode on port 3000. The page reloads when you make edits.

### `npm run build`
Type-checks the project and builds the app for production into the `dist` folder.

### `npm run preview`
Serves the production build from `dist` locally.

### `npm run lint`
Checks your code with ESLint and fixes what can be fixed automatically.

### `npm run lint:ci`
Runs ESLint and writes the report to `eslint-report.json` (used by SonarQube).

### `npm run ts:check`
Type-checks the project (`tsc -b`) without building it.

# Test environment
### `npm test`
Runs the test suite once with Vitest.

### `npm run test:ci`
Runs the test suite with coverage. The report is written to `coverage/` (`lcov.info` is used by SonarQube).

## Git hooks
Hooks are installed by husky on `npm install`. Before every commit `.husky/pre-commit` runs `lint-staged`: `eslint --fix` on staged `js/jsx/ts/tsx` files, fixes are added to the commit. Type check and tests run in CI on every push and pull request (run them locally with `npm run ts:check` and `npm test`).

## Project structure
- `src/components` — UI components, can be composed of other components
  - `src/components/ui` — basic reusable building blocks (button, input, checkbox, page loader, etc.)
- `src/constants` — app-wide constants, one file per topic (`routes.ts` — URL paths, `storage.ts` — cookie and storage keys, `api.ts` — API endpoints)
- `src/containers` — components that provide data and behavior (API calls, state, callbacks)
- `src/hooks` — custom React hooks
- `src/layouts` — route layouts (render an `<Outlet />`)
- `src/lib` — helper functions (`api.ts`, see [API client](#api-client); `session.ts`, see [Access token](#access-token); `chunkReload.ts`, see [Chunk reload after deploy](#chunk-reload-after-deploy))
- `src/pages` — page components (including `NotFound` and the route `ErrorPage`)
- `src/router` — routing: route tree and auth middleware, see [Routing](#routing)
- `src/types` — shared TypeScript types
- `src/__tests__` — tests and test utils (`_utils/render.tsx` renders inside a memory data router, options: `initialEntries`, `route` (path, loader, action), `routes`; returns `router`)

Import from `src` with the `@/` alias, e.g. `import Router from '@/router';`.

### Routing
React Router in data mode:
- `src/constants/routes.ts` — `ROUTES` URL constants. Use them everywhere instead of string paths: `<Link to={ROUTES.login}>`, `navigate(ROUTES.home)`, `redirect(ROUTES.login)`. Import with `import { ROUTES } from '@/constants/routes';`.

`src/router/Router.tsx` contains the rest:
- `createRoutes()` — the route tree: public, `/auth` (rendered inside `AuthLayout`) and private routes. Each page is loaded only when its route is visited (`lazy`). Unknown URLs render `NotFound`, route errors render `ErrorPage`.
- `authMiddleware` — protects the private routes: it runs before any private loader and redirects to `/auth/login` without the access token cookie (`getAccessToken()`).

To add a page: add its path to `ROUTES`, then add `{ path: ROUTES.myPage, lazy: { Component: lazyDefault(() => import('@/pages/MyPage')) } }` to the right group in `createRoutes()`.

### API client
`src/lib/api.ts` — `api<T>(path, options)`, a typed `fetch` wrapper for the backend at `VITE_API_URL`:
- `token` — sent as `Authorization: Bearer <token>`, defaults to the access token cookie (`getAccessToken()`, an explicit `Authorization` header wins), so calls from loaders, actions and components are authenticated without passing it.
- `query` — query string object, `null` / `undefined` values are skipped.
- `body` — objects and arrays are sent as JSON; strings, `FormData`, `URLSearchParams`, `Blob` and binary data (`ArrayBuffer`, typed arrays) as is.
- any other `fetch` option (`method`, `headers`, `signal`, etc.) is passed through. Pass the loader's `request.signal`, so the request is cancelled when the user navigates away.
- returns the parsed JSON (text for non-JSON responses, `null` for an empty body). `T` is not checked at runtime, it trusts the backend.
- throws `ApiError` (`status`, `statusText`, `data` — the parsed response body, e.g. validation messages) for non-2xx responses. Network errors are thrown as is.

```ts
import type { LoaderFunctionArgs } from 'react-router';

import { api } from '@/lib/api';

export const loader = ({ request }: LoaderFunctionArgs) => api<Array<User>>('/users', {
  query: { page: 1 },
  signal: request.signal,
});
```

`ApiError` thrown from a loader or action is handled by `ErrorPage`: 401 removes the access token (`removeAccessToken()`) and redirects to login, other 4xx show the status, 5xx are also reported to Sentry. Catch the errors a page handles itself, e.g. a 401 for a wrong password or a 422 with validation messages in the login action, and return them to the form instead.

Keep endpoint paths in `src/constants/api.ts`, like `ROUTES`.

### Access token
`src/lib/session.ts` owns the access token cookie (`STORAGE_KEYS.accessToken`), use it instead of `js-cookie` directly:
- `setAccessToken(token, expires?)` — call it in the login action. Pass the token expiry from the login response, so the cookie doesn't outlive the token; without it the cookie is removed when the browser closes.
- `getAccessToken()` — used by `authMiddleware` and `api()`.
- `removeAccessToken()` — for logout, also called by `ErrorPage` on a 401.

The cookie is `SameSite=Strict`, `Secure` on https, `path=/`. A cookie is removed only with the attributes it was set with, so keep setting and removing it through these functions.

JavaScript can read this cookie, so an XSS vulnerability can steal the token (`localStorage` has the same exposure). If the backend can do it, the safer setup is an `httpOnly` cookie set by the backend: remove `session.ts`, send requests with `credentials: 'include'` instead of the `Authorization` header, and check the session with an API call (e.g. `/me`) instead of reading the cookie. The browser then sends the cookie automatically, so the backend must also protect against CSRF (`SameSite` cookie or a CSRF token).

### Chunk reload after deploy
Every build gets new hashed chunk file names and the old ones are removed. A tab opened before a deploy still has the old `index.html`, so opening a lazy route there fails with "Failed to fetch dynamically imported module". `src/lib/chunkReload.ts` (registered in `main.tsx`) listens to Vite's `vite:preloadError` event and reloads the page once, so the tab gets the new build. At most one reload per build: if the same build fails again, the deploy itself is broken and `ErrorPage` is shown instead of reloading forever. While the reload is pending, `ErrorPage` shows `PageLoader` and doesn't report to Sentry.

`index.html` must be served with `Cache-Control: no-cache` ([Vite docs](https://vite.dev/guide/build#load-error-handling)), otherwise the reload gets the old `index.html` again. Set it in the hosting (CloudFront, etc.), e.g. upload `index.html` with `--cache-control no-cache`.

## Settings

#### `eslint.config.js`
ESLint flat config, based on `@coaxsoft/eslint-config-fe-react` plus project overrides and Vitest rules for test files. [See configuration](https://eslint.org/docs/latest/use/configure/)

#### `vite.config.ts`
Configuration for Vite and Vitest (`test` block). Enables React Compiler (except in tests, its generated branches would distort coverage), the `@/` alias is resolved from `tsconfig.app.json` `paths`. [See configuration](https://vite.dev/config/)

#### `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
TypeScript configuration: `tsconfig.app.json` for the app (`src`, browser, `target`/`lib` ES2023 to match Vite's build target), `tsconfig.node.json` for `vite.config.ts` (Node 24, `module: nodenext`, `@types/node`). TypeScript only type-checks (`noEmit`), Vite compiles.

#### `src/instrument.ts`
Sentry setup, imported first in `main.tsx`. See [Sentry](#sentry).

#### `.env.example`, `src/vite-env.d.ts`
Environment variables template. Only `VITE_*` variables are exposed to the app; declare each one in `ImportMetaEnv` in `src/vite-env.d.ts` to get it typed (unknown keys are a type error).

#### `.nvmrc`, `.npmrc`
Node version for nvm and CI. `engine-strict` makes `npm install` fail on a Node version outside `engines` in `package.json`.

#### `.editorconfig`
Basic formatting (2 spaces, LF line endings, UTF-8, final newline) applied by the editor to every file, including files ESLint doesn't check (JSON, YAML, Markdown, CSS). Supported by VS Code (EditorConfig extension) and JetBrains IDEs.

#### `src/__tests__/setup.ts`
Test setup, adds the `@testing-library/jest-dom` matchers.

#### `.husky/`
Git hooks, see [Git hooks](#git-hooks).

# Deployment instructions
### `npm run build`

Builds the app for production to the `dist` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

### Sentry
Error tracking is enabled only when `VITE_SENTRY_DSN` is set, so local development and tests send nothing.
- `src/instrument.ts` — `Sentry.init`, imported first in `main.tsx`. Uncaught errors are reported automatically.
- `src/pages/ErrorPage.tsx` — reports route errors (React Router catches them, so they don't reach Sentry on their own). Thrown responses (404, 401, etc.) and 4xx `ApiError`s are expected app states and are not reported.

Set `VITE_SENTRY_DSN` (project DSN) at build time. Events are tagged with `VITE_ENV` (e.g. `staging`, defaults to the Vite mode).

### Environment variables in deploy
`VITE_*` variables are embedded into the bundle when `npm run build` runs, so they are set in the CI build step, e.g. from GitHub environment variables:
```yaml
- name: Build
  env:
    VITE_API_URL: ${{ vars.VITE_API_URL }}
    VITE_ENV: staging
    VITE_SENTRY_DSN: ${{ vars.VITE_SENTRY_DSN }}
  run: npm run build
```

### CI
GitHub workflows in `.github/workflows` run lint, type check, tests, build and the SonarQube scan on pushes to `dev`, `staging`, `production` and on pull requests. SonarQube settings are passed in the workflow files (secrets: `SONAR_URL`, `SONAR_TOKEN`).

### Staging deploy
TODO describe how to deploy to staging

### Production deploy
TODO describe how to deploy to production
