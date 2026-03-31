import React, { useState } from 'react';
import { ChevronLeft, Wallet, CreditCard, Building2, Smartphone, ShieldCheck, History, ArrowRight, Copy, Check, AlertCircle, X } from 'lucide-react';

import { updateUserProfile } from '../services/firebaseService';

const paymentMethods = [
  { id: 'bkash', name: 'bKash', icon: Smartphone, color: 'bg-[#e2136e]', bonus: '+5%' },
  { id: 'nagad', name: 'Nagad', icon: Smartphone, color: 'bg-[#f7931e]', bonus: '+5%' },
  { id: 'rocket', name: 'Rocket', icon: Smartphone, color: 'bg-[#8c1515]', bonus: '+2%' },
  { id: 'upay', name: 'Upay', icon: Smartphone, color: 'bg-[#00529b]', bonus: '' },
  { id: 'bank', name: 'Bank Transfer', icon: Building2, color: 'bg-teal-700', bonus: '' },
  { id: 'crypto', name: 'Crypto (USDT)', icon: Wallet, color: 'bg-yellow-600', bonus: '+10%' },
];

const quickAmounts = [500, 1000, 2000, 5000, 10000, 25000];

export default function DepositView({ onTabChange, balance, onBalanceUpdate, setIsLoading, userData }: { onTabChange: (tab: any) => void, balance: number, onBalanceUpdate: (amount: number) => void, setIsLoading: (loading: boolean) => void, userData: any }) {
  const [selectedMethod, setSelectedMethod] = useState('nagad');
  const [amount, setAmount] = useState('1000');
  const [trxId, setTrxId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [showSystemClosedPopup, setShowSystemClosedPopup] = useState(false);

  const handleDeposit = async () => {
    if (selectedMethod !== 'nagad' && selectedMethod !== 'bkash') {
      alert('এই মেথডটি খুব শীঘ্রই আসছে (Upcoming)! শুধুমাত্র বিকাশ এবং নগদ চালু আছে।');
      return;
    }

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount < 100 || depositAmount > 25000) {
      alert('সর্বনিম্ন ডিপোজিট ১০০ টাকা এবং সর্বোচ্চ ২৫,০০০ টাকা।');
      return;
    }

    if (!trxId.trim()) {
      alert('দয়া করে ট্রানজেকশন আইডি (TrxID) দিন।');
      return;
    }

    if (!senderNumber.trim()) {
      alert('দয়া করে সেন্ডার নাম্বার দিন (যে নাম্বার থেকে টাকা পাঠিয়েছেন)।');
      return;
    }

    setIsLoading(true);
    try {
      if (userData?.id) {
        await updateUserProfile(userData.id, { hasMadeDeposit: true });
      }
      setTimeout(() => {
        setIsLoading(false);
        onBalanceUpdate(balance + depositAmount);
        alert('ডিপোজিট রিকোয়েস্ট সফল হয়েছে! আপনার ব্যালেন্স আপডেট হয়েছে।');
        onTabChange('home');
      }, 990);
    } catch (error) {
      setIsLoading(false);
      console.error("Error updating deposit status:", error);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-[#0b0b0b]">
      {/* Header */}
      <div className="bg-[#128a61] p-4 pt-6 rounded-b-3xl shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-yellow-400/20 rounded-full blur-3xl"></div>
        
        <div className="flex justify-between items-center relative z-10 mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onTabChange('home')}
              className="p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors text-white backdrop-blur-sm"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-2xl font-black italic tracking-tighter text-white drop-shadow-md">
              SPIN71 <span className="text-yellow-400">DEPOSIT</span>
            </h2>
          </div>
          <button className="bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors backdrop-blur-sm">
            <History size={20} className="text-white" />
          </button>
        </div>

        {/* Current Balance Card */}
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-white/10 relative z-10 flex justify-between items-center">
          <div>
            <p className="text-teal-100 text-sm mb-1">বর্তমান ব্যালেন্স</p>
            <p className="text-3xl font-black text-white">৳ {balance.toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/50">
            <Wallet size={24} className="text-yellow-400" />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Payment Methods */}
        <div>
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <CreditCard size={18} className="text-teal-400" />
            পেমেন্ট মেথড নির্বাচন করুন
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {paymentMethods.map(method => (
              <button
                key={method.id}
                onClick={() => {
                  if (method.id !== 'nagad' && method.id !== 'bkash') {
                    setShowSystemClosedPopup(true);
                    return;
                  }
                  setSelectedMethod(method.id);
                }}
                className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                  selectedMethod === method.id 
                    ? 'bg-[#1b1b1b] border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.2)]' 
                    : 'bg-[#1b1b1b] border-white/5 hover:border-white/20'
                }`}
              >
                {method.bonus && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-[#1b1b1b] animate-pulse">
                    {method.bonus}
                  </span>
                )}
                <div className={`w-10 h-10 rounded-full ${method.color} flex items-center justify-center shadow-lg`}>
                  <method.icon size={20} className="text-white" />
                </div>
                <span className="text-xs font-medium text-gray-300">{method.name}</span>
                {selectedMethod === method.id && (
                  <div className="absolute inset-0 border-2 border-yellow-400 rounded-xl pointer-events-none"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Instructions & Form */}
        {['nagad', 'bkash'].includes(selectedMethod) && (() => {
          const isBkash = selectedMethod === 'bkash';
          const theme = isBkash ? {
            bg: 'bg-rose-500',
            bgHover: 'hover:bg-rose-600',
            text: 'text-rose-400',
            border: 'border-rose-500',
            lightBg: 'bg-rose-500/10',
            lightBorder: 'border-rose-500/30',
            number: '01860137045',
            name: 'বিকাশ'
          } : {
            bg: 'bg-orange-500',
            bgHover: 'hover:bg-orange-600',
            text: 'text-orange-400',
            border: 'border-orange-500',
            lightBg: 'bg-orange-500/10',
            lightBorder: 'border-orange-500/30',
            number: '01789527096',
            name: 'নগদ'
          };

          return (
            <div className="bg-[#1b1b1b] p-4 rounded-2xl border border-white/5 space-y-4">
              <div className={`${theme.lightBg} border ${theme.lightBorder} p-4 rounded-xl`}>
                <p className={`${theme.text} text-sm font-bold mb-2`}>{theme.name} সেন্ড মানি (Send Money)</p>
                <div className="flex items-center justify-between bg-black/50 p-3 rounded-lg border border-white/10">
                  <span className="text-white font-mono text-lg tracking-wider">{theme.number}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(theme.number);
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                    className={`${theme.bg} ${theme.bgHover} text-white px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1`}
                  >
                    {isCopied ? <Check size={14} /> : <Copy size={14} />}
                    {isCopied ? 'কপি হয়েছে' : 'কপি করুন'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">উপরের নাম্বারে সেন্ড মানি করার পর নিচের তথ্যগুলো পূরণ করুন।</p>
              </div>

              {/* Amount Selection */}
              <div>
                <h3 className="text-white font-bold mb-3 text-sm">জমার পরিমাণ (৳)</h3>
                <div className="relative mb-3">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">৳</span>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white font-bold text-xl focus:outline-none focus:${theme.border} transition-colors`}
                    placeholder="100 - 25000"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {quickAmounts.map(amt => (
                    <button
                      key={amt}
                      onClick={() => setAmount(amt.toString())}
                      className={`py-2 rounded-lg font-bold text-sm transition-colors ${
                        amount === amt.toString()
                          ? `${theme.bg} text-white`
                          : 'bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* TrxID Input */}
              <div>
                <h3 className="text-white font-bold mb-2 text-sm">ট্রানজেকশন আইডি (TrxID)</h3>
                <input 
                  type="text" 
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  className={`w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white font-mono focus:outline-none focus:${theme.border} transition-colors`}
                  placeholder="যেমন: 8A7B6C5D4E"
                />
              </div>

              {/* Sender Number Input */}
              <div>
                <h3 className="text-white font-bold mb-2 text-sm">সেন্ডার নাম্বার (যে নাম্বার থেকে টাকা পাঠিয়েছেন)</h3>
                <input 
                  type="tel" 
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value)}
                  className={`w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white font-mono focus:outline-none focus:${theme.border} transition-colors`}
                  placeholder="01XXXXXXXXX"
                />
              </div>

              <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-xl flex items-start gap-3">
                <ShieldCheck size={20} className="text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-200 leading-relaxed">
                  আপনার লেনদেন 100% সুরক্ষিত। জমা করার পর সাধারণত ১-৫ মিনিটের মধ্যে ব্যালেন্স যোগ হয়।
                </p>
              </div>
            </div>
          );
        })()}

        {/* Submit Button */}
        <button 
          onClick={handleDeposit}
          className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-black text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(250,204,21,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          জমা করুন <ArrowRight size={20} />
        </button>
      </div>

      {/* System Closed Popup */}
      {showSystemClosedPopup && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
          <div className="bg-teal-900 p-8 rounded-3xl text-center relative shadow-2xl border-2 border-red-500 max-w-sm w-full animate-in zoom-in duration-300">
            <button onClick={() => setShowSystemClosedPopup(false)} className="absolute top-4 right-4 text-teal-300 hover:text-white">
              <X size={24} />
            </button>
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(239,68,68,0.4)]">
              <AlertCircle size={40} className="text-white" />
            </div>
            <h3 className="text-2xl font-black mb-2 text-white italic">সিস্টেম বন্ধ!</h3>
            <p className="text-teal-200 text-lg mb-6">এই পেমেন্ট সিস্টেমটি আপাতত বন্ধ আছে।</p>
            <button 
              onClick={() => setShowSystemClosedPopup(false)}
              className="w-full bg-red-500 text-white font-black py-3 rounded-xl hover:bg-red-400 transition-colors"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
