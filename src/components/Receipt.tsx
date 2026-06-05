import React from 'react';
import { Download, Share2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import download from 'downloadjs';

interface ReceiptProps {
  type: 'deposit' | 'withdrawal';
  amount: number;
  trxId: string;
  date: string;
  status: string;
  onClose: () => void;
}

export default function Receipt({ type, amount, trxId, date, status, onClose }: ReceiptProps) {
  const receiptRef = React.useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (receiptRef.current) {
      const dataUrl = await toPng(receiptRef.current, { cacheBust: true });
      download(dataUrl, `receipt-${trxId}.png`);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <div ref={receiptRef} className="bg-white p-6 rounded-3xl text-black space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-black uppercase tracking-widest">{type === 'deposit' ? 'DEPOSIT' : 'WITHDRAWAL'} RECEIPT</h2>
            <p className="text-[10px] text-gray-500 font-mono italic">#{trxId}</p>
          </div>
          
          <div className="border-t border-dashed border-gray-300 py-4 space-y-2">
            <div className="flex justify-between">
              <span className="font-bold text-sm text-gray-600">Amount</span>
              <span className="font-black text-xl">৳ {amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-sm text-gray-600">Status</span>
              <span className="font-black text-sm uppercase text-emerald-600">{status}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-sm text-gray-600">Date</span>
              <span className="font-mono text-xs">{date}</span>
            </div>
          </div>
          
          <div className="text-center pt-2">
            <p className="text-[10px] font-bold text-gray-400">THANK YOU FOR CHOOSING US</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 bg-[#3ed0ca] text-black py-3 rounded-2xl font-black text-xs uppercase tracking-widest"
          >
            <Download size={16} /> Save
          </button>
          <button 
            onClick={onClose}
            className="bg-white/10 text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
