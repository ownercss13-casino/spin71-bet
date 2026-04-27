import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Trash2, CheckCircle2, Info, Gift, AlertCircle, ChevronRight, Clock } from 'lucide-react';

export interface Notification {
  id?: string;
  title: string;
  message: string;
  type: 'bonus' | 'promotion' | 'account' | 'info';
  read: boolean;
  createdAt: any;
  actionUrl?: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  userData: any;
  onAction?: (url: string) => void;
}

export default function NotificationCenter({ isOpen, onClose, userData, onAction }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);

  useEffect(() => {
    // Mock notifications
    const mockNotifications: Notification[] = [
      {
        id: 'n1',
        title: 'বোনাস আপডেট',
        message: 'আপনি ৫0৭ টাকা ওয়েলকাম বোনাস পেয়েছেন!',
        type: 'bonus',
        read: false,
        createdAt: new Date(Date.now() - 3600000)
      },
      {
        id: 'n2',
        title: 'নতুন গেম রিলিজ',
        message: 'এভিয়েটর গেম এখন লাইভ! এখনই খেলুন।',
        type: 'promotion',
        read: true,
        createdAt: new Date(Date.now() - 86400000)
      }
    ];
    setNotifications(mockNotifications);
  }, [isOpen]);

  const filteredNotifications = activeFilter === 'all' 
    ? notifications 
    : notifications.filter(n => !n.read);

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotificationToDelete(id);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'bonus': return <Gift className="text-yellow-500" size={18} />;
      case 'promotion': return <TrendingUp className="text-blue-500" size={18} />;
      case 'account': return <AlertCircle className="text-orange-500" size={18} />;
      default: return <Info className="text-teal-500" size={18} />;
    }
  };

  const formatTime = (date: any) => {
    if (!date) return "";
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return "এখনই";
    if (mins < 60) return `${mins} মিনিট আগে`;
    if (hours < 24) return `${hours} ঘণ্টা আগে`;
    return `${days} দিন আগে`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex justify-end"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-sm bg-[#0b0b0b] h-full flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 bg-[#128a61] text-white flex items-center justify-between rounded-bl-3xl shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                  <Bell size={20} />
                </div>
                <div>
                  <h3 className="font-black text-lg italic uppercase tracking-tighter">নোটিফিকেশন</h3>
                  <p className="text-teal-100 text-[10px] font-bold uppercase tracking-widest">Notification Center</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Filters */}
            <div className="px-4 py-4 flex gap-2 border-b border-white/5">
              <button 
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeFilter === 'all' ? 'bg-yellow-500 text-black shadow-lg' : 'bg-white/5 text-gray-400'}`}
              >
                সবগুলো ({notifications.length})
              </button>
              <button 
                onClick={() => setActiveFilter('unread')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeFilter === 'unread' ? 'bg-yellow-500 text-black shadow-lg' : 'bg-white/5 text-gray-400'}`}
              >
                অপঠিত ({notifications.filter(n => !n.read).length})
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-40 py-20">
                  <Bell size={48} className="mb-4 text-gray-600" />
                  <p className="text-gray-400 font-bold">কোনো নোটিফিকেশন নেই</p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <motion.div
                    layout
                    key={notification.id}
                    onClick={() => {
                      handleMarkAsRead(notification.id!);
                      if (notification.actionUrl && onAction) {
                        onAction(notification.actionUrl);
                        onClose();
                      }
                    }}
                    className={`relative p-4 rounded-2xl border transition-all cursor-pointer group ${notification.read ? 'bg-white/5 border-white/5' : 'bg-teal-900/20 border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.1)]'}`}
                  >
                    {!notification.read && (
                      <div className="absolute top-4 right-4 w-2 h-2 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.8)]"></div>
                    )}
                    <div className="flex gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notification.read ? 'bg-white/5' : 'bg-teal-500/20'}`}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-bold mb-1 truncate ${notification.read ? 'text-gray-300' : 'text-white'}`}>
                          {notification.title}
                        </h4>
                        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold">
                            <Clock size={10} />
                            {formatTime(notification.createdAt)}
                          </div>
                          <button 
                            onClick={(e) => handleDelete(e, notification.id!)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-all text-gray-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 bg-black/40">
              <button 
                onClick={onClose}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors text-sm"
              >
                বন্ধ করুন
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      {notificationToDelete && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/10 w-full max-w-sm">
            <h3 className="text-white font-black mb-4">Are you sure you want to delete this task?</h3>
            <div className="flex gap-4">
              <button onClick={() => setNotificationToDelete(null)} className="flex-1 py-2 rounded-xl bg-white/10 text-white font-bold">Cancel</button>
              <button 
                onClick={() => {
                  setNotifications(prev => prev.filter(n => n.id !== notificationToDelete));
                  setNotificationToDelete(null);
                }} 
                className="flex-1 py-2 rounded-xl bg-red-600 text-white font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

const TrendingUp = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);
