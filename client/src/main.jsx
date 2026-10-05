import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App';
import { AuthProvider } from './lib/auth';
import { startMotion } from './lib/motion';
import { supabase } from './lib/supabase';
import './index.css';

startMotion();

// Dev only: lets the Task 23 visual check sign in test accounts from the console.
if (import.meta.env.DEV) window.__supabase = supabase;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
