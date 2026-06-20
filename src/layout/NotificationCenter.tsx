import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Trash2, ChevronRight, X, ArrowLeft, Info, Check } from 'lucide-react';
import { db } from '../services/firebase';
import { doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';

export interface Notification {
  id?: string;
  title: string;
  message: string;
  type: 'bonus' | 'promotion' | 'account' | 'info';
  read: boolean;
  createdAt: any;
  actionUrl?: string;
  sender?: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  userData: any;
  onAction?: (url: string) => void;
  notifications?: Notification[];
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  showToast: (msg: string, type?: any) => void;
  appLogo?: string;
}

export default function NotificationCenter({ 
  isOpen, 
  onClose, 
  userData, 
  onAction, 
  notifications = [], 
  onMarkAsRead, 
  onDelete,
  showToast,
  appLogo
}: NotificationCenterProps) {
  const [activeTab, setActiveTab] = useState<'inbox' | 'outbox'>('inbox');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMessage, setActiveMessage] = useState<Notification | null>(null);

  // Clear selections when changing tabs
  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab]);

  // Outbox mock data representing tickets or request histories
  const [outboxItems, setOutboxItems] = useState<any[]>([
    {
      id: 'out_1',
      title: 'ডিপোজিট সমস্যা রিপোর্ট',
      message: 'আমার ডিপোজিট সফল হয়নি, অনুগ্রহ করে একটু চেক করে দেখুন। ট্রানজেকশন আইডি: TRX71829371',
      sender: userData?.username || 'ইউজার',
      createdAt: new Date(Date.now() - 25 * 3600 * 1000), // Yesterday
      read: true,
      type: 'account'
    },
    {
      id: 'out_2',
      title: 'কমিশন ক্লেইম সাহায্য',
      message: 'সাপ্তাহিক ভিআইপি কমিশন সঠিকভাবে এড হচ্ছে না, সাহায্য করুন।',
      sender: userData?.username || 'ইউজার',
      createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000),
      read: true,
      type: 'info'
    }
  ]);

  const activeItems = activeTab === 'inbox' ? notifications : outboxItems;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(activeItems.map(item => item.id!));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkMarkRead = async () => {
    if (selectedIds.length === 0) {
      showToast("দয়া করে যেকোনো একটি মেসেজ সিলেক্ট করুন", "warning");
      return;
    }
    
    // Outbox messages are always read
    if (activeTab === 'outbox') {
      setSelectedIds([]);
      return;
    }

    try {
      const promises = selectedIds.map(async (id) => {
        if (onMarkAsRead) {
          await onMarkAsRead(id);
        } else {
          await updateDoc(doc(db, 'users', userData.id, 'notifications', id), { read: true });
        }
      });
      await Promise.all(promises);
      setSelectedIds([]);
      showToast("চিহ্নিত মেসেজগুলো পড়া হয়েছে হিসেবে মার্ক করা হয়েছে।", "success");
    } catch (err: any) {
      console.error(err);
      showToast("অপশন সম্পন্ন করতে সমস্যা হয়েছে", "error");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      showToast("দয়া করে যেকোনো একটি মেসেজ সিলেক্ট করুন", "warning");
      return;
    }

    try {
      if (activeTab === 'inbox') {
        const promises = selectedIds.map(async (id) => {
          if (onDelete) {
            await onDelete(id);
          } else {
            await deleteDoc(doc(db, 'users', userData.id, 'notifications', id));
          }
        });
        await Promise.all(promises);
        showToast("চিহ্নিত মেসেজগুলো সম্পূর্ণ মুছে ফেলা হয়েছে।", "success");
      } else {
        // delete outbox local elements
        setOutboxItems(prev => prev.filter(item => !selectedIds.includes(item.id)));
        showToast("চিহ্নিত পাঠানো মেসেজগুলো মুছে ফেলা হয়েছে।", "success");
      }
      setSelectedIds([]);
    } catch (err: any) {
      console.error(err);
      showToast("মুছে ফেলতে সমস্যা হয়েছে", "error");
    }
  };

  const handleItemClick = async (item: any) => {
    setActiveMessage(item);
    
    if (activeTab === 'inbox' && !item.read) {
      try {
        if (onMarkAsRead) {
          await onMarkAsRead(item.id);
        } else {
          await updateDoc(doc(db, 'users', userData.id, 'notifications', item.id), { read: true });
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSingleDelete = async (id: string) => {
    try {
      if (activeTab === 'inbox') {
        if (onDelete) {
          await onDelete(id);
        } else {
          await deleteDoc(doc(db, 'users', userData.id, 'notifications', id));
        }
        showToast("মেসেজটি সম্পূর্ণ মুছে ফেলা হয়েছে।", "success");
      } else {
        setOutboxItems(prev => prev.filter(item => item.id !== id));
        showToast("পাঠানো মেসেজটি মুছে ফেলা হয়েছে।", "success");
      }
      setSelectedIds(prev => prev.filter(item => item !== id));
    } catch (err: any) {
      console.error(err);
      showToast("মুছে ফেলতে সমস্যা হয়েছে", "error");
    }
  };

  const formatDateExact = (date: any) => {
    if (!date) return "";
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return "";
    const pad = (num: number) => String(num).padStart(2, '0');
    
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const allSelected = activeItems.length > 0 && selectedIds.length === activeItems.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] bg-black/60 flex justify-end"
          onClick={onClose}
        >
          {/* Main Mailbox Panel matching 2nd screenshot */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="w-full max-w-md bg-[#f4f7f6] h-full flex flex-col shadow-2xl overflow-hidden text-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Solid dark bar with center text: মেইল */}
            <div className="bg-[#1c1c1c] text-white flex items-center justify-between px-4 py-3 border-b border-white/5 relative shrink-0">
              <button onClick={onClose} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={22} />
              </button>
              <div className="absolute left-1/2 -translate-x-1/2 text-center">
                <h3 className="font-extrabold text-lg tracking-tight">মেইল</h3>
              </div>
              <div className="w-8"></div> {/* Spacer for symmetry */}
            </div>

            {/* Tabs: ইনবক্স and আউটবক্স with white bg and styled borders */}
            <div className="bg-white grid grid-cols-2 text-center shrink-0 border-b border-gray-200">
              <button 
                onClick={() => setActiveTab('inbox')}
                className={`py-3.5 text-base font-black relative transition-all ${
                  activeTab === 'inbox' 
                    ? 'text-sky-500 border-b-2 border-sky-500' 
                    : 'text-gray-500 hover:text-sky-400'
                }`}
              >
                ইনবক্স
              </button>
              <button 
                onClick={() => setActiveTab('outbox')}
                className={`py-3.5 text-base font-black relative transition-all ${
                  activeTab === 'outbox' 
                    ? 'text-sky-500 border-b-2 border-sky-500' 
                    : 'text-gray-500 hover:text-sky-400'
                }`}
              >
                আউটবক্স
              </button>
            </div>

            {/* Toolbar: Select All + Read All Button + Delete Button */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-200 shrink-0">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleSelectAll(!allSelected)}
                  className="w-5 h-5 border-2 border-sky-500 rounded flex items-center justify-center transition-all bg-white text-sky-500 active:scale-90"
                >
                  {allSelected && <Check size={14} strokeWidth={4} />}
                </button>
                <span className="text-gray-700 font-bold text-sm">সমস্ত নির্বাচন করুন</span>
              </div>
              <div className="flex items-center gap-3">
                {activeTab === 'inbox' && (
                  <button 
                    onClick={handleBulkMarkRead}
                    title="পড়া হয়েছে হিসেবে চিহ্নিত করুন"
                    className="p-2 text-gray-500 hover:text-sky-500 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
                  >
                    <Mail size={18} />
                  </button>
                )}
                <button 
                  onClick={handleBulkDelete}
                  title="মুছে ফেলুন"
                  className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-1">
              {activeItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-20 opacity-60">
                  <Mail size={48} className="mb-4 text-gray-400" />
                  <p className="text-gray-500 font-extrabold text-base">কোনো মেসেজ নেই</p>
                </div>
              ) : (
                activeItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id!);
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className="bg-white border-b border-gray-100 flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-sky-50/30 transition-colors active:bg-gray-50"
                    >
                      {/* Left Block with Checkbox and Dot */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Custom Round Checkbox */}
                        <div 
                          onClick={(e) => handleToggleSelect(item.id!, e)}
                          className={`w-5 h-5 border-2 rounded-full flex items-center justify-center shrink-0 transition-all ${
                            isSelected 
                              ? 'border-sky-500 bg-sky-500 text-white' 
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check size={12} strokeWidth={4} />}
                        </div>

                        {/* Status Dot (●) - Green for unread, Gray for read */}
                        <div className="shrink-0 flex items-center justify-center mr-0.5">
                          <span className={`text-[15px] leading-none ${item.read ? 'text-[#b0bec5]' : 'text-[#4caf50]'}`}>●</span>
                        </div>

                        {/* Circular App/Game Logo inside the row */}
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-gray-200 bg-white flex items-center justify-center mr-1 shadow-sm">
                          <img 
                            src={appLogo || 'https://www.image2url.com/r2/default/images/1781024598371-46bd7cc9-4b5f-49cd-b4b3-60d4d200534a.png'} 
                            alt="App Logo" 
                            className="w-full h-full object-cover" 
                          />
                        </div>

                        {/* Text: Sender and Title */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2 mb-1">
                            <span className="text-gray-900 font-black text-[13px] truncate">
                              প্রেরক: {item.sender || 'প্ল্যাটফর্ম'}
                            </span>
                            <span className="text-gray-400 font-bold text-[10px] shrink-0">
                              {formatDateExact(item.createdAt)}
                            </span>
                          </div>
                          <span className="text-gray-600 font-bold text-[13px] block truncate">
                            শিরোনাম: {item.title}
                          </span>
                        </div>
                      </div>

                      {/* Right side Actions (Single delete option) */}
                      <div className="flex items-center gap-1.5 pl-2 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSingleDelete(item.id!);
                          }}
                          className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90"
                          title="মেসেজটি ডিলিট করুন"
                        >
                          <Trash2 size={16} />
                        </button>
                        <div className="text-gray-400">
                          <ChevronRight size={18} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Footer block */}
            <div className="p-4 bg-white border-t border-gray-200 shrink-0">
              <button 
                onClick={onClose}
                className="w-full py-3 bg-[#1c1c1c] hover:bg-black text-white font-extrabold rounded-xl transition-all text-sm uppercase tracking-wide shadow-md active:scale-98"
              >
                বন্ধ করুন
              </button>
            </div>
          </motion.div>

          {/* Dialog Modal matching 3rd screenshot layout absolutely */}
          <AnimatePresence>
            {activeMessage && (
              <div className="fixed inset-0 z-[1100] bg-black/70 flex items-center justify-center p-6 backdrop-blur-sm">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 30 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 30 }}
                  className="bg-white w-full max-w-sm rounded-2xl shadow-2xl relative overflow-hidden border-l-[6px] border-[#00d0f5] flex flex-col"
                >
                  {/* Floating Content Body matching the exact message info popup styling */}
                  <div className="p-6 pr-12 flex items-start gap-4">
                    {/* Dynamic App Logo with circular preview matching the exact layout */}
                    <div className="w-[42px] h-[42px] rounded-full overflow-hidden border border-gray-200 shrink-0 flex items-center justify-center bg-[#1c1c1c] shadow-sm">
                      <img 
                        src={appLogo || 'https://www.image2url.com/r2/default/images/1781024598371-46bd7cc9-4b5f-49cd-b4b3-60d4d200534a.png'} 
                        alt="App Logo" 
                        className="w-full h-full object-cover" 
                      />
                    </div>

                    {/* Text Fields */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[#1a1a1a] font-extrabold text-[15px] sm:text-[16px] mb-1">
                        নতুন মেসেজ ({activeMessage.title})
                      </h4>
                      <p className="text-gray-500 font-bold text-xs mb-3">
                        প্রেরক: {activeMessage.sender || 'প্ল্যাটফর্ম'}  •  {formatDateExact(activeMessage.createdAt)}
                      </p>
                      
                      <div className="text-gray-700 text-sm font-semibold leading-relaxed max-h-[180px] overflow-y-auto pr-2">
                        {activeMessage.message}
                      </div>
                    </div>

                    {/* Top Right Close button */}
                    <button 
                      onClick={() => setActiveMessage(null)}
                      className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-900 rounded-full transition-all"
                    >
                      <X size={18} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Detail Footer button */}
                  <div className="px-6 pb-5 pt-2 flex justify-end gap-2.5">
                    <button
                      onClick={() => {
                        handleSingleDelete(activeMessage.id!);
                        setActiveMessage(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-600 font-extrabold text-xs transition-all active:scale-95"
                    >
                      মুছে ফেলুন
                    </button>
                    <button
                      onClick={() => {
                        if (activeMessage.actionUrl && onAction) {
                          onAction(activeMessage.actionUrl);
                          onClose();
                        }
                        setActiveMessage(null);
                      }}
                      className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs transition-all active:scale-95 shadow-md shadow-sky-500/20"
                    >
                      ঠিক আছে
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
