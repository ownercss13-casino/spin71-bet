import React from 'react';
import { ArrowLeft, Play, Wallet } from 'lucide-react';
import { Game } from '../components/ui/GameGrid';

interface GenericGameViewProps {
  selectedGame: Game;
  globalName: string;
  globalOption: string;
  globalLogo: string;
  userData: any;
  onClose: () => void;
  onDeposit: () => void;
  setShowDepositRequired: (show: boolean) => void;
  showToast: (msg: string, type?: any) => void;
}

export default function GenericGameView({
  selectedGame,
  globalName,
  globalOption,
  globalLogo,
  userData,
  onClose,
  onDeposit,
  setShowDepositRequired,
  showToast
}: GenericGameViewProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col max-w-[512px] mx-auto min-h-[100dvh] safe-top safe-bottom">
      {/* Game Header */}
      <div className="flex items-center justify-between p-4 bg-teal-900 border-b border-teal-800">
        <button 
          onClick={onClose}
          className="text-white p-1 hover:bg-teal-800 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex flex-col items-center">
          <h3 className="text-white font-bold text-sm">{globalName || selectedGame.name}</h3>
          <span className="text-teal-300 text-[10px] uppercase tracking-widest">{globalOption || selectedGame.provider}</span>
        </div>
        <div className="w-8"></div>
      </div>

      {/* Game Viewport */}
      <div className="flex-1 relative bg-gray-900 flex flex-col items-center justify-center overflow-hidden">
        <>
          <img 
            src={globalLogo || selectedGame.image} 
            className="absolute inset-0 w-full h-full object-cover opacity-20 blur-xl"
            alt="Background"
          />
          
          <div className="relative z-10 flex flex-col items-center text-center p-6">
            <div className={`w-48 h-64 rounded-2xl bg-gradient-to-b ${selectedGame.bgColor || 'from-gray-800 to-gray-900'} shadow-2xl border-2 border-white/20 mb-8 overflow-hidden transform hover:scale-105 transition-transform duration-500 relative`}>
              <img src={globalLogo || selectedGame.image} className="w-full h-full object-cover opacity-80 mix-blend-overlay" alt={globalName || selectedGame.name} />
              <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse shadow-lg">REAL</div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                    <Play size={32} className="text-white fill-white ml-1" />
                 </div>
              </div>
            </div>
            
            <h2 className="text-3xl font-black text-white mb-2 drop-shadow-lg">{globalName || selectedGame.name}</h2>
            <p className="text-teal-200 mb-8 max-w-[250px]">গেমটি প্রস্তুত! নিচে ক্লিক করে খেলা শুরু করুন এবং বড় জয়ের জন্য প্রস্তুত হন!</p>
            
            <button 
              onClick={() => {
                if (!userData?.totalDeposits || userData.totalDeposits === 0) {
                  setShowDepositRequired(true);
                  onClose();
                  return;
                }
                if (userData?.role === 'admin') {
                  showToast('অ্যাডমিন প্যানেল থেকে এই গেমটির URL সেট করুন।', 'info');
                } else {
                  showToast('এই গেমটি বর্তমানে রক্ষণাবেক্ষণে আছে। অনুগ্রহ করে অন্য গেম চেষ্টা করুন।', 'info');
                }
              }}
              className="bg-gradient-to-b from-yellow-400 to-yellow-600 text-black font-black px-12 py-3 rounded-full text-lg shadow-[0_4px_15px_rgba(234,179,8,0.4)] hover:scale-105 transition-transform active:scale-95"
            >
              খেলুন
            </button>
          </div>

          {/* Floating Particles/Effects */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
          <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-teal-400 rounded-full animate-pulse"></div>
          <div className="absolute top-1/2 right-10 w-1 h-1 bg-white rounded-full animate-bounce"></div>
        </>
      </div>

      {/* Game Footer */}
      <div className="p-4 bg-teal-950 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-teal-800 flex items-center justify-center">
            <Wallet size={16} className="text-yellow-400" />
          </div>
          <div>
            <p className="text-[10px] text-teal-400 uppercase font-bold">ব্যালেন্স</p>
            <p className="text-white font-bold text-sm">৳ {userData?.balance?.toLocaleString() || '0'}</p>
          </div>
        </div>
        <button 
          onClick={onDeposit}
          className="bg-teal-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold border border-teal-700 hover:bg-teal-700 transition-colors"
        >
          জমা করুন
        </button>
      </div>
    </div>
  );
}
