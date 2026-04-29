import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { 
  ArrowLeft, Copy, Facebook, Send, MessageCircle, 
  Users, CheckCircle, DollarSign, Clock, User 
} from 'lucide-react';
import { ToastType } from '../components/ui/Toast';

interface ReferralDashboardTabProps {
  userData: any;
  showToast: (msg: string, type?: ToastType) => void;
  onBack: () => void;
}

export default function ReferralDashboardTab({ userData, showToast, onBack }: ReferralDashboardTabProps) {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Stats
  const totalReferrals = referrals.length;
  const validReferrals = referrals.filter(u => (u.deposits || 0) > 0 || u.totalDeposits > 0).length;
  const totalEarnings = userData?.totalReferralEarnings || 0;

  const referralCode = userData?.referralCode || (userData?.id ? userData.id.substring(0, 6).toUpperCase() : 'SPIN71');
  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  useEffect(() => {
    if (userData?.id) {
      const fetchReferrals = async () => {
        setIsLoading(true);
        try {
          const q = query(
            collection(db, 'users'), 
            where('referredBy', '==', userData.id),
            orderBy('createdAt', 'desc')
          );
          const querySnapshot = await getDocs(q);
          const list = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setReferrals(list);
        } catch (error) {
          console.error("Error fetching referrals:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchReferrals();
    } else {
      setIsLoading(false);
    }
  }, [userData?.id]);

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    showToast("Referral link copied!", "success");
  };

  const shareToSocial = (platform: string) => {
    const text = `Join SPIN71BET and win big! Use my referral link: ${referralLink}`;
    let url = "";
    switch (platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
        break;
    }
    if (url) window.open(url, '_blank');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-indigo-900 p-4 flex items-center gap-4 text-white sticky top-0 z-20 shadow-md">
        <button onClick={onBack} className="p-1 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-bold">Referral Dashboard</h2>
      </div>

      <div className="p-4 space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Referrals</p>
              <p className="text-2xl font-black text-gray-900">{totalReferrals}</p>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Valid Referrals</p>
              <p className="text-2xl font-black text-gray-900">{validReferrals}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Earnings</p>
              <p className="text-2xl font-black text-gray-900">৳ {totalEarnings.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Share Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Share Your Referral Link</h3>
          
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2 mb-4">
            <div className="flex-1 px-3 text-sm text-gray-600 truncate">{referralLink}</div>
            <button 
              onClick={copyLink}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all text-sm font-bold shadow-md shadow-indigo-600/20"
            >
              <Copy size={16} /> Copy
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button 
              onClick={() => shareToSocial('whatsapp')}
              className="flex flex-col items-center justify-center gap-2 bg-[#25D366]/10 text-[#25D366] p-3 rounded-xl hover:bg-[#25D366]/20 transition-colors"
            >
              <MessageCircle size={24} />
              <span className="text-xs font-bold">WhatsApp</span>
            </button>
            <button 
              onClick={() => shareToSocial('telegram')}
              className="flex flex-col items-center justify-center gap-2 bg-[#0088cc]/10 text-[#0088cc] p-3 rounded-xl hover:bg-[#0088cc]/20 transition-colors"
            >
              <Send size={24} />
              <span className="text-xs font-bold">Telegram</span>
            </button>
            <button 
              onClick={() => shareToSocial('facebook')}
              className="flex flex-col items-center justify-center gap-2 bg-[#1877F2]/10 text-[#1877F2] p-3 rounded-xl hover:bg-[#1877F2]/20 transition-colors"
            >
              <Facebook size={24} />
              <span className="text-xs font-bold">Facebook</span>
            </button>
          </div>
        </div>

        {/* Referred Users List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Users size={18} className="text-indigo-600" /> Referred Users
            </h3>
            <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2.5 py-1 rounded-full">{totalReferrals} Users</span>
          </div>
          
          {isLoading ? (
            <div className="p-10 flex justify-center">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          ) : referrals.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              <User size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="font-medium">No referrals yet</p>
              <p className="text-xs mt-1">Share your link to start earning!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {referrals.map((user, idx) => {
                const hasDeposited = (user.deposits || 0) > 0 || (user.totalDeposits || 0) > 0;
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={idx} 
                    className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">
                          {user.username ? `${user.username.substring(0, 3)}***${user.username.slice(-2)}` : 'Anonymous Player'}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5 opacity-60">
                          <Clock size={12} className="text-gray-500" />
                          <p className="text-[10px] text-gray-500 font-medium">
                            {user.createdAt ? (typeof user.createdAt === 'string' ? new Date(user.createdAt).toLocaleDateString() : new Date(user.createdAt.seconds * 1000).toLocaleDateString()) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      {hasDeposited ? (
                        <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-100">
                          <CheckCircle size={12} className="fill-green-200" />
                          <span className="text-[11px] font-bold">Deposited</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-1 rounded-full border border-gray-200">
                          <Clock size={12} />
                          <span className="text-[11px] font-bold">Pending</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
