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
  // Use relative paths if we are on the same origin (standard for AI Studio apps)
  return '';
};

