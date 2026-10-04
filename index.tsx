
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './lib/AuthContext';
import { UnsavedChangesProvider } from './lib/UnsavedChangesContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <UnsavedChangesProvider>
        <App />
      </UnsavedChangesProvider>
    </AuthProvider>
  </React.StrictMode>
);
