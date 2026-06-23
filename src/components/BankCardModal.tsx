import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Building2, CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { getBackendUrl } from '../config';

interface BankCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function BankCardModal({ isOpen, onClose, userId }: BankCardModalProps) {
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const auth = getAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !auth.currentUser) return;
    
    if (!bankName || !accountNumber || !accountHolderName) {
      setError("Please fill all fields");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`${getBackendUrl()}/api/user/bank/add`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          bankName,
          accountNumber: accountNumber.trim(),
          accountHolderName: accountHolderName.trim()
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to add bank card");
      }
      
      onClose();
    } catch (err: any) {
      console.error("Add bank card error:", err);
      setError(err.message || "Failed to add bank card");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[110] flex items-center justify-center p-6 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[40px] w-full max-w-md overflow-hidden relative"
      >
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-8 text-white">
          <div className="flex justify-between items-center mb-2">
             <h3 className="text-xl font-black uppercase tracking-tight italic">Link New Card</h3>
             <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
               <X size={20} />
             </button>
          </div>
          <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">টাকা উত্তোলনের জন্য আপনার ব্যাংক বা ওয়ালেট যুক্ত করুন</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-2xl flex items-center gap-3 border border-red-100 text-xs font-bold uppercase">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest ml-2">ব্যাংকের নাম (Bank Name)</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-600">
                   <Building2 size={20} />
                </div>
                <select 
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-6 text-gray-800 text-sm focus:border-teal-500 outline-none transition-all font-bold appearance-none"
                  required
                >
                  <option value="" disabled>নির্বাচন করুন</option>
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Rocket">Rocket</option>
                  <option value="Upay">Upay</option>
                  <option value="PayTM">PayTM</option>
                  <option value="UPI">UPI</option>
                  <option value="Google Pay">Google Pay</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest ml-2">অ্যাকাউন্ট নাম্বার (Account No)</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-600">
                   <CreditCard size={20} />
                </div>
                <input 
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-6 text-gray-800 text-sm focus:border-teal-500 outline-none transition-all font-bold"
                  placeholder="01XXXXXXXXX"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest ml-2">অ্যাকাউন্ট হোল্ডার নাম (Holder Name)</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-600">
                   <AlertCircle size={20} />
                </div>
                <input 
                  type="text"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-6 text-gray-800 text-sm focus:border-teal-500 outline-none transition-all font-bold"
                  placeholder="আপনার নাম লিখুন"
                  required
                />
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl">
             <p className="text-[10px] text-amber-800 font-bold leading-relaxed uppercase">
               সতর্কতা: একবার কার্ড যুক্ত করলে তা স্থায়ীভাবে সংরক্ষিত হবে এবং আর পরিবর্তন করা যাবে না। দয়া করে সঠিক তথ্য দিন।
             </p>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-teal-600 text-white font-black py-5 rounded-2xl hover:bg-teal-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-teal-600/20 uppercase tracking-[2px] text-sm"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : "Link My Card"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
