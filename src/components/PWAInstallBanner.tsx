import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Smartphone } from 'lucide-react';

interface PWAInstallBannerProps {
  deferredPrompt: any;
  onInstall: () => Promise<void>;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ deferredPrompt, onInstall }) => {
  const [isDismissed, setIsDismissed] = useState(false);

  const handleInstallClick = async () => {
    await onInstall();
    setIsDismissed(true);
  };

  const closeBanner = () => {
    setIsDismissed(true);
    // Optionally store in session storage to not bug them again this session
    sessionStorage.setItem('pwa-banner-dismissed', 'true');
  };

  // Check if it's already dismissed in session
  const isPreviouslyDismissed = typeof window !== 'undefined' && sessionStorage.getItem('pwa-banner-dismissed') === 'true';

  if (!deferredPrompt || isDismissed || isPreviouslyDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-24 left-4 right-4 z-[100] md:left-auto md:right-6 md:w-80"
        id="pwa-install-banner"
      >
        <div className="bg-[#1a2c3e] border border-blue-500/30 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-4 flex items-center gap-4 relative overflow-hidden">
          {/* Background Accent */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-3xl rounded-full"></div>
          
          <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center shrink-0 border border-blue-500/20">
            <Smartphone className="text-blue-400" size={24} />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-sm leading-tight uppercase italic tracking-tighter">Install Spin71 App</h3>
            <p className="text-gray-400 text-[10px] mt-0.5 truncate uppercase font-bold tracking-widest text-[#00e5ff]">Faster Access & Rewards</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shadow-lg shadow-blue-900/40 active:scale-95"
              id="pwa-install-button"
            >
              <Download size={14} />
              JOIN
            </button>
            
            <button
              onClick={closeBanner}
              className="p-1 hover:bg-white/5 text-gray-400 rounded-lg transition-colors"
              id="pwa-close-button"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
