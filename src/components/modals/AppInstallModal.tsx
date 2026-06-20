import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Download, Smartphone, HelpCircle, ArrowRight, CheckCircle2, 
  Share2, PlusSquare, MoreVertical, Zap, Shield, Sparkles, Monitor
} from 'lucide-react';

interface AppInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstall: () => Promise<void>;
}

export default function AppInstallModal({ isOpen, onClose, deferredPrompt, onInstall }: AppInstallModalProps) {
  const [activePlatform, setActivePlatform] = useState<'android' | 'ios' | 'pc'>('android');

  // Auto detect platform on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(userAgent)) {
        setActivePlatform('ios');
      } else if (/win|mac|linux/.test(userAgent) && !/android|iphone|ipad|ipod/.test(userAgent)) {
        setActivePlatform('pc');
      } else {
        setActivePlatform('android');
      }
    }
  }, [isOpen]);

  const appBenefits = [
    { title: "১০০% নিরাপদ ও সুরক্ষিত", desc: "কোনো ক্ষতিকারক অনুমতি ছাড়াই নিরাপদ ব্রাউজার স্যান্ডবক্স ব্যবহার করে।" },
    { title: "সুপার ফাস্ট অ্যান্ড লাইট", desc: "কোনো স্টোরেজ স্পেস প্রয়োজন নেই, ক্যাশে মেমরি থেকে সরাসরি চলে।" },
    { title: "অটো আপডেট সুবিধা", desc: "প্লে স্টোর বা এপিকে ফাইলের মতো বারবার ডাউনলোড ছাড়াই অটোমেটিক নতুন ফিচার লোড হয়।" },
    { title: "হোম স্ক্রিন শর্টকাট", desc: "আপনার ফোনের হোম স্ক্রিনে একটি রিয়েল অ্যাপ আইকন যুক্ত হবে।" }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-[#0d1a29] rounded-[40px] overflow-hidden border border-[#23354b] shadow-2xl z-10"
          >
            {/* Header */}
            <div className="p-6 border-b border-[#1e2f42] flex justify-between items-center bg-gradient-to-r from-teal-500/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-400">
                  <Smartphone size={22} className="animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white italic tracking-tight">
                    মোবাইল অ্যাপ ডাউনলোড
                  </h2>
                  <p className="text-xs text-teal-300 font-bold uppercase tracking-widest mt-0.5">
                    SPIN71 BET✨ Web App Installation
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2.5 bg-[#14253a] border border-[#23354b] rounded-xl text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[64vh] overflow-y-auto space-y-6 custom-scrollbar">
              
              {/* Main Quick Trigger if Browser supports PWA popup */}
              {deferredPrompt ? (
                <div className="bg-gradient-to-r from-teal-900/40 to-emerald-900/40 p-5 rounded-3xl border border-teal-500/30 text-center space-y-4">
                  <div className="inline-flex p-3 rounded-full bg-teal-500/20 text-teal-400 animate-bounce">
                    <Download size={28} />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-base">আপনার ব্রাউজার অ্যাপ সাপোর্ট করছে!</h3>
                    <p className="text-teal-200 text-[11px] font-medium leading-relaxed mt-1">
                      নিচের বাটনে ১-ক্লিকে আমাদের অফিসিয়াল লাইট স্পিড অ্যাপটি ইন্সটল করে নিন।
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      await onInstall();
                      onClose();
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-yellow-500/20 transition-all font-sans text-xs active:scale-95"
                  >
                    এখনই অ্যাপ ইন্সটল করুন ✨
                  </button>
                </div>
              ) : (
                <div className="bg-[#14253a]/40 p-4 rounded-3xl border border-[#23354b] text-center space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-500/10 text-teal-300 rounded-full text-[10px] font-black uppercase">
                    <Sparkles size={10} />
                    PWA App System Active
                  </div>
                  <h3 className="text-white font-black text-sm">SPIN71 BET✨ মোবাইল ব্রাউজার অ্যাপ</h3>
                  <p className="text-gray-400 text-[10px] leading-relaxed px-4">
                    প্লেস্টোর ছাড়াও সরাসরি ব্রাউজারের মাধ্যমে আসল অ্যাপ বানাতে নিচের গাইডটি অনুসরণ করুন। এটি সাধারণ অ্যাপের মতোই কাজ করবে।
                  </p>
                </div>
              )}

              {/* Platform Selector Buttons */}
              <div className="grid grid-cols-3 gap-2 bg-[#09111b] p-1.5 rounded-2xl border border-[#1e2f42]/70">
                <button
                  onClick={() => setActivePlatform('android')}
                  className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${activePlatform === 'android' ? 'bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-lg shadow-teal-500/20' : 'text-gray-400 hover:bg-white/5'}`}
                >
                  <Smartphone size={14} /> Android
                </button>
                <button
                  onClick={() => setActivePlatform('ios')}
                  className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${activePlatform === 'ios' ? 'bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-lg shadow-teal-500/20' : 'text-gray-400 hover:bg-white/5'}`}
                >
                  <Smartphone size={14} /> iOS / iPhone
                </button>
                <button
                  onClick={() => setActivePlatform('pc')}
                  className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${activePlatform === 'pc' ? 'bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-lg shadow-teal-500/20' : 'text-gray-400 hover:bg-white/5'}`}
                >
                  <Monitor size={14} /> Computer
                </button>
              </div>

              {/* Instructions Guide */}
              <div className="space-y-4">
                <h4 className="text-white text-xs font-black uppercase tracking-wider">কিভাবে আপনার ফোনে ইনস্টল করবেন:</h4>
                
                {activePlatform === 'android' && (
                  <div className="space-y-3 bg-[#0a121d] p-4 rounded-3xl border border-[#1d2d3e]">
                    <div className="flex gap-3.5 items-start">
                      <div className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                      <div className="space-y-1">
                        <p className="text-white font-bold text-xs">ব্রাউজার মেনু খুলুন</p>
                        <p className="text-gray-400 text-[10px] leading-relaxed">
                          Chrome ব্রাউজারের উপরে ডান কোণায় থাকা <span className="inline-flex p-0.5 bg-white/10 rounded"><MoreVertical size={12} className="text-white inline" /></span> মেনু বাটনে প্রেস করুন।
                        </p>
                      </div>
                    </div>
                    <div className="h-px bg-[#1d2d3e]/50 my-1 ml-9"></div>
                    <div className="flex gap-3.5 items-start">
                      <div className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                      <div className="space-y-1">
                        <p className="text-white font-bold text-xs">Add to Home Screen সিলেক্ট করুন</p>
                        <p className="text-gray-400 text-[10px] leading-relaxed">
                          অপশনগুলোর মধ্য থেকে <span className="text-yellow-400 font-bold">"Add to Home screen"</span> (বা <span className="text-teal-400 font-bold">"इन्स्टॉल करें"</span> / <span className="text-teal-400 font-bold">"Install App"</span>) অপশনে ক্লিক করুন।
                        </p>
                      </div>
                    </div>
                    <div className="h-px bg-[#1d2d3e]/50 my-1 ml-9"></div>
                    <div className="flex gap-3.5 items-start">
                      <div className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                      <div className="space-y-1">
                        <p className="text-white font-bold text-xs">ইন্সটল সম্পন্ন করুন</p>
                        <p className="text-gray-400 text-[10px] leading-relaxed">
                          পপআপ কনফার্মেশন ডায়ালগে <span className="text-white font-bold">"Install"</span> বা "Add" বাটনে ক্লিক করুন। কয়েক সেকেন্ডের মধ্যে ফোনে SPIN71 BET✨ অ্যাপ হিসেবে সেট হয়ে যাবে!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activePlatform === 'ios' && (
                  <div className="space-y-3 bg-[#0a121d] p-4 rounded-3xl border border-[#1d2d3e]">
                    <div className="flex gap-3.5 items-start">
                      <div className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                      <div className="space-y-1">
                        <p className="text-white font-bold text-xs">Share (শেয়ার) আইকনটি চাপুন</p>
                        <p className="text-gray-400 text-[10px] leading-relaxed">
                          Safari ব্রাউজারের ঠিক নিচে মাঝখানে থাকা <span className="inline-flex p-1 bg-white/10 rounded text-teal-300"><Share2 size={13} /></span> শেয়ার বাটনটি প্রেস করুন।
                        </p>
                      </div>
                    </div>
                    <div className="h-px bg-[#1d2d3e]/50 my-1 ml-9"></div>
                    <div className="flex gap-3.5 items-start">
                      <div className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                      <div className="space-y-1">
                        <p className="text-white font-bold text-xs">Add to Home Screen বাছাই করুন</p>
                        <p className="text-gray-400 text-[10px] leading-relaxed">
                          নিচের দিকে স্ক্রোল করে <span className="text-yellow-400 font-bold">"Add to Home Screen"</span> অপশনে স্পর্শ করুন <span className="inline-flex p-1 bg-white/10 rounded text-yellow-500"><PlusSquare size={13} /></span>।
                        </p>
                      </div>
                    </div>
                    <div className="h-px bg-[#1d2d3e]/50 my-1 ml-9"></div>
                    <div className="flex gap-3.5 items-start">
                      <div className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                      <div className="space-y-1">
                        <p className="text-white font-bold text-xs">Add (সংযুক্তি) তে চাপুন</p>
                        <p className="text-gray-400 text-[10px] leading-relaxed">
                          স্ক্রিনের উপরের ডানদিকের কোণা থেকে <span className="text-white font-bold">"Add"</span> বাটনে চাপ দিন। আপনার আইফোনের স্ক্রিনে আসল অ্যাপ আইকন আকারে এটি পিন হয়ে যাবে।
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activePlatform === 'pc' && (
                  <div className="space-y-3 bg-[#0a121d] p-4 rounded-3xl border border-[#1d2d3e]">
                    <div className="flex gap-3.5 items-start">
                      <div className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                      <div className="space-y-1">
                        <p className="text-white font-bold text-xs">অ্যাড্রেস বার আইকন চেক করুন</p>
                        <p className="text-gray-400 text-[10px] leading-relaxed">
                          আপনার ব্রাউজারের ইউআরএল লিঙ্ক এড্রেস বারের ঠিক ডান কোণায় থাকা কুয়াড-স্টার বা মনিটর আইকনটি দেখুন।
                        </p>
                      </div>
                    </div>
                    <div className="h-px bg-[#1d2d3e]/50 my-1 ml-9"></div>
                    <div className="flex gap-3.5 items-start">
                      <div className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                      <div className="space-y-1">
                        <p className="text-white font-bold text-xs">"Install SPIN71 BET✨" এ ক্লিক করুন</p>
                        <p className="text-gray-400 text-[10px] leading-relaxed">
                          আইকনটিতে প্রেস করলে <span className="text-yellow-400 font-bold">"Install"</span> করার জন্য একটি ছোট ডায়ালগ বক্স শো হবে, সেটি কনফার্ম করুন।
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Benefits Section */}
              <div className="space-y-3">
                <h4 className="text-white text-xs font-black uppercase tracking-wider">আমাদের অ্যাপ ব্যবহারের সুবিধাসমূহ :</h4>
                <div className="grid grid-cols-2 gap-3.5">
                  {appBenefits.map((b, idx) => (
                    <div key={idx} className="bg-[#14253a]/20 p-3.5 rounded-2xl border border-[#1e2f42]/50 flex gap-2.5 items-start">
                      <CheckCircle2 size={14} className="text-teal-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="text-white font-bold text-[10px]">{b.title}</p>
                        <p className="text-gray-400 text-[9px] leading-relaxed leading-snug">{b.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-6 bg-[#14253a]/60 border-t border-[#1e2f42] flex justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-gray-400 text-xs">
                <Zap size={14} className="text-yellow-500" />
                <span>সাইজ মাত্র ২ এমবি</span>
              </div>
              <button 
                onClick={onClose}
                className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 active:scale-95 text-white text-xs font-extrabold uppercase rounded-xl transition-all shadow-md shadow-teal-500/10"
              >
                বন্ধ করুন (Close)
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
