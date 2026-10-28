// After a deploy, the chunk files of the previous build are gone, so a tab opened before it fails
// to lazy-load a route ("Failed to fetch dynamically imported module"). Vite fires
// `vite:preloadError` for this case, the fix is a reload: the tab gets the new index.html and chunks.
// https://vite.dev/guide/build#load-error-handling
// index.html must be served with `Cache-Control: no-cache`, otherwise the reload gets the old build again.

const RELOADED_BUILD_KEY = 'chunk-reload-build';

let reloadPending = false;

// the hashed entry script (`/assets/index-<hash>.js`) changes with every build
const getBuildId = () => document.querySelector<HTMLScriptElement>('script[type="module"][src]')?.src ?? 'unknown';

// true between the reload call and the page unload, ErrorPage shows a loader instead of an error meanwhile
export const isChunkReloadPending = () => reloadPending;

export function registerChunkReload(reload = () => window.location.reload()) {
  const handlePreloadError = (event: Event) => {
    // Vite fires the event for every failed preload of an import, the first one already reloads
    if (reloadPending) {
      event.preventDefault();

      return;
    }

    const buildId = getBuildId();

    try {
      // at most one reload per build: a broken deploy shows the error page instead of reloading forever
      if (sessionStorage.getItem(RELOADED_BUILD_KEY) === buildId) {
        return;
      }

      sessionStorage.setItem(RELOADED_BUILD_KEY, buildId);
    }
    catch {
      // without sessionStorage a reload loop can't be detected, let the error page handle it
      return;
    }

    // prevented: Vite doesn't throw the import error, the page reloads instead
    event.preventDefault();
    reloadPending = true;
    reload();
  };

  window.addEventListener('vite:preloadError', handlePreloadError);

  return () => window.removeEventListener('vite:preloadError', handlePreloadError);
}
