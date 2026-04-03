import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ id, message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 3000);

    return () => clearTimeout(timer);
  }, [id, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="text-green-400" size={18} />;
      case 'error': return <AlertCircle className="text-red-400" size={18} />;
      case 'warning': return <AlertCircle className="text-yellow-400" size={18} />;
      default: return <Info className="text-blue-400" size={18} />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success': return 'bg-green-950/90 border-green-500/50';
      case 'error': return 'bg-red-950/90 border-red-500/50';
      case 'warning': return 'bg-yellow-950/90 border-yellow-500/50';
      default: return 'bg-blue-950/90 border-blue-500/50';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md min-w-[280px] max-w-[90vw] ${getBgColor()}`}
    >
      {/* Close button on the LEFT as requested */}
      <button 
        onClick={() => onClose(id)}
        className="p-1 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
      >
        <X size={16} />
      </button>

      <div className="flex-shrink-0">
        {getIcon()}
      </div>
      
      <p className="text-white text-sm font-medium flex-1">{message}</p>
    </motion.div>
  );
};

interface ToastContainerProps {
  toasts: { id: string; message: string; type: ToastType }[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast {...toast} onClose={removeToast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};
