import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/src/ui/style.css';
import { I18nProvider } from '@/src/ui/I18nProvider';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>,
);
