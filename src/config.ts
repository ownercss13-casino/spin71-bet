/**
 * Application Configuration
 */

export const APP_CONFIG = {
  DOMAIN: window.location.origin,
  OFFICIAL_DOMAIN: 'https://spin71bet.onrender.com', // User's preferred domain
  SUPPORT_TELEGRAM: 'https://t.me/spin71bet_official',
  MIN_DEPOSIT: 200,
  MIN_WITHDRAW: 500,
};

export const getReferralLink = (referralCode: string) => {
  // Use the official domain as requested by the user for invitation links
  const base = APP_CONFIG.OFFICIAL_DOMAIN;
  
  return `${base}/?ref=${referralCode}`;
};
