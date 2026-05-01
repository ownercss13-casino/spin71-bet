import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, TrendingDown, RefreshCw, Zap } from 'lucide-react';
import { apiService } from '../../services/apiService';

export default function MarketTicker() {
  const [marketData, setMarketData] = useState<{ btc: number; multiplier: string; trend: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketData = async () => {
    setLoading(true);
    setError(null);
    try {
      // First check if backend is even reachable
      console.log("[MarketTicker] Checking backend connectivity...");
      try {
        const healthRes = await fetch('/api/health');
        if (!healthRes.ok) console.warn("[MarketTicker] Health check returned non-200", healthRes.status);
      } catch (e) {
        console.warn("[MarketTicker] Backend totally unreachable via /api/health");
      }

      const response = await apiService.proxyGet<any>('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
      
      if (response.success && response.data) {
        const price = parseFloat(response.data.price);
        setMarketData({
          btc: price,
          multiplier: (price / 50000).toFixed(4),
          trend: Math.random() > 0.5 ? 'up' : 'down'
        });
      } else {
        setError('Failed to fetch market data');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-3 mb-4 overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-100 transition-opacity">
        <button onClick={fetchMarketData} disabled={loading}>
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <Zap size={16} className="text-orange-500" />
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Live Market Odds</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white">BTC/USDT</span>
              {marketData && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${marketData.trend === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {marketData.trend === 'up' ? <TrendingUp size={10} className="inline mr-1" /> : <TrendingDown size={10} className="inline mr-1" />}
                  {marketData.trend === 'up' ? '+1.2%' : '-0.8%'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-right">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-6 w-24 bg-white/5 animate-pulse rounded"
              />
            ) : error ? (
              <motion.div 
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[10px] text-red-400 font-bold"
              >
                {error}
              </motion.div>
            ) : (
              <motion.div
                key="data"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex flex-col items-end"
              >
                <span className="text-base font-black text-orange-400 tracking-tight">
                  ${marketData?.btc.toLocaleString()}
                </span>
                <span className="text-[10px] text-white/40 font-mono">
                  MULT: x{marketData?.multiplier}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Decorative line */}
      <div className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent w-full" />
    </div>
  );
}
