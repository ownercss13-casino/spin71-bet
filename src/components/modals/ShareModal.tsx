import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Facebook, Twitter, Link as LinkIcon, Send, MessageCircle } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  text?: string;
  url?: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function ShareModal({ 
  isOpen, 
  onClose, 
  title = "SPIN71BET", 
  text = "Check out SPIN71BET and win big!", 
  url = window.location.origin, 
  showToast 
}: ShareModalProps) {
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      showToast('লিঙ্ক কপি করা হয়েছে! (Link copied!)', 'success');
      onClose();
    } catch (err) {
      showToast('লিঙ্ক কপি করতে সমস্যা হয়েছে।', 'error');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: text,
          url: url,
        });
        showToast('সাফল্যের সাথে শেয়ার করা হয়েছে', 'success');
        onClose();
      } catch (error) {
        if ((error as any).name !== 'AbortError') {
          showToast('শেয়ার করতে সমস্যা হয়েছে।', 'error');
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  const shareLinks = [
    {
      name: 'Facebook',
      icon: <Facebook size={24} />,
      color: 'bg-[#1877F2]',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
    },
    {
      name: 'Twitter',
      icon: <Twitter size={24} />,
      color: 'bg-black border border-white/20',
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
    },
    {
      name: 'WhatsApp',
      icon: <MessageCircle size={24} />,
      color: 'bg-[#25D366]',
      href: `https://api.whatsapp.com/send?text=${encodedText} ${encodedUrl}`
    },
    {
      name: 'Telegram',
      icon: <Send size={24} />,
      color: 'bg-[#0088cc]',
      href: `https://telegram.me/share/url?url=${encodedUrl}&text=${encodedText}`
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full sm:max-w-sm bg-[#1a1a1a] border-t sm:border border-white/10 sm:rounded-[32px] rounded-t-[32px] p-6 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white tracking-tight">শেয়ার করুন (Share)</h2>
              <button 
                onClick={onClose}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content preview */}
            <div className="bg-[#2a2a2a] rounded-2xl p-4 mb-6 border border-white/5">
              <p className="text-white/80 text-sm font-medium mb-2 break-words">
                "{text}"
              </p>
              <div className="text-teal-400 text-xs truncate">
                {url}
              </div>
            </div>

            {/* Social Icons Grid */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {shareLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-105 active:scale-95 ${link.color}`}>
                    {link.icon}
                  </div>
                  <span className="text-[10px] text-white/60 font-medium group-hover:text-white transition-colors">{link.name}</span>
                </a>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button 
                  onClick={handleNativeShare}
                  className="w-full bg-teal-500 hover:bg-teal-400 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <ShareIcon size={18} /> 
                  ডিভাইস শেয়ার (More Options)
                </button>
              )}
              
              <button 
                onClick={handleCopyLink}
                className="w-full bg-[#2a2a2a] hover:bg-[#333] border border-white/10 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Copy size={18} className="text-white/60" /> 
                লিঙ্ক কপি করুন (Copy Link)
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

const ShareIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
    <polyline points="16 6 12 2 8 6"></polyline>
    <line x1="12" y1="2" x2="12" y2="15"></line>
  </svg>
);
