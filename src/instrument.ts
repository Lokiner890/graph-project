// Sentry error tracking, imported first in main.tsx so it also catches errors during app startup.
// https://docs.sentry.io/platforms/javascript/guides/react/
import * as Sentry from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN;

// enabled only when a DSN is set, so local development and tests send nothing
if (dsn) {
  Sentry.init({
    dsn,
    // `||`, not `??`: an empty VITE_ENV (as in .env.example) must also fall back to the mode
    environment: import.meta.env.VITE_ENV || import.meta.env.MODE,
  });
}
