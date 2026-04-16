import React, { useState, useEffect } from 'react';
import { ChevronLeft, ClipboardList, MessageCircle, Check, Copy, ShieldCheck, ArrowRight, Loader2, X } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { updateUserProfile, addNotification, updateRequiredTurnoverOnDeposit, processDepositCommission } from '../services/firebaseService';
import { ToastType } from './Toast';
import GlobalImage from './GlobalImage';

const paymentMethods = [
  { 
    id: 'nagad', 
    name: 'NAGAD', 
    label: 'নগদ',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Nagad_Logo.svg/1200px-Nagad_Logo.svg.png',
    number: '01789527096'
  },
  { 
    id: 'bkash', 
    name: 'Bkash', 
    label: 'বিকাশ',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/BKash_Logo.svg/1200px-BKash_Logo.svg.png',
    number: '01860137045'
  },
  { 
    id: 'rocket', 
    name: 'Rocket', 
    label: 'রকেট',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Rocket_logo.svg/1200px-Rocket_logo.svg.png',
    number: '01860137045'
  },
];

const channels = [
  { id: 'ch1', name: 'চ্যানেল ২ ১০' },
  { id: 'ch2', name: 'চ্যানেল ২ ৬' },
  { id: 'ch3', name: 'চ্যানেল ২ ৯' },
];

const quickAmounts = [100, 200, 500, 800, 1000, 2000, 5000, 10000, 20000, 30000];

export default function DepositView({ onTabChange, balance, onBalanceUpdate, userData, showToast, minDeposit = 100, globalImages = {}, isAdmin = false }: { onTabChange: (tab: any) => void, balance: number, onBalanceUpdate: (amount: number) => void, userData: any, showToast: (msg: string, type?: ToastType) => void, minDeposit?: number, globalImages?: Record<string, string>, isAdmin?: boolean }) {
  const [step, setStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState('nagad');
  const [selectedChannel, setSelectedChannel] = useState('ch1');
  const [amount, setAmount] = useState('');
  const [selectedBonus, setSelectedBonus] = useState('none');
  const [trxId, setTrxId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [deposits, setDeposits] = useState<any[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const path = `users/${auth.currentUser.uid}/transactions`;
    const q = query(
      collection(db, path),
      where('type', '==', 'deposit'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trxData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDeposits(trxData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, []);

  const handleNextStep = () => {
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount < minDeposit) {
      showToast(`সর্বনিম্ন ডিপোজিট ${minDeposit} টাকা`, 'warning');
      return;
    }
    setStep(2);
  };

  const handleDeposit = async () => {
    if (!trxId.trim() || !senderNumber.trim()) {
      showToast('সবগুলো তথ্য পূরণ করুন', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const depositAmount = parseFloat(amount);
      const path = `users/${auth.currentUser?.uid}/transactions`;
      
      await addDoc(collection(db, path), {
        type: 'deposit',
        amount: depositAmount,
        method: selectedMethod,
        trxId: trxId,
        number: senderNumber,
        status: 'pending',
        date: serverTimestamp(),
        bonusType: selectedBonus
      });

      await addNotification(auth.currentUser?.uid || '', {
        title: "ডিপোজিট রিকোয়েস্ট!",
        message: `আপনার ৳ ${depositAmount} ডিপোজিট রিকোয়েস্টটি সফলভাবে জমা হয়েছে।`,
        type: "account"
      });

      showToast('ডিপোজিট রিকোয়েস্ট সফল হয়েছে!', 'success');
      onTabChange('home');
    } catch (error) {
      showToast('ডিপোজিট রিকোয়েস্ট ব্যর্থ হয়েছে', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isNextEnabled = amount !== '' && parseFloat(amount) >= minDeposit;

  if (showHistory) {
    return (
      <div className="flex flex-col min-h-screen bg-white pb-24 font-sans">
        <header className="bg-[#2d1b4d] text-white p-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowHistory(false)} className="p-1">
              <ChevronLeft size={28} />
            </button>
            <h1 className="text-xl font-medium">ডিপোজিট ইতিহাস</h1>
          </div>
        </header>
        <main className="p-4 space-y-3">
          {deposits.length > 0 ? deposits.map(d => (
            <div key={d.id} className="p-4 border rounded-xl flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-800 uppercase">{d.method}</p>
                <p className="text-xs text-gray-500">{d.trxId}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">৳{d.amount}</p>
                <p className={`text-xs ${d.status === 'approved' ? 'text-green-500' : d.status === 'rejected' ? 'text-red-500' : 'text-yellow-500'}`}>
                  {d.status === 'approved' ? 'সফল' : d.status === 'rejected' ? 'বাতিল' : 'পেন্ডিং'}
                </p>
              </div>
            </div>
          )) : (
            <div className="text-center py-20 text-gray-400">কোনো ইতিহাস পাওয়া যায়নি</div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white pb-24 font-sans">
      {/* Header */}
      <header className="bg-[#2d1b4d] text-white p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => step === 2 ? setStep(1) : onTabChange('home')} className="p-1">
            <ChevronLeft size={28} />
          </button>
          <h1 className="text-xl font-medium">{step === 1 ? 'জমা দিন' : 'পেমেন্ট সম্পন্ন করুন'}</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowHistory(true)} className="p-1">
            <ClipboardList size={24} />
          </button>
          <button onClick={() => window.open('https://t.me/spin71_bot', '_blank')} className="p-1">
            <MessageCircle size={24} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        {step === 1 ? (
          <>
            {/* Deposit Mode */}
            <section className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <h2 className="text-gray-800 font-bold text-base">আমানতের মোড</h2>
              </div>
              <div className="flex gap-4">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`relative w-[110px] h-[110px] flex flex-col items-center justify-center rounded-xl border-2 transition-all ${
                      selectedMethod === method.id ? 'border-red-500' : 'border-gray-100'
                    }`}
                  >
                    <div className="w-12 h-12 mb-2 flex items-center justify-center">
                      <GlobalImage 
                        imageKey={`payment_logo_${method.id}`}
                        defaultUrl={method.logo}
                        currentUrl={globalImages[`payment_logo_${method.id}`]}
                        alt={method.name}
                        showToast={showToast}
                        className="max-w-full max-h-full object-contain"
                        isAdmin={isAdmin}
                      />
                    </div>
                    <span className={`text-xs font-bold ${selectedMethod === method.id ? 'text-red-500' : 'text-gray-800'}`}>
                      {method.label}
                    </span>
                    <span className={`text-[10px] font-bold mt-0.5 ${selectedMethod === method.id ? 'text-red-500' : 'text-gray-400'}`}>
                      {method.name}
                    </span>
                    {selectedMethod === method.id && (
                      <div className="absolute bottom-0 right-0 bg-red-500 text-white p-0.5 rounded-tl-lg">
                        <Check size={12} strokeWidth={4} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-red-500 text-[13px] mt-4 leading-tight font-medium">
                আপনাকে trxid পূরণ করতে হবে। আপনি যদি রিচার্জটি পূরণ না করেন তবে রিচার্জটি জমা হবে না
              </p>
            </section>

            <div className="h-2 bg-gray-50"></div>

            {/* Payment Channel */}
            <section className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                <h2 className="text-gray-800 font-bold text-base">পেমেন্ট চ্যানেল</h2>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {channels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => setSelectedChannel(channel.id)}
                    className={`py-4 px-1 rounded-xl border-2 text-[13px] font-bold transition-all ${
                      selectedChannel === channel.id ? 'border-red-500 text-red-500' : 'border-gray-100 text-gray-800'
                    }`}
                  >
                    {channel.name}
                  </button>
                ))}
              </div>
              <p className="text-red-500 text-[13px] mt-4 leading-tight font-medium">
                আপনাকে trxid পূরণ করতে হবে। আপনি যদি রিচার্জটি পূরণ না করেন তবে রিচার্জটি জমা হবে না
              </p>
            </section>

            <div className="h-2 bg-gray-50"></div>

            {/* Deposit Amount */}
            <section className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                <h2 className="text-gray-800 font-bold text-base">জমা পরিমাণ</h2>
              </div>
              <div className="grid grid-cols-5 gap-2 mb-4">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt.toString())}
                    className={`py-2 rounded-lg border text-[13px] font-bold transition-all ${
                      amount === amt.toString() ? 'border-red-500 text-red-500' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    {amt.toLocaleString()}
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-800 font-bold text-lg">৳</span>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100 - 30,000"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 pl-10 pr-4 text-gray-800 font-bold text-lg focus:outline-none placeholder:text-gray-400 placeholder:font-medium"
                />
              </div>
            </section>

            <div className="h-2 bg-gray-50"></div>

            {/* Activities */}
            <section className="p-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <h2 className="text-gray-800 font-bold text-base">কার্যক্রম</h2>
              </div>
              
              <button 
                onClick={() => setSelectedBonus('daily8')}
                className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all ${
                  selectedBonus === 'daily8' ? 'border-red-500' : 'border-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedBonus === 'daily8' ? 'border-red-500' : 'border-gray-300'
                  }`}>
                    {selectedBonus === 'daily8' && <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>}
                  </div>
                  <span className="text-gray-400 font-bold text-sm">ডেইলি ৮% ফার্স্ট ডিপোজিট বোনাস (1/1)</span>
                </div>
                <span className="text-gray-400 font-bold text-sm">≥ ৳ 100.00</span>
              </button>

              <button 
                onClick={() => setSelectedBonus('none')}
                className={`w-full p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                  selectedBonus === 'none' ? 'border-red-500' : 'border-gray-100'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedBonus === 'none' ? 'border-red-500' : 'border-gray-300'
                }`}>
                  {selectedBonus === 'none' && <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>}
                </div>
                <span className="text-gray-800 font-bold text-sm">কোনও প্রচারে অংশ নেওয়া যায় না</span>
              </button>
            </section>
          </>
        ) : (
          <div className="min-h-screen bg-white font-sans relative">
            {/* Header Section */}
            <div className="bg-[#005a3c] text-white p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black">BDT {amount}.00</h2>
                  <p className="text-sm font-medium mt-1">কম বা বেশি ক্যাশআউট করবেন না</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-white text-[#005a3c] px-2 py-0.5 rounded text-[10px] font-black italic">PAY</span>
                    <span className="text-sm font-bold tracking-widest uppercase">Service</span>
                  </div>
                  <div className="flex bg-white/20 rounded p-0.5 text-[10px] font-bold">
                    <button className="px-2 py-1">EN</button>
                    <button className="px-2 py-1 bg-white text-black rounded shadow-sm">বাং</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button 
              onClick={() => setStep(1)}
              className="absolute top-[85px] left-4 w-10 h-10 bg-black rounded-full flex items-center justify-center text-white shadow-lg z-10"
            >
              <X size={24} strokeWidth={3} />
            </button>

            <div className="p-6 pt-12 space-y-6">
              {/* Warning Message */}
              <p className="text-[#ff4d4d] text-center font-bold text-lg leading-tight">
                আপনি যদি টাকার পরিমাণ পরিবর্তন করেন (BDT {amount}.00), আপনি ক্রেডিট পেতে সক্ষম হবেন না।
              </p>

              {/* Deposit Banner */}
              <div className="bg-[#ff4d4d] rounded-xl p-4 flex items-center gap-4 shadow-md">
                <div className="w-16 h-16 bg-white rounded-full p-2 flex items-center justify-center border-2 border-[#005a3c]">
                  <GlobalImage 
                    imageKey={`payment_logo_${selectedMethod}`}
                    defaultUrl={paymentMethods.find(m => m.id === selectedMethod)?.logo || ''}
                    currentUrl={globalImages[`payment_logo_${selectedMethod}`]}
                    alt="Logo"
                    showToast={showToast}
                    className="w-full h-full object-contain"
                    isAdmin={isAdmin}
                  />
                </div>
                <span className="text-white text-2xl font-black italic uppercase tracking-tight">
                  {amount} Deposit
                </span>
              </div>

              {/* Wallet No Section */}
              <div className="space-y-2">
                <label className="block text-lg font-black text-gray-900">Wallet No<span className="text-purple-600">*</span></label>
                <p className="text-gray-900 font-bold text-base">এই {selectedMethod === 'nagad' ? 'NAGAD' : 'BKASH'} নাম্বারে শুধুমাত্র ক্যাশআউট গ্রহণ করা হয়</p>
                <div className="bg-[#f2f2f2] rounded-xl p-4 flex justify-between items-center border border-gray-100">
                  <span className="text-2xl font-black text-gray-800 tracking-wider">
                    {paymentMethods.find(m => m.id === selectedMethod)?.number}
                  </span>
                  <button 
                    onClick={() => {
                      const num = paymentMethods.find(m => m.id === selectedMethod)?.number || '';
                      navigator.clipboard.writeText(num);
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                    className="text-[#005a3c] p-1"
                  >
                    <ClipboardList size={32} />
                  </button>
                </div>
              </div>

              {/* TrxID Section */}
              <div className="space-y-4">
                <label className="block text-lg font-black text-gray-900">
                  ক্যাশআউটের TrxID নাম্বারটি লিখুন <span className="text-[#ff4d4d]">(প্রয়োজন)</span>
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="TrxID অবশ্যই পূরণ করতে হবে!"
                    className="w-full p-5 bg-white border-2 border-red-500 rounded-xl focus:outline-none text-xl font-bold placeholder:text-gray-300"
                  />
                </div>
              </div>

              {/* Confirm Button */}
              <div className="flex justify-center pt-4">
                <button 
                  disabled={isSubmitting}
                  onClick={handleDeposit}
                  className="w-48 py-3 border-2 border-black rounded-xl bg-white text-black font-black text-xl hover:bg-gray-50 transition-colors active:scale-95 flex items-center justify-center"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : 'নিশ্চিত'}
                </button>
              </div>

              {/* Footer Warning Section */}
              <div className="space-y-2 pt-4">
                <h4 className="text-lg font-black text-gray-900">সতর্কতাঃ</h4>
                <p className="text-[#ff4d4d] font-bold text-sm">লেনদেন আইডি সঠিকভাবে পূরণ করতে হবে, অন্যথায় স্কোর ব্যর্থ হবে!!</p>
                <p className="text-gray-400 text-sm leading-relaxed font-medium">
                  অনুগ্রহ করে নিশ্চিত হয়ে নিন যে আপনি {selectedMethod === 'nagad' ? 'NAGAD' : 'BKASH'} deposit ওয়ালেট নাম্বারে ক্যাশ আউট করছেন। এই নাম্বারের অন্য কোন ওয়ালেট থেকে ক্যাশ আউট করলে সেই টাকা পাওয়ার কোন সম্ভাবনা নাই
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Button */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-[#f5f5f5] border-t border-gray-200 z-50">
        <button 
          disabled={isSubmitting || (step === 1 && !isNextEnabled)}
          onClick={step === 1 ? handleNextStep : handleDeposit}
          className={`w-full py-4 font-bold text-lg rounded-lg transition-all flex items-center justify-center gap-2 ${
            isSubmitting ? 'bg-gray-400 cursor-not-allowed' :
            (step === 1 ? (isNextEnabled ? 'bg-red-500 text-white' : 'bg-[#cccccc] text-white') : 'bg-red-500 text-white')
          }`}
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : (step === 1 ? 'পরবর্তী' : 'জমা সম্পন্ন করুন')}
        </button>
      </footer>
    </div>
  );
}
