import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Upload, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  X,
  FileText,
  CreditCard,
  UserCheck,
  ChevronRight,
  Info,
  Loader2,
  Lock,
  Smartphone,
  BadgeCheck
} from 'lucide-react';

import { ToastType } from '../types';

interface KYCVerificationViewProps {
  userData: any;
  onBack: () => void;
  showToast: (msg: string, type?: ToastType) => void;
  onUpdateUser: (updates: any) => Promise<void>;
}

export default function KYCVerificationView({ userData, onBack, showToast, onUpdateUser }: KYCVerificationViewProps) {
  const [step, setStep] = useState(1);
  const [docType, setDocType] = useState<'nid' | 'passport' | 'driving'>('nid');
  const [isUploading, setIsUploading] = useState(false);
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);

  const handleFileUpload = (type: 'front' | 'back' | 'selfie') => {
    // In a real app, this would open a camera/file picker
    // For this implementation, we simulate it
    setIsUploading(true);
    setTimeout(() => {
      const mockImage = "https://www.image2url.com/r2/default/images/1779828873931-409cfe92-d243-4926-91bd-67da3a1e0adc.png";
      if (type === 'front') setFrontImage(mockImage);
      else if (type === 'back') setBackImage(mockImage);
      else if (type === 'selfie') setSelfieImage(mockImage);
      setIsUploading(false);
      showToast("ছবি আপলোড সফল হয়েছে", "success");
    }, 1500);
  };

  const handleSubmit = async () => {
    if (!frontImage || !selfieImage || (docType !== 'passport' && !backImage)) {
      showToast("সবগুলো প্রয়োজনীয় ছবি আপলোড করুন", "error");
      return;
    }

    setIsUploading(true);
    try {
      await onUpdateUser({
        kycStatus: 'pending',
        kycSubmittedAt: new Date().toISOString(),
        kycDocumentType: docType
      });
      showToast("আবেদন সফলভাবে গৃহীত হয়েছে। ২৪ ঘন্টার মধ্যে যাচাই করা হবে।", "success");
      setStep(4); // Success step
    } catch (err) {
      showToast("আবেদন পাঠাতে সমস্যা হয়েছে", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const renderStep1 = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-500/10 rounded-3xl flex items-center justify-center text-blue-500 mx-auto mb-4">
          <ShieldCheck size={32} />
        </div>
        <h2 className="text-2xl font-black text-white italic">অ্যাকাউন্ট ভেরিফিকেশন</h2>
        <p className="text-gray-400 text-sm mt-1">আপনার পরিচয় নিশ্চিত করতে নিচের যেকোনো একটি ডকুমেন্ট বেছে নিন</p>
      </div>

      <div className="grid gap-3">
        {[
          { id: 'nid', name: 'জাতীয় পরিচয়পত্র (NID)', icon: <CreditCard size={20} />, active: docType === 'nid' },
          { id: 'passport', name: 'পাসপোর্ট (Passport)', icon: <FileText size={20} />, active: docType === 'passport' },
          { id: 'driving', name: 'ড্রাইভিং লাইসেন্স (DL)', icon: <Smartphone size={20} />, active: docType === 'driving' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setDocType(item.id as any)}
            className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
              item.active 
                ? 'bg-blue-600/20 border-blue-500 text-white' 
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.active ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                {item.icon}
              </div>
              <span className="font-bold">{item.name}</span>
            </div>
            {item.active && <CheckCircle2 size={20} className="text-blue-400" />}
          </button>
        ))}
      </div>

      <button
        onClick={() => setStep(2)}
        className="w-full bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95"
      >
        পরবর্তী ধাপ (Next)
      </button>

      <div className="flex items-center gap-2 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
        <Info size={16} className="text-yellow-500 shrink-0" />
        <p className="text-[10px] text-yellow-500/80 font-medium">আপনার ডাটা এনক্রিপশন প্রযুক্তির মাধ্যমে সুরক্ষিত থাকবে।</p>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setStep(1)} className="p-2 bg-white/5 rounded-xl text-white">
          <ArrowLeft size={20} />
        </button>
        <h3 className="text-lg font-black text-white italic">ডকুমেন্ট আপলোড করুন</h3>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <label className="text-xs text-gray-400 font-bold ml-1">সামনের অংশ (Front Side)</label>
          <div 
            onClick={() => handleFileUpload('front')}
            className={`aspect-[1.6/1] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
              frontImage ? 'border-green-500 bg-green-500/10' : 'border-white/20 bg-white/5 hover:bg-white/10'
            }`}
          >
            {frontImage ? (
              <img src={frontImage} className="w-full h-full object-cover rounded-[22px]" alt="front" />
            ) : (
              <>
                <Upload size={32} className="text-gray-500 mb-2" />
                <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">ট্যাপ করে ছবি তুলুন বা আপলোড দিন</span>
              </>
            )}
          </div>
        </div>

        {docType !== 'passport' && (
          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-bold ml-1">পেছনের অংশ (Back Side)</label>
            <div 
              onClick={() => handleFileUpload('back')}
              className={`aspect-[1.6/1] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                backImage ? 'border-green-500 bg-green-500/10' : 'border-white/20 bg-white/5 hover:bg-white/10'
              }`}
            >
              {backImage ? (
                <img src={backImage} className="w-full h-full object-cover rounded-[22px]" alt="back" />
              ) : (
                <>
                  <Upload size={32} className="text-gray-500 mb-2" />
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">ট্যাপ করে ছবি তুলুন বা আপলোড দিন</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl space-y-2">
        <div className="flex items-center gap-2 text-blue-400">
          <AlertCircle size={16} />
          <span className="text-[10px] font-black uppercase">নির্দেশনা:</span>
        </div>
        <ul className="text-[10px] text-gray-500 font-medium space-y-1">
          <li>• লেখাগুলো স্পষ্ট হতে হবে।</li>
          <li>• পর্যাপ্ত আলোতে ছবি তুলুন।</li>
          <li>• ডকুমেন্ট সম্পূর্ণ ফ্রেমের মধ্যে রাখুন।</li>
        </ul>
      </div>

      <button
        disabled={!frontImage || (docType !== 'passport' && !backImage)}
        onClick={() => setStep(3)}
        className="w-full bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
      >
        পরবর্তী ধাপ (Next)
      </button>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setStep(2)} className="p-2 bg-white/5 rounded-xl text-white">
          <ArrowLeft size={20} />
        </button>
        <h3 className="text-lg font-black text-white italic">সেলফি ভেরিফিকেশন</h3>
      </div>

      <div className="text-center space-y-4">
        <div className="w-48 h-48 mx-auto rounded-full border-4 border-blue-500/30 p-2 overflow-hidden bg-white/5 relative">
          {selfieImage ? (
            <img src={selfieImage} className="w-full h-full object-cover rounded-full" alt="selfie" />
          ) : (
            <div className="w-full h-full rounded-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/20">
              <Camera size={40} className="text-gray-600" />
              <span className="text-[8px] text-gray-600 font-black uppercase">ফেস আইডি</span>
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Loader2 className="animate-spin text-white" />
            </div>
          )}
        </div>
        
        {!selfieImage && (
          <button
            onClick={() => handleFileUpload('selfie')}
            className="inline-flex items-center gap-2 bg-white text-black font-black px-6 py-3 rounded-full text-xs hover:bg-gray-100 transition-all"
          >
            <Camera size={16} /> ছবি তুলুন (Take Selfie)
          </button>
        )}
      </div>

      <div className="bg-white/5 p-5 rounded-3xl border border-white/10 space-y-3">
        <h4 className="text-[10px] font-black text-blue-400 uppercase">কিভাবে করবেন?</h4>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0 font-bold text-xs italic">1</div>
            <p className="text-xs text-gray-400 font-medium">একটি হাত দিয়ে ডকুমেন্ট ধরুন এবং ক্যামেরা সরাসরি মুখের সামনে রাখুন।</p>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0 font-bold text-xs italic">2</div>
            <p className="text-xs text-gray-400 font-medium">নিশ্চিত করুন যে আপনার মুখ এবং ডকুমেন্ট স্পষ্ট দেখা যাচ্ছে।</p>
          </div>
        </div>
      </div>

      <button
        disabled={!selfieImage || isUploading}
        onClick={handleSubmit}
        className="w-full bg-green-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-green-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isUploading ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={18} /> আবেদন জমা দিন</>}
      </button>
    </motion.div>
  );

  const renderSuccess = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12 space-y-8"
    >
      <div className="relative inline-block">
        <div className="w-24 h-24 bg-green-500 rounded-[32px] flex items-center justify-center text-white mx-auto shadow-2xl shadow-green-500/40 animate-bounce">
          <CheckCircle2 size={48} />
        </div>
        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-xl border border-blue-100">
          <BadgeCheck size={24} />
        </div>
      </div>
      
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-white italic">অভিনন্দন!</h2>
        <p className="text-gray-400 text-sm font-medium">আপনার আবেদন সফলভাবে জমা হয়েছে।</p>
      </div>

      <div className="bg-white/5 p-6 rounded-[32px] border border-white/10 space-y-4 max-w-xs mx-auto">
        <div className="flex items-center justify-between text-xs font-bold px-2">
          <span className="text-gray-500">স্ট্যাটাস:</span>
          <span className="text-yellow-500 italic">যাচাইাধীন (Pending)</span>
        </div>
        <div className="h-0.5 bg-white/5 w-full"></div>
        <p className="text-[10px] text-gray-500 leading-relaxed font-bold">আপনার দেওয়া তথ্যগুলো পরীক্ষা করা হচ্ছে। সচরাচর ১২-২৪ ঘন্টার মধ্যে ভেরিফিকেশন সম্পন্ন হয়।</p>
      </div>

      <button
        onClick={onBack}
        className="w-full bg-white text-black font-black py-4 rounded-2xl shadow-xl transition-all active:scale-95 px-8"
      >
        প্রোফাইলে ফিরে যান
      </button>

      <div className="flex items-center justify-center gap-2 text-gray-500">
        <Lock size={12} />
        <span className="text-[9px] font-black uppercase tracking-widest">End-to-End Encrypted Data</span>
      </div>
    </motion.div>
  );

  return (
    <div className="fixed inset-0 z-[150] bg-[#0d1a29] p-6 overflow-y-auto">
      <div className="max-w-md mx-auto min-h-full flex flex-col py-8">
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-blue-500" size={24} />
            <span className="text-white font-black italic uppercase tracking-tighter text-lg">{userData?.casinoName || 'SPIN71'} VIP</span>
          </div>
          <button 
            onClick={onBack} 
            className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white hover:bg-red-500 transition-all border border-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {userData?.kycStatus === 'pending' ? renderSuccess() : (
          <>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderSuccess()}
          </>
        )}

        <div className="mt-auto pt-10 text-center">
          <p className="text-[10px] text-gray-600 font-bold">
            © 2026 {userData?.casinoName || 'SPIN71'} SECURE VERIFICATION PORTAL
          </p>
        </div>
      </div>
    </div>
  );
}
