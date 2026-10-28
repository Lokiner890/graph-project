// Types for import.meta.env, see https://vite.dev/guide/env-and-mode#intellisense-for-typescript

interface ViteTypeOptions {
  // disallow unknown keys in import.meta.env
  strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // deployment environment, defaults to the Vite mode (`development` / `production`)
  readonly VITE_ENV?: string;
  // Sentry is disabled when the DSN is empty
  readonly VITE_SENTRY_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
