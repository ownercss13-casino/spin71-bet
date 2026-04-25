import React, { useState } from 'react';
import { 
  ArrowLeft, Users, DollarSign, Activity, CreditCard, 
  Search, TrendingUp, ChevronRight, UserPlus, 
  Wallet, History, BarChart3, RefreshCw, Send,
  Settings, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AgentPanelProps {
  onBack: () => void;
  userData: any;
  showToast: (msg: string, type?: any) => void;
}

export default function AgentPanel({ 
  onBack, 
  userData, 
  showToast
}: AgentPanelProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'players' | 'transfer' | 'stats'>('dashboard');

  return (
    <div className="bg-[#0b1120] p-4 md:p-6 rounded-3xl w-full max-w-7xl mx-auto text-white min-h-[85vh] flex flex-col md:flex-row gap-6 border border-teal-900/50 shadow-2xl font-sans">
      <div className="w-full text-center py-20">
        <Activity size={64} className="mx-auto text-teal-500 mb-4 opacity-20" />
        <h2 className="text-2xl font-black italic text-teal-400">Agent Panel Disconnected</h2>
        <p className="text-gray-400 mt-2">Firebase is disconnected. Real-time agent features are currently unavailable.</p>
        <button 
          onClick={onBack}
          className="mt-6 px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-colors flex items-center gap-2 mx-auto"
        >
          <ArrowLeft size={18} /> ফিরে যান
        </button>
      </div>
    </div>
  );
}
