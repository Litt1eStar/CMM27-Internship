import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { LazyMotion } from 'motion/react';
import App from './App';
import { AuthProvider } from './lib/auth';
import { startMotion } from './lib/motion';
import { startMusic } from './lib/music';
import { supabase } from './lib/supabase';
import './index.css';

const loadMotionFeatures = () => import('./lib/motionFeatures').then((mod) => mod.default);

startMotion();
startMusic();

// Dev only: lets the Task 23 visual check sign in test accounts from the console.
if (import.meta.env.DEV) window.__supabase = supabase;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LazyMotion features={loadMotionFeatures} strict>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </LazyMotion>
  </React.StrictMode>
);
