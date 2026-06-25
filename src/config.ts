/**
 * Application Configuration
 */

export const APP_CONFIG = {
  DOMAIN: window.location.origin,
  SUPPORT_TELEGRAM: 'https://t.me/Spin71bot',
  MIN_DEPOSIT: 200,
  MIN_WITHDRAW: 500,
};

export const getReferralLink = (referralCode: string) => {
  // Use current dynamic origin
  return `${window.location.origin}/?ref=${referralCode}`;
};

// Permanent backend (Node server.ts) deployed on Render.
// Configurable at build time via VITE_BACKEND_URL; update the fallback below
// once your Render service URL is known.
const PERMANENT_BACKEND_URL =
  (import.meta.env?.VITE_BACKEND_URL as string | undefined)?.replace(/\/$/, '') ||
  'https://spin71-bet.onrender.com';

export const getBackendUrl = () => {
  const currentOrigin = window.location.origin;

  // If we are already on the backend host itself, use relative paths.
  if (currentOrigin.includes('run.app') || currentOrigin.includes('onrender.com')) {
    return currentOrigin;
  }

  // Local development: the dev server (tsx server.ts) serves the API too.
  if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
    return currentOrigin;
  }

  // Vercel/Netlify/custom domains only host the static frontend. Route all
  // API + SSE requests to the permanent Render backend.
  return PERMANENT_BACKEND_URL;
};

