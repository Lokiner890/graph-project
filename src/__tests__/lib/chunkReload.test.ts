const reload = vi.fn();
const unregisters: Array<() => void> = [];

const unloadPage = () => unregisters.splice(0).forEach(unregister => unregister());

// a fresh module instance, like a page load: the previous page's listener is gone,
// the module state resets, sessionStorage is kept
const loadPage = async () => {
  unloadPage();
  vi.resetModules();
  const chunkReload = await import('@/lib/chunkReload');

  unregisters.push(chunkReload.registerChunkReload(reload));

  return chunkReload;
};

const setBuild = (src: string) => {
  document.head.innerHTML = `<script type="module" src="${src}"></script>`;
};

const dispatchPreloadError = () => {
  const event = new Event('vite:preloadError', { cancelable: true });

  window.dispatchEvent(event);

  return event;
};

beforeEach(() => {
  setBuild('/assets/index-build1.js');
});

afterEach(() => {
  unloadPage();
  sessionStorage.clear();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

test('should reload once when a chunk fails to load', async () => {
  const { isChunkReloadPending } = await loadPage();

  expect(dispatchPreloadError().defaultPrevented).toBe(true);
  expect(reload).toHaveBeenCalledTimes(1);
  expect(isChunkReloadPending()).toBe(true);

  // another failed preload of the same import while the reload is pending
  expect(dispatchPreloadError().defaultPrevented).toBe(true);
  expect(reload).toHaveBeenCalledTimes(1);
});

test('should not reload again when the same build fails after the reload', async () => {
  await loadPage();
  dispatchPreloadError();

  const { isChunkReloadPending } = await loadPage();

  // the deploy is broken, the error goes to the error page
  expect(dispatchPreloadError().defaultPrevented).toBe(false);
  expect(reload).toHaveBeenCalledTimes(1);
  expect(isChunkReloadPending()).toBe(false);
});

test('should reload again for a new build', async () => {
  await loadPage();
  dispatchPreloadError();

  setBuild('/assets/index-build2.js');
  await loadPage();

  expect(dispatchPreloadError().defaultPrevented).toBe(true);
  expect(reload).toHaveBeenCalledTimes(2);
});

test('should not reload without sessionStorage', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('Storage is disabled');
  });
  await loadPage();

  expect(dispatchPreloadError().defaultPrevented).toBe(false);
  expect(reload).not.toHaveBeenCalled();
});
