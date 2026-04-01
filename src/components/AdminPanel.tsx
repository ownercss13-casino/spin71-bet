import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowLeft } from 'lucide-react';

export default function AdminPanel({ onBack }: { onBack: () => void }) {
  const [signals, setSignals] = useState<number[]>([]);
  const [liveMultiplier, setLiveMultiplier] = useState(1.00);
  const [isFlying, setIsFlying] = useState(false);

  const generateSignals = () => {
    const newSignals = Array.from({ length: 50 }, () => {
      const base = Math.random() * 19 + 1;
      return parseFloat(base.toFixed(2));
    });
    setSignals(newSignals);
  };

  useEffect(() => {
    generateSignals();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isFlying) {
      interval = setInterval(() => {
        setLiveMultiplier((prev) => {
          const next = prev + 0.05;
          if (next >= 10) {
            setIsFlying(false);
            return 1.00;
          }
          return parseFloat(next.toFixed(2));
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isFlying]);

  return (
    <div className="bg-teal-950 p-6 rounded-3xl w-full max-w-2xl mx-auto text-white">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="p-2 bg-teal-800 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold">Aviator Signal Admin</h2>
        <button onClick={generateSignals} className="p-2 bg-yellow-500 rounded-full text-black">
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="bg-teal-900 p-4 rounded-xl mb-6 text-center">
        <p className="text-teal-400 text-sm mb-2">Live Flight Simulation</p>
        <div className="text-5xl font-black text-yellow-400 mb-4">{liveMultiplier.toFixed(2)}x</div>
        <button 
          onClick={() => setIsFlying(!isFlying)}
          className={`px-6 py-2 rounded-full font-bold ${isFlying ? 'bg-red-600' : 'bg-green-600'}`}
        >
          {isFlying ? 'Stop Flight' : 'Start Flight'}
        </button>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {signals.map((signal, index) => (
          <div 
            key={index} 
            className={`p-2 rounded-lg text-center font-bold ${index === 0 ? 'bg-yellow-500 text-black' : 'bg-teal-800'}`}
          >
            {signal.toFixed(2)}x
          </div>
        ))}
      </div>
      <p className="text-xs text-teal-400 mt-4 text-center">
        Note: These are simulated predictions and are not 100% accurate.
      </p>
    </div>
  );
}
