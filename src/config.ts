/**
 * Application Configuration
 */

export const APP_CONFIG = {
  DOMAIN: window.location.origin,
  OFFICIAL_DOMAINS: [
    'https://ais-pre-wxllhxlbpwpt7cv6zg665n-782256449109.asia-southeast1.run.app',
    'https://spin71bet1.vercel.app',
    'https://spin71bet.onrender.com'
  ],
  SUPPORT_TELEGRAM: 'https://t.me/spin71bet_official',
  MIN_DEPOSIT: 200,
  MIN_WITHDRAW: 500,
};

export const getReferralLink = (referralCode: string) => {
  // Use current origin if it's one of the official domains, otherwise default to the primary one
  const currentOrigin = window.location.origin;
  const base = APP_CONFIG.OFFICIAL_DOMAINS.includes(currentOrigin) 
    ? currentOrigin 
    : APP_CONFIG.OFFICIAL_DOMAINS[0];
  
  return `${base}/?ref=${referralCode}`;
};
