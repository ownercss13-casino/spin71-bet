/**
 * Application Configuration
 */

export const APP_CONFIG = {
  DOMAIN: window.location.origin,
  SUPPORT_TELEGRAM: 'https://t.me/spin71bet_official',
  MIN_DEPOSIT: 200,
  MIN_WITHDRAW: 500,
};

export const getReferralLink = (referralCode: string) => {
  // Use current dynamic origin
  return `${window.location.origin}/?ref=${referralCode}`;
};

export const getBackendUrl = () => {
  const currentOrigin = window.location.origin;
  if (currentOrigin.includes('run.app')) {
    return currentOrigin;
  }
  if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
    return currentOrigin;
  }
  // Netlify or external custom domains do not host the Node.js SSE engine.
  // We route their backend api/stream requests to our active Cloud Run container.
  return 'https://ais-pre-wxllhxlbpwpt7cv6zg665n-782256449109.asia-southeast1.run.app';
};

