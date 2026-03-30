import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, ArrowRight, LogIn, ShieldCheck, Facebook } from 'lucide-react';
import { motion } from 'motion/react';
import { GoogleAuthProvider, FacebookAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';

interface LoginViewProps {
  onLogin: (credentials: any) => void;
  onGoToRegister: () => void;
}

export default function LoginView({ onLogin, onGoToRegister }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      onLogin({ method: 'google', user: result.user });
    } catch (err) {
      console.error("Google Login Error:", err);
      setError("জিমেইল দিয়ে লগইন ব্যর্থ হয়েছে। (Google login failed.)");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new FacebookAuthProvider();
      const result = await signInWithPopup(auth, provider);
      onLogin({ method: 'facebook', user: result.user });
    } catch (err) {
      console.error("Facebook Login Error:", err);
      setError("ফেসবুক দিয়ে লগইন ব্যর্থ হয়েছে। (Facebook login failed.)");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError("ইউজার নেম এবং পাসওয়ার্ড দিন। (Enter username and password.)");
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      onLogin({ username, password });
    } catch (err) {
      setError("লগইন ব্যর্থ হয়েছে। সঠিক তথ্য দিন। (Login failed. Check credentials.)");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white flex flex-col font-sans max-w-md mx-auto">
      {/* Header */}
      <div className="bg-[#128a61] p-10 pt-16 rounded-b-[50px] shadow-2xl relative overflow-hidden text-center">
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-yellow-400/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="inline-block mb-6 p-4 bg-black/20 rounded-3xl backdrop-blur-md border border-white/10">
            <h2 className="text-5xl font-black italic tracking-tighter text-white drop-shadow-2xl">
              SPIN71
            </h2>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">ফিরে আসার জন্য ধন্যবাদ!</h1>
          <p className="text-teal-100 text-sm opacity-80">আপনার অ্যাকাউন্টে লগইন করুন</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 p-6 -mt-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#1b1b1b] rounded-[40px] p-8 shadow-2xl border border-white/5"
        >
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl text-xs text-center animate-pulse">
                {error}
              </div>
            )}

            {/* Username */}
            <div className="space-y-2">
              <label className="text-xs text-teal-300 font-bold ml-2 uppercase tracking-widest">ইউজার নেম (Username)</label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-teal-500" size={20} />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="আপনার ইউজার নেম"
                  className="w-full bg-black/50 border border-teal-900/50 rounded-2xl py-4 pl-14 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-teal-500 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-2">
                <label className="text-xs text-teal-300 font-bold uppercase tracking-widest">পাসওয়ার্ড (Password)</label>
                <button type="button" className="text-[10px] text-teal-500 font-bold hover:underline uppercase">পাসওয়ার্ড ভুলে গেছেন?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-teal-500" size={20} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/50 border border-teal-900/50 rounded-2xl py-4 pl-14 pr-14 text-white placeholder-gray-600 focus:outline-none focus:border-teal-500 transition-all"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-teal-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-3 px-2">
              <div className="w-5 h-5 rounded bg-teal-500 flex items-center justify-center">
                <ShieldCheck size={14} className="text-white" />
              </div>
              <span className="text-xs text-gray-400">লগইন তথ্য মনে রাখুন</span>
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-black py-4 rounded-2xl shadow-xl shadow-yellow-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
              ) : (
                <>
                  লগইন করুন
                  <LogIn size={22} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 flex items-center gap-4">
            <div className="h-px bg-white/10 flex-1"></div>
            <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">অথবা</span>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <button 
              type="button"
              onClick={handleGoogleLogin}
              className="bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-all active:scale-95 shadow-xl"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button 
              type="button"
              onClick={handleFacebookLogin}
              className="bg-[#1877F2] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#166fe5] transition-all active:scale-95 shadow-xl"
            >
              <Facebook size={20} />
              Facebook
            </button>
          </div>

          <div className="mt-10 text-center">
            <p className="text-gray-400 text-sm">
              অ্যাকাউন্ট নেই? 
              <button 
                onClick={onGoToRegister}
                className="text-yellow-400 font-bold ml-2 hover:underline"
              >
                রেজিস্ট্রেশন করুন
              </button>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Footer Info */}
      <div className="p-8 text-center space-y-4">
        <p className="text-[10px] text-gray-600 uppercase tracking-widest">© 2026 SPIN71 BET. ALL RIGHTS RESERVED.</p>
      </div>
    </div>
  );
}
