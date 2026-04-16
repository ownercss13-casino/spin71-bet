import React, { useState, useRef } from 'react';
import { Edit2, Check, X, Loader2, Upload } from 'lucide-react';
import { updateGlobalImage } from '../services/firebaseService';

interface GlobalImageProps {
  imageKey: string;
  defaultUrl: string;
  currentUrl?: string;
  className?: string;
  alt?: string;
  showToast?: (msg: string, type?: any) => void;
  containerClassName?: string;
  isAdmin?: boolean;
  updateGlobalImage?: (url: string) => Promise<void>;
}

export default function GlobalImage({ 
  imageKey, 
  defaultUrl, 
  currentUrl, 
  className, 
  alt = "Image", 
  showToast,
  containerClassName = "",
  isAdmin = false,
  updateGlobalImage: customUpdate
}: GlobalImageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newUrl, setNewUrl] = useState(currentUrl || defaultUrl);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onerror = () => {
        if (showToast) showToast("ছবিটি পড়তে সমস্যা হয়েছে।", "error");
      };
      reader.onloadend = () => {
        setNewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!newUrl.trim()) {
      showToast?.("URL ফাঁকা রাখা যাবে না", "error");
      return;
    }
    
    setIsSaving(true);
    try {
      if (customUpdate) {
        await customUpdate(newUrl);
      } else {
        const { updateGlobalImage: defaultUpdate } = await import('../services/firebaseService');
        await defaultUpdate(imageKey, newUrl);
      }
      showToast?.("ছবি সফলভাবে আপডেট করা হয়েছে", "success");
      setIsEditing(false);
    } catch (error) {
      showToast?.("ছবি আপডেট করতে সমস্যা হয়েছে", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`relative group ${containerClassName}`}>
      <img 
        src={currentUrl || defaultUrl} 
        alt={alt} 
        className={className}
        referrerPolicy="no-referrer"
      />
      
      {/* Edit Button Overlay */}
      {isAdmin && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setNewUrl(currentUrl || defaultUrl);
            setIsEditing(true);
          }}
          className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity z-50 hover:bg-black/80 shadow-lg border border-white/20"
          title="ছবি পরিবর্তন করুন"
        >
          <Edit2 size={16} />
        </button>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000] p-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-[#1a1a1a] p-6 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl">
            <h3 className="text-lg font-bold mb-4 text-white">ছবি পরিবর্তন করুন ({imageKey})</h3>
            
            <div className="mb-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">গ্যালারি থেকে আপলোড করুন</label>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-white/5 border border-white/10 border-dashed rounded-xl p-4 text-white hover:bg-white/10 transition-colors flex flex-col items-center justify-center gap-2"
                >
                  <Upload size={24} className="text-yellow-500" />
                  <span className="text-sm font-bold">ছবি নির্বাচন করুন</span>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*" 
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="h-px bg-white/10 flex-1"></div>
                <span className="text-xs text-gray-500 font-bold uppercase">অথবা URL দিন</span>
                <div className="h-px bg-white/10 flex-1"></div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">ছবির URL</label>
                <input
                  type="text"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-yellow-500 text-sm"
                  placeholder="https://example.com/image.png"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-3 rounded-xl font-bold bg-white/5 text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
              >
                <X size={18} /> বাতিল
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-3 rounded-xl font-bold bg-yellow-500 text-black hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <><Check size={18} /> সেভ করুন</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
