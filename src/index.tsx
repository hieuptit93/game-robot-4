import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initDatadog } from './utils/datadog';

// Initialize Datadog RUM
initDatadog();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);