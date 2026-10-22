import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/src/ui/style.css';
import { I18nProvider } from '@/src/ui/I18nProvider';
import { startPalette } from '@/src/ui/palette';
import App from './App';

// Colours are set before the first render, so the page never flashes the default palette.
void startPalette().then(() =>
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <I18nProvider>
        <App />
      </I18nProvider>
    </React.StrictMode>,
  ),
);
