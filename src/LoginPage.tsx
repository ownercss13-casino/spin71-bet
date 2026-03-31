import React from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { Plane } from 'lucide-react';

export default function LoginPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleGoogleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Google Login Error:", error);
      if (error.code === 'auth/cancelled-popup-request') {
        setError("আগের লগইন অনুরোধটি বাতিল করা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন। (Previous login request cancelled. Please try again.)");
      } else if (error.code === 'auth/popup-closed-by-user') {
        setError("লগইন উইন্ডোটি বন্ধ করা হয়েছে। (Login window closed.)");
      } else {
        setError("লগইন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন। (Login failed. Please try again.)");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-teal-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Game-themed background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-red-500 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 text-center">
        <div className="mb-8 animate-bounce">
          <Plane size={80} className="text-yellow-400 mx-auto" />
        </div>
        <h1 className="text-4xl font-black text-white mb-2 italic">SPIN71BET</h1>
        <p className="text-teal-200 mb-10">আপনার গেমিং যাত্রা শুরু করুন</p>
        
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-xl text-sm max-w-xs mx-auto">
            {error}
          </div>
        )}

        <button 
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className={`bg-white text-gray-900 font-bold py-4 px-8 rounded-full flex items-center gap-3 hover:bg-gray-100 transition-all shadow-xl ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105'}`}
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-6 h-6" />
          )}
          {isLoading ? 'লগইন হচ্ছে...' : 'Google দিয়ে লগইন করুন'}
        </button>
      </div>
    </div>
  );
}
