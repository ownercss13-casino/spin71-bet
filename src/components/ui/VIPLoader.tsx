import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Lock, CheckCircle2, Loader2, ArrowRightLeft } from 'lucide-react';

interface VIPLoaderProps {
  isVisible: boolean;
  type: 'deposit' | 'withdraw';
}

export default function VIPLoader({ isVisible, type }: VIPLoaderProps) {
  const [step, setStep] = useState(0);

  const steps = type === 'deposit' ? [
    { text: "Securing Connection...", icon: Lock },
    { text: "Verifying Information...", icon: ShieldCheck },
    { text: "Processing Deposit...", icon: ArrowRightLeft },
    { text: "Finalizing...", icon: Loader2 }
  ] : [
    { text: "Verifying Authentication...", icon: Lock },
    { text: "Checking Balance...", icon: ShieldCheck },
    { text: "Processing Withdrawal...", icon: ArrowRightLeft },
    { text: "Finalizing...", icon: Loader2 }
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isVisible) {
      setStep(0);
      interval = setInterval(() => {
        setStep(prev => Math.min(prev + 1, steps.length - 1));
      }, 700); // changes text every 700ms
    }
    return () => clearInterval(interval);
  }, [isVisible, steps.length, type]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-[320px] bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] rounded-3xl p-6 border border-white/10 shadow-[0_0_50px_rgba(234,179,8,0.2)] flex flex-col items-center"
          >
            {/* Cool rotating VIP spinner */}
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 rounded-full border-[3px] border-white/5 border-t-yellow-400 border-r-yellow-400 animate-spin" style={{ animationDuration: '3s' }}></div>
              <div className="absolute inset-2 rounded-full border-[3px] border-white/5 border-b-[#20b2aa] border-l-[#20b2aa] animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
              <div className="absolute inset-0 flex items-center justify-center text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">
                <ShieldCheck size={36} className="animate-pulse" />
              </div>
            </div>

            <h3 className="text-xl font-black italic tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 mb-6 uppercase drop-shadow-md">
              {type === 'deposit' ? 'VIP Deposit' : 'VIP Withdrawal'}
            </h3>

            {/* Stepper text */}
            <div className="w-full space-y-4">
              {steps.map((s, idx) => {
                const isActive = idx === step;
                const isPassed = idx < step;
                const Icon = s.icon;
                
                return (
                  <div key={idx} className={`flex items-center gap-3 transition-colors duration-300 ${isPassed ? 'text-green-400' : isActive ? 'text-white' : 'text-white/20'}`}>
                    <div className="flex-shrink-0">
                      {isPassed ? <CheckCircle2 size={18} /> : isActive ? <Icon size={18} className="animate-pulse" /> : <div className="w-4 h-4 rounded-full border-2 border-current ml-[1px]"></div>}
                    </div>
                    <span className={`text-[13px] font-bold ${isActive ? 'animate-pulse text-yellow-400/90' : ''}`}>{s.text}</span>
                  </div>
                )
              })}
            </div>

            <div className="mt-8 w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-[#20b2aa] to-yellow-400"
                initial={{ width: "0%" }}
                animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            
            <p className="mt-5 text-[10px] font-mono text-white/30 tracking-widest uppercase">Secure 256-bit Encrypted</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
