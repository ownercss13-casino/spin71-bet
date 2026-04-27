import React, { useState, useEffect } from 'react';
import { ChevronLeft, ClipboardList, MessageCircle, Check, Copy, ShieldCheck, ArrowRight, Loader2, X } from 'lucide-react';
import { ToastType } from '../components/ui/Toast';
import GlobalImage from '../components/ui/GlobalImage';

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
  { 
    id: 'upi', 
    name: 'UPI', 
    label: 'UPI',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo.svg/1200px-UPI-Logo.svg.png',
    number: 'upi@example'
  },
  { 
    id: 'paytm', 
    name: 'PayTM', 
    label: 'PayTM',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/1200px-Paytm_Logo_%28standalone%29.svg.png',
    number: 'paytm@example'
  },
  { 
    id: 'bank', 
    name: 'Bank Transfer', 
    label: 'ব্যান্ড ট্রান্সফার',
    logo: 'https://icon-library.com/images/bank-icon-vector/bank-icon-vector-1.jpg',
    number: '123456789'
  }
];

const channels = [
  { id: 'ch1', name: 'M(min.300)' },
  { id: 'ch2', name: 'T(min.200)' },
  { id: 'ch3', name: 'PC(min.200)' },
  { id: 'ch4', name: 'E(min.100)' }
];

const quickAmounts = [300, 500, 1000, 2000, 3000, 5000, 10000];

export default function DepositView({ 
  onTabChange, 
  balance, 
  onBalanceUpdate, 
  userData, 
  showToast, 
  minDeposit = 100, 
  globalImages = {}, 
  isAdmin = false,
  onUpdateGlobalImage,
  onDepositSuccess
}: { 
  onTabChange: (tab: any) => void, 
  balance: number, 
  onBalanceUpdate: (amount: number) => void, 
  userData: any, 
  showToast: (msg: string, type?: ToastType) => void, 
  minDeposit?: number, 
  globalImages?: Record<string, string>, 
  isAdmin?: boolean,
  onUpdateGlobalImage?: (key: string, url: string) => Promise<void>,
  onDepositSuccess?: (amount: number, trxId?: string, senderNumber?: string, method?: string) => void
}) {
  const [step, setStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState('nagad');
  const [selectedChannel, setSelectedChannel] = useState('ch1');
  const [amount, setAmount] = useState('300');
  const [selectedBonus, setSelectedBonus] = useState('none');
  const [trxId, setTrxId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [deposits, setDeposits] = useState<any[]>([]);

  useEffect(() => {
    // History fetching removed (Firebase disconnected)
  }, []);

  const handleNextStep = () => {
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount < minDeposit) {
      showToast(`সর্বনিম্ন ডিপোজিট ${minDeposit} টাকা`, 'warning');
      return;
    }
    setStep(2);
  };

  const [newAccountNumber, setNewAccountNumber] = useState(paymentMethods.find(m => m.id === selectedMethod)?.number || '');

  useEffect(() => {
    const globalNum = globalImages[`payment_number_${selectedMethod}`];
    if (globalNum) {
      setNewAccountNumber(globalNum);
    } else {
      setNewAccountNumber(paymentMethods.find(m => m.id === selectedMethod)?.number || '');
    }
  }, [selectedMethod, globalImages]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleDeposit = async () => {
    if (!trxId.trim()) {
      showToast('Transaction ID is required', 'warning');
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmDeposit = () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (onDepositSuccess) {
        onDepositSuccess(parseFloat(amount), trxId, senderNumber, selectedMethod);
      }
      showToast('Submitted successfully! / সফলভাবে জমা দিন!', 'success');
      setTrxId('');
      setStep(1);
      setShowHistory(true);
    }, 1500);
  };

  const isNextEnabled = amount !== '' && parseFloat(amount) >= minDeposit;

  if (showHistory) {
    return (
      <div className="flex flex-col min-h-screen bg-[#21817d] font-sans">
        <header className="bg-[#5abeb9] text-[#13615e] p-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-4 w-full relative">
            <button onClick={() => setShowHistory(false)} className="absolute left-0 p-1">
              <ChevronLeft size={28} />
            </button>
            <h1 className="text-xl font-bold w-full text-center">Deposit History</h1>
          </div>
        </header>
        <div className="flex bg-[#2f8e8a]">
          <button onClick={() => setShowHistory(false)} className="flex-1 py-3 font-bold text-center text-white/70 bg-[#2f8e8a]">Deposit</button>
          <button className="flex-1 py-3 font-bold text-center text-white bg-[#21817d]">Deposit History</button>
        </div>
        <main className="p-4 space-y-3 flex-1 overflow-y-auto">
          {deposits.length > 0 ? deposits.map(d => (
            <div key={d.id} className="p-4 bg-[#1d7470] rounded-xl flex justify-between items-center text-white">
              <div>
                <p className="font-bold uppercase">{d.method}</p>
                <p className="text-xs text-white/70">{d.trxId}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-400">৳{d.amount}</p>
                <p className={`text-xs ${d.status === 'approved' ? 'text-green-500' : d.status === 'rejected' ? 'text-red-500' : 'text-yellow-500'}`}>
                  {d.status === 'approved' ? 'সফল' : d.status === 'rejected' ? 'বাতিল' : 'পেন্ডিং'}
                </p>
              </div>
            </div>
          )) : (
            <div className="text-center py-20 text-white/50">কোনো ইতিহাস পাওয়া যায়নি</div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#21817d] font-sans">
      {/* Header */}
      <header className="bg-[#5abeb9] text-[#13615e] p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4 w-full relative">
          <button onClick={() => step === 2 ? setStep(1) : onTabChange('home')} className="absolute left-0 p-1">
            <ChevronLeft size={28} />
          </button>
          <h1 className="text-xl font-bold w-full text-center">{step === 1 ? 'Deposit' : 'Payment'}</h1>
        </div>
      </header>

      {step === 1 && (
        <div className="flex bg-[#2f8e8a]">
          <button className="flex-1 py-3 font-bold text-center text-white bg-[#21817d]">Deposit</button>
          <button onClick={() => setShowHistory(true)} className="flex-1 py-3 font-bold text-center text-white/70 bg-[#2f8e8a]">Deposit History</button>
        </div>
      )}

      <main className="flex-1 overflow-y-auto">
        {step === 1 ? (
          <>
            {/* Deposit Mode */}
            <section className="p-4 bg-[#21817d]">
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`relative p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 h-24 ${
                      selectedMethod === method.id 
                        ? 'border-[#ffc107] bg-[#1d7470]' 
                        : 'border-transparent bg-[#1d7470]'
                    }`}
                  >
                    <div className="w-10 h-10 flex items-center justify-center bg-white rounded p-1 flex-shrink-0">
                      <GlobalImage 
                        imageKey={`payment_logo_${method.id}`}
                        defaultUrl={method.logo}
                        currentUrl={globalImages[`payment_logo_${method.id}`]}
                        alt={method.name}
                        showToast={showToast}
                        className="max-w-full max-h-full object-contain"
                        isAdmin={isAdmin}
                        updateGlobalImage={(url) => onUpdateGlobalImage ? onUpdateGlobalImage(`payment_logo_${method.id}`, url) : Promise.resolve()}
                      />
                    </div>
                    <div className="text-center">
                      <p className={`text-[13px] font-bold ${selectedMethod === method.id ? 'text-white' : 'text-white/80'}`}>
                        {method.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Payment Channel */}
            <section className="p-4 bg-[#21817d] border-t border-[#319b96]/30">
              <div className="grid grid-cols-3 gap-2">
                {channels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => setSelectedChannel(channel.id)}
                    className={`py-2 px-1 rounded border-2 text-[12px] font-bold transition-all flex items-center justify-center gap-1 ${
                      selectedChannel === channel.id ? 'border-[#ffc107] text-[#ffc107] bg-[#1d7470]' : 'border-transparent text-white bg-[#1d7470]'
                    }`}
                  >
                    {selectedChannel === channel.id && <Check size={12} strokeWidth={3} />} {channel.name}
                  </button>
                ))}
              </div>
            </section>

            {/* Deposit Amount */}
            <section className="p-4 bg-[#21817d] border-t border-[#319b96]/30">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-white font-bold text-sm">Deposit Amount</h2>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="300 - 30,000"
                    className="w-full bg-[#1d7470] rounded py-2 px-3 text-white font-bold text-sm focus:outline-none placeholder:text-white/30 text-right pr-6"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500">*</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt.toString())}
                    className={`flex-1 min-w-[30%] py-2.5 rounded border text-[13px] font-bold transition-all ${
                      amount === amt.toString() ? 'border-[#ffc107] text-[#ffc107] bg-[#1d7470]' : 'border-transparent text-white/90 bg-[#1d7470]'
                    }`}
                  >
                    {amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </section>

            {/* Activities */}
            <section className="p-4 space-y-4 bg-[#21817d] border-t border-[#319b96]/30">
              <div>
                <h2 className="text-white font-bold text-lg mb-1">Would you like to claim your bonus?</h2>
                <p className="text-white/70 text-xs text-left mb-3">Please select your bonus.</p>
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={() => setSelectedBonus('daily8')}
                  className={`w-full p-4 rounded border flex items-start gap-3 transition-all ${
                    selectedBonus === 'daily8' ? 'border-[#ffc107] bg-[#1d7470]' : 'border-transparent bg-[#1d7470]'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    selectedBonus === 'daily8' ? 'border-[#ffc107]' : 'border-gray-400'
                  }`}>
                    {selectedBonus === 'daily8' && <div className="w-2 h-2 rounded-full bg-[#ffc107]"></div>}
                  </div>
                  <div className="text-left w-full flex flex-col justify-center">
                    <div className="flex justify-between items-center w-full">
                      <span className={`block font-bold text-[13px] ${selectedBonus === 'daily8' ? 'text-[#ffc107]' : 'text-white'}`}>Daily Deposit Rewards 100%</span>
                      <span className="text-white/60 text-xs font-bold">b=200</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ffc107]"></div>
                      <span className="text-white/60 text-[10px] uppercase font-bold tracking-wider">Due Date : 2024-12-31</span>
                    </div>
                    <div className="w-full text-center mt-3">
                      <span className="text-white/40 text-[10px] font-bold tracking-wider uppercase">Read More ▼</span>
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => setSelectedBonus('none')}
                  className={`w-full p-4 rounded border flex items-center justify-center gap-3 transition-all relative ${
                    selectedBonus === 'none' ? 'border-[#ffc107] bg-[#319b96]' : 'border-transparent bg-[#1d7470]'
                  }`}
                >
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedBonus === 'none' ? 'border-[#ffc107]' : 'border-gray-400'
                    }`}>
                      {selectedBonus === 'none' && <div className="w-2 h-2 rounded-full bg-[#ffc107]"></div>}
                    </div>
                  </div>
                  <span className={`font-bold text-base ${selectedBonus === 'none' ? 'text-white' : 'text-white/80'}`}>Disclaim</span>
                </button>
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleNextStep}
                  disabled={!isNextEnabled}
                  className={`w-full py-3.5 font-bold text-lg rounded-[8px] transition-all flex items-center justify-center gap-3 shadow-lg ${
                    isNextEnabled 
                      ? 'bg-[#f5661d] text-white hover:bg-[#de5b1a]' 
                      : 'bg-[#b64b14] text-white/50 cursor-not-allowed'
                  }`}
                >
                  Submit
                </button>
              </div>
              
              <div className="flex items-center justify-center gap-1 text-white/80 mb-20">
                <div className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center font-bold text-[10px]">
                  !
                </div>
                <span className="text-xs font-bold">Notice</span>
              </div>
            </section>
          </>
        ) : (
          <div className="min-h-screen bg-white font-sans relative pb-20">
            {/* Header Section */}
            <div className="bg-[#0b5c4b] text-white p-4">
              <h2 className="text-2xl font-bold">BDT {amount}</h2>
              <p className="text-sm font-medium mt-1">কম বা বেশি ক্যাশআউট করবেন না</p>
            </div>

            <div className="p-4 space-y-5">
              {/* Warning Messages */}
              <div className="text-center space-y-1">
                <p className="text-red-500 font-bold text-sm">
                  If you change the amount (BDT {amount}), you won't get the credit
                </p>
                <p className="text-red-500 font-bold text-sm leading-tight">
                  আপনি যদি টাকার পরিমাণ পরিবর্তন করেন (BDT {amount}), আপনি ক্রেডিট পেতে সক্ষম হবেন না।
                </p>
              </div>

              {/* Deposit Banner */}
              <div className="bg-[#f25c3a] p-3 flex items-center justify-center gap-3 shadow-sm rounded-sm">
                <div className="w-10 h-10 bg-white rounded-full p-1 flex items-center justify-center">
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
                <span className="text-white text-lg font-bold uppercase tracking-wide">
                  {paymentMethods.find(m => m.id === selectedMethod)?.name} Deposit
                </span>
              </div>

              {/* Wallet No Section */}
              <div className="space-y-1">
                <label className="block text-base font-bold text-gray-900">Wallet No <span className="text-red-500">*</span></label>
                <p className="text-gray-500 text-sm">এই {paymentMethods.find(m => m.id === selectedMethod)?.name} নাম্বারে শুধুমাত্র ক্যাশআউট গ্রহণ করা হয়</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-2xl font-bold text-red-500 flex-1">
                    {newAccountNumber}
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(newAccountNumber);
                      setIsCopied(true);
                      showToast('Copied to clipboard!', 'success');
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                    className="text-[#4caf50] p-1 bg-green-50 rounded"
                  >
                    <Copy size={24} />
                  </button>
                </div>
              </div>

              {/* TrxID Section */}
              <div className="space-y-1">
                <label className="block text-base font-bold text-gray-900">
                  Transaction ID <span className="text-red-500">*(required)</span>
                </label>
                <p className="text-gray-500 text-sm">ক্যাশআউটের TrxID নাম্বারটি লিখুন (প্রয়োজন)</p>
                <div className="mt-2 text-[#2196f3] text-sm text-center mb-2">
                  Click to see how to get TrxID/কিভাবে TrxID পেতে হয় তা দেখতে ক্লিক করুন
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="TrxID অবশ্যই পূরণ করতে হবে!"
                    className="w-full p-3 bg-white border border-red-500 rounded focus:outline-none text-base font-bold placeholder:text-gray-400 placeholder:font-normal text-center"
                  />
                </div>
              </div>

              {/* Time Warning */}
              <div className="text-center space-y-1 border-t border-b border-gray-100 py-4">
                <p className="text-gray-900 text-sm">Please do not pay beyond the following time</p>
                <p className="text-gray-900 text-sm">অনুগ্রহ করে নিম্নলিখিত সময়ের বেশি অর্থ প্রদান করবেন না</p>
                <p className="text-red-500 font-bold text-lg mt-2">2026-12-31 23:59:59</p>
              </div>

              {/* Confirm Button */}
              <div className="pt-2">
                <button 
                  disabled={isSubmitting}
                  onClick={handleDeposit}
                  className="w-full py-3 border border-gray-300 rounded-full bg-white text-gray-600 font-bold text-base hover:bg-gray-50 transition-colors active:scale-95 flex items-center justify-center shadow-sm"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : 'Submit/নিশ্চিত'}
                </button>
              </div>

              {/* Footer Warning Section */}
              <div className="space-y-2 pt-2 pb-6">
                <h4 className="text-base font-bold text-gray-900">Warning সতর্কতাঃ</h4>
                <p className="text-red-500 text-sm">Transaction ID must be filled in correctly, otherwise the score will fail!</p>
                <p className="text-red-500 text-sm">লেনদেন আইডি সঠিকভাবে পূরণ করতে হবে, অন্যথায় স্কোর ব্যর্থ হবে!!</p>
                
                <p className="text-gray-500 text-sm mt-4">Please note that you make the deposit to {paymentMethods.find(m => m.id === selectedMethod)?.name} deposit. Be sure that you make the payment from the same channel</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden flex flex-col items-center">
            <div className="p-6 text-center space-y-2">
              <p className="text-gray-900 font-bold text-[15px]">
                This order can only be submitted once, please confirm your Transaction ID: <span className="text-red-500">{trxId}</span> is correct!
              </p>
              <p className="text-gray-900 font-bold text-[15px]">
                এই অর্ডারটি শুধুমাত্র একবার জমা দেওয়া যাবে, অনুগ্রহ করে নিশ্চিত করুন যে আপনার লেনদেন আইডি: <span className="text-red-500">{trxId}</span> সঠিক!
              </p>
            </div>
            <div className="flex border-t w-full">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-4 text-center text-gray-500 font-bold border-r hover:bg-gray-50"
              >
                cancel/বাতিল
              </button>
              <button 
                onClick={confirmDeposit}
                className="flex-1 py-4 text-center text-[#1d7470] font-bold hover:bg-gray-50"
              >
                confirm/জমা
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
