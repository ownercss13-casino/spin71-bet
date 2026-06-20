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

export const getBackendUrl = () => {
  const currentOrigin = window.location.origin;
  
  // If we are on the actual backend domain (Cloud Run), use relative paths
  if (currentOrigin.includes('run.app')) {
    return currentOrigin;
  }
  
  // Local development
  if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
    return currentOrigin;
  }
  
  // Netlify or external custom domains do not host the Node.js SSE engine.
  // We route their backend api/requests to our active Cloud Run container.
  // We prioritize the Dev URL if we detect we're likely in a developer context, otherwise use Shared Pre.
  const devUrl = 'https://ais-dev-wxllhxlbpwpt7cv6zg665n-782256449109.asia-southeast1.run.app';
  const preUrl = 'https://ais-pre-wxllhxlbpwpt7cv6zg665n-782256449109.asia-southeast1.run.app';
  
  // Fallback to shared preview as standard production bridge
  return preUrl;
};

