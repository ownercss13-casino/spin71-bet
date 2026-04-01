import React, { useState, useEffect } from 'react';
import { generateAviatorLogos } from './services/logoGenerator';
import { Check, Loader2, RefreshCw, X, AlertCircle } from 'lucide-react';

interface LogoPreviewProps {
  onClose: () => void;
  onSelect?: (logo: string) => void;
}

export default function LogoPreview({ onClose, onSelect }: LogoPreviewProps) {
  const [logos, setLogos] = useState<string[]>([]);
  const [logoCodes, setLogoCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogos = async () => {
    setLoading(true);
    setError(null);
    try {
      const generatedLogos = await generateAviatorLogos();
      setLogos(generatedLogos);
      setLogoCodes(generatedLogos.map(() => 'LOGO-' + Math.random().toString(36).substr(2, 4).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase()));
    } catch (error) {
      console.error("Error generating logos:", error);
      setError("লোগো তৈরি করার কোটা শেষ হয়ে গেছে। দয়া করে কিছুক্ষণ পর আবার চেষ্টা করুন। (Quota exceeded. Please try again later.)");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogos();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8 flex flex-col items-center relative overflow-y-auto">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-gray-500 hover:text-white p-2 bg-white/5 rounded-full"
      >
        <X size={24} />
      </button>

      <h2 className="text-3xl font-black text-white mb-2 italic">AVIATOR <span className="text-yellow-400">LOGOS</span></h2>
      <p className="text-gray-500 text-sm mb-8">আপনার পছন্দের লোগোটি বেছে নিন (Choose your favorite logo)</p>

      {loading ? (
        <div className="flex flex-col items-center gap-4 mt-20">
          <Loader2 className="animate-spin text-yellow-400" size={48} />
          <p className="text-yellow-400 font-bold animate-pulse">লোগো তৈরি হচ্ছে... (Generating...)</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-4 mt-20 text-center p-6 bg-red-900/20 rounded-2xl border border-red-500/30">
          <AlertCircle className="text-red-500" size={48} />
          <p className="text-red-400 font-bold">{error}</p>
          <button 
            onClick={fetchLogos}
            className="mt-4 flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-red-400 transition-all"
          >
            <RefreshCw size={20} /> পুনরায় চেষ্টা করুন (Retry)
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          {logos.map((logo, index) => (
            <div key={index} className="group relative bg-white/5 border border-white/10 rounded-3xl p-4 transition-all hover:border-yellow-500/50">
              <img 
                src={logo} 
                alt={`Aviator Logo ${index + 1}`} 
                className="w-full aspect-square object-cover rounded-2xl mb-4"
                referrerPolicy="no-referrer"
              />
              <div className="text-center mb-4">
                <p className="text-yellow-500 font-mono font-bold text-lg tracking-widest">{logoCodes[index]}</p>
                <p className="text-gray-500 text-[10px]">এই কোডটি কপি করে আমাকে দিন (Copy this code and give it to me)</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white font-bold">Option {index + 1}</span>
                <button 
                  onClick={() => {
                    if (onSelect) onSelect(logo);
                    onClose();
                  }}
                  className="bg-yellow-500 text-black p-2 rounded-xl hover:bg-yellow-400 transition-colors"
                >
                  <Check size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <button 
          onClick={fetchLogos}
          className="mt-12 flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-2xl font-bold hover:bg-white/20 transition-all"
        >
          <RefreshCw size={20} /> আরও লোগো দেখুন (Regenerate)
        </button>
      )}
    </div>
  );
}
