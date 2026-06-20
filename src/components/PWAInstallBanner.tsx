import React from 'react';

interface PWAInstallBannerProps {
  deferredPrompt: any;
  onInstall: () => Promise<void>;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ deferredPrompt, onInstall }) => {
  return null;
};
