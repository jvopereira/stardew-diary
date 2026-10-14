import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App';
import { DiaryProvider } from './state/DiaryProvider';
import '../styles/main.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <DiaryProvider>
        <App />
      </DiaryProvider>
    </BrowserRouter>
  </StrictMode>,
);
