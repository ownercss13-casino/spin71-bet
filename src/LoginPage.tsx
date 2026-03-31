import React from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { Plane } from 'lucide-react';

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google Login Error:", error);
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
        
        <button 
          onClick={handleGoogleLogin}
          className="bg-white text-gray-900 font-bold py-4 px-8 rounded-full flex items-center gap-3 hover:bg-gray-100 transition-all shadow-xl hover:scale-105"
        >
          <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-6 h-6" />
          Google দিয়ে লগইন করুন
        </button>
      </div>
    </div>
  );
}
