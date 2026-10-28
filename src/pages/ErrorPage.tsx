import { useEffect } from 'react';
import { isRouteErrorResponse, Link, Navigate, useRouteError } from 'react-router';
import * as Sentry from '@sentry/react';

import PageLoader from '@/components/ui/PageLoader';
import { ROUTES } from '@/constants/routes';
import { ApiError } from '@/lib/api';
import { isChunkReloadPending } from '@/lib/chunkReload';
import { removeAccessToken } from '@/lib/session';

function ErrorPage() {
  const error = useRouteError();
  const isResponse = isRouteErrorResponse(error);
  const isApiError = error instanceof ApiError;
  // the access token expired or was revoked, the user has to log in again
  const isUnauthorized = isApiError && error.status === 401;
  // thrown responses (404, 401, etc.) and 4xx API errors are expected app states, not bugs
  const isExpected = isResponse || (isApiError && error.status < 500);
  // a route chunk failed to load after a deploy and the page is reloading, see src/lib/chunkReload.ts
  const isReloading = isChunkReloadPending();

  useEffect(() => {
    if (isUnauthorized) {
      removeAccessToken();
    }

    // react-router catches route errors, so they never reach Sentry's global handlers
    if (!isExpected && !isReloading) {
      Sentry.captureException(error);
      console.error(error);
    }
  }, [error, isUnauthorized, isExpected, isReloading]);

  if (isReloading) {
    return <PageLoader />;
  }

  if (isUnauthorized) {
    return <Navigate to={ROUTES.login} replace />;
  }

  // statusText is empty over HTTP/2
  const message = isResponse || isApiError ?
    `${error.status} ${error.statusText}`.trim() :
    'Something went wrong';

  return (
    <div data-testid="error-page" role="alert">
      <h1>Oops!</h1>
      <p>{message}</p>
      <Link to={ROUTES.home}>Go home</Link>
    </div>
  );
}

export default ErrorPage;
