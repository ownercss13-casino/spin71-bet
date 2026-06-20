import React, { useState, useEffect } from 'react';
import { Download, Info, X, Share } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    
    // Check if it's iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowInstructions(true);
    }
  };

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
  const isInIframe = window.self !== window.top;

  if (isStandalone) return null;

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-teal-600 text-black px-6 py-3 rounded-xl text-[12px] font-black uppercase tracking-wider shadow-lg hover:from-teal-400 hover:to-teal-500 transition-all active:scale-95 group"
      >
        <Download size={16} className="group-hover:animate-bounce" />
        অ্যাপ ইনস্টল করুন
      </button>

      <AnimatePresence>
        {showInstructions && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInstructions(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-[#16213e] border border-teal-500/30 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-teal-500/20 rounded-2xl">
                      <Download className="text-teal-400" size={24} />
                    </div>
                    <div>
                      <h3 className="text-white font-black text-lg uppercase tracking-tight">অ্যাপ ইনস্টল গাইড</h3>
                      <p className="text-teal-400/60 text-[10px] font-bold uppercase tracking-widest">PWA Installation</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowInstructions(false)}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  {isInIframe ? (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
                      <p className="text-yellow-400 text-sm font-bold leading-relaxed mb-2">
                        আপনি বর্তমানে প্রিভিউ মোডে আছেন।
                      </p>
                      <p className="text-white/70 text-xs leading-relaxed">
                        অ্যাপটি সরাসরি ইনস্টল করতে ব্রাউজারের অ্যাড্রেস বার থেকে লিংকটি কপি করে নতুন ট্যাব বা ব্রাউজারে সরাসরি ওপেন করুন। এরপর আবার এই বাটনে ক্লিক করুন।
                      </p>
                    </div>
                  ) : isIOS ? (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <p className="text-white/80 text-sm font-medium leading-relaxed mb-4">
                        আমাদের অ্যাপটি আপনার আইফোনে ইনস্টল করতে নিচের ধাপগুলো অনুসরণ করুন:
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-white/60 text-xs">
                          <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 font-bold">১</div>
                          <span>নিচের <Share size={14} className="inline mx-1" /> বাটনটি ক্লিক করুন</span>
                        </div>
                        <div className="flex items-center gap-3 text-white/60 text-xs">
                          <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 font-bold">২</div>
                          <span>মেনু থেকে "Add to Home Screen" অপশনটি বেছে নিন</span>
                        </div>
                        <div className="flex items-center gap-3 text-white/60 text-xs">
                          <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 font-bold">৩</div>
                          <span>এরপর "Add" ক্লিক করলেই অ্যাপটি ইনস্টল হয়ে যাবে</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <p className="text-white/80 text-sm font-medium leading-relaxed mb-4">
                        অটোমেটিক ইনস্টল বাটন কাজ না করলে ম্যানুয়ালি ইনস্টল করুন:
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-white/60 text-xs">
                          <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 font-bold">১</div>
                          <span>Chrome ব্রাউজারের উপরে ডানে ৩টি ডট (⋮) ক্লিক করুন</span>
                        </div>
                        <div className="flex items-center gap-3 text-white/60 text-xs">
                          <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 font-bold">২</div>
                          <span>মেনু থেকে "Install App" বা "Add to Home Screen" ক্লিক করুন</span>
                        </div>
                        <div className="flex items-center gap-3 text-white/60 text-xs">
                          <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 font-bold">৩</div>
                          <span>এরপর "Install" ক্লিক করলেই আপনার ফোনে অ্যাপটি চলে আসবে</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3 p-3 bg-teal-400/10 border border-teal-500/20 rounded-xl">
                    <Info size={16} className="text-teal-400 shrink-0 mt-0.5" />
                    <p className="text-teal-400/80 text-[10px] font-bold uppercase leading-tight">
                      অ্যাপ ইনস্টল থাকার পর আপনি সব ধরণের বোনাস ক্লেইম করতে পারবেন।
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowInstructions(false)}
                  className="w-full mt-6 py-4 bg-teal-500 hover:bg-teal-400 text-black font-black uppercase text-xs tracking-widest rounded-2xl transition-all active:scale-[0.98]"
                >
                  বুঝেছি
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
