import React from 'react';
import { ShoppingCart, Package, ChevronLeft } from 'lucide-react';

const shopItems = [
  { id: 1, name: 'VIP Level 1', price: '৳ 500', icon: Package },
  { id: 2, name: 'VIP Level 2', price: '৳ 1000', icon: Package },
  { id: 3, name: 'VIP Level 3', price: '৳ 2000', icon: Package },
];

export default function ShopView({ onTabChange }: { onTabChange: (tab: any) => void }) {
  return (
    <div className="flex-1 overflow-y-auto pb-20 p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onTabChange('home')}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-white">SPIN71 BET শপ</h2>
        </div>
        <button 
          onClick={() => onTabChange('profile')}
          className="text-teal-200 text-xs flex items-center gap-1 hover:text-white transition-colors"
        >
          প্রোফাইল দেখুন &rarr;
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {shopItems.map(item => (
          <div key={item.id} className="bg-teal-800/40 rounded-xl p-4 border border-teal-700/50 flex flex-col items-center">
            <item.icon size={40} className="text-yellow-400 mb-2" />
            <h3 className="text-white font-bold">{item.name}</h3>
            <p className="text-teal-200 text-sm">{item.price}</p>
            <button className="mt-3 bg-yellow-500 text-black font-bold py-1 px-4 rounded-lg text-sm">
              কিনুন
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
