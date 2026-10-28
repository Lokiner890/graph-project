// must be the first import, see src/instrument.ts
import './instrument';
// assets
import '@/assets/styles/index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// utils
import { registerChunkReload } from '@/lib/chunkReload';
// components
import App from './App.tsx';

// reload once when a route chunk of a previous deploy is gone, see src/lib/chunkReload.ts
registerChunkReload();

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
