import React, { useState } from 'react';
import { 
  signInAnonymously, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { 
  Plane, 
  Play, 
  CheckCircle2, 
  ArrowRight, 
  X, 
  Mail, 
  Lock, 
  User, 
  LogIn, 
  UserPlus, 
  Chrome,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Validation Schemas
const loginSchema = z.object({
  email: z.string().email('সঠিক ইমেইল দিন (Invalid email)'),
  password: z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে (Min 6 chars)'),
});

const registerSchema = z.object({
  username: z.string().min(3, 'নাম কমপক্ষে ৩ অক্ষরের হতে হবে (Min 3 chars)'),
  email: z.string().email('সঠিক ইমেইল দিন (Invalid email)'),
  password: z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে (Min 6 chars)'),
  confirmPassword: z.string().min(6, 'পাসওয়ার্ড নিশ্চিত করুন'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "পাসওয়ার্ড মিলছে না (Passwords don't match)",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

import { ToastType } from './components/Toast';

interface LoginPageProps {
  onRegisterSuccess: () => void;
  onContinue: () => void;
  onLoginSuccess: () => void;
  showToast: (msg: string, type?: ToastType) => void;
}

export default function LoginPage({ onRegisterSuccess, onContinue, onLoginSuccess, showToast }: LoginPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [authMode, setAuthMode] = useState<'one-click' | 'login' | 'register'>('one-click');
  const [showPassword, setShowPassword] = useState(false);

  const { 
    register: registerLogin, 
    handleSubmit: handleSubmitLogin, 
    formState: { errors: loginErrors } 
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  const { 
    register: registerSignup, 
    handleSubmit: handleSubmitSignup, 
    formState: { errors: signupErrors } 
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema)
  });

  const handleAuthError = (err: any) => {
    console.error("Auth Error:", err);
    setIsLoading(false);
    
    let msg = "কিছু ভুল হয়েছে। আবার চেষ্টা করুন। (Something went wrong. Please try again.)";

    if (err.code === 'auth/admin-restricted-operation') {
      setError("ADMIN_RESTRICTED");
      return;
    }

    if (err.code === 'auth/popup-closed-by-user') {
      msg = "পপআপ উইন্ডোটি বন্ধ করা হয়েছে। আবার চেষ্টা করুন। (Popup closed. Please try again.)";
    } else if (err.code === 'auth/email-already-in-use') {
      msg = "এই ইমেইলটি ইতিমধ্যে ব্যবহার করা হয়েছে। (Email already in use.)";
    } else if (err.code === 'auth/invalid-credential') {
      msg = "ইমেইল বা পাসওয়ার্ড ভুল। (Invalid email or password)";
    } else if (err.code === 'auth/operation-not-allowed') {
      msg = "এই লগইন পদ্ধতিটি বর্তমানে বন্ধ আছে। (Auth method not allowed)";
    }
    
    setError(msg);
    showToast(msg, "error");
  };

  const onOneClick = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      await signInAnonymously(auth);
      showToast("সফলভাবে লগইন করা হয়েছে (Guest)", "success");
      onLoginSuccess();
      onRegisterSuccess();
    } catch (err) {
      handleAuthError(err);
    }
  };

  const onGoogleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      showToast("গুগল লগইন সফল হয়েছে", "success");
      onLoginSuccess();
      onRegisterSuccess();
    } catch (err) {
      handleAuthError(err);
    }
  };

  const onEmailLogin = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      showToast("লগইন সফল হয়েছে", "success");
      onLoginSuccess();
      onRegisterSuccess();
    } catch (err) {
      handleAuthError(err);
    }
  };

  const onEmailRegister = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await updateProfile(userCredential.user, { displayName: data.username });
      showToast("অ্যাকাউন্ট তৈরি সফল হয়েছে", "success");
      onRegisterSuccess();
    } catch (err) {
      handleAuthError(err);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#0a0a0a] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans safe-top safe-bottom">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-500/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center max-w-sm w-full"
      >
        {/* Logo Section */}
        <div className="mb-8">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-block"
          >
            <Plane size={60} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] mx-auto" />
          </motion.div>
          <h1 className="text-4xl font-black text-white mt-4 italic tracking-tighter">
            SPIN<span className="text-yellow-400">71</span>BET
          </h1>
          <p className="text-teal-500 font-bold uppercase tracking-widest text-[10px] mt-1">Premium Gaming Platform</p>
        </div>

        {/* Auth Mode Toggle */}
        <div className="flex bg-white/5 p-1 rounded-2xl mb-8 border border-white/10">
          <button 
            onClick={() => setAuthMode('one-click')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${authMode === 'one-click' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            ওয়ান ক্লিক
          </button>
          <button 
            onClick={() => setAuthMode('login')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${authMode === 'login' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            লগইন
          </button>
          <button 
            onClick={() => setAuthMode('register')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${authMode === 'register' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            নিবন্ধন
          </button>
        </div>

        {/* Error Display */}
        {error && error === "ADMIN_RESTRICTED" ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 p-4 rounded-2xl text-left backdrop-blur-md"
          >
            <h3 className="font-black text-yellow-400 text-xs mb-1 flex items-center gap-2">
              <AlertCircle size={14} /> সেটিংস ঠিক করুন
            </h3>
            <p className="text-[10px] opacity-80 mb-3">ফায়ারবেস কনসোলে "Anonymous Login" চালু করতে হবে।</p>
            <a 
              href="https://console.firebase.google.com/project/gen-lang-client-0089977420/authentication/providers" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full bg-yellow-500 text-black text-center py-2 rounded-lg font-black text-[10px] hover:bg-yellow-400 transition-colors"
            >
              কনসোল ওপেন করুন
            </a>
          </motion.div>
        ) : error && error.includes("Email already in use") ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-[10px] leading-relaxed flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
            <button 
              onClick={() => {
                setAuthMode('login');
                setError(null);
              }}
              className="bg-red-500/20 text-red-400 py-1.5 rounded-lg font-black text-[9px] hover:bg-red-500/30 transition-all border border-red-500/20"
            >
              লগইন করুন (Login Now)
            </button>
          </motion.div>
        ) : error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-[10px] leading-relaxed flex items-center gap-2"
          >
            <AlertCircle size={14} /> {error}
          </motion.div>
        )}

        {/* Auth Forms */}
        <AnimatePresence mode="wait">
          {authMode === 'one-click' && (
            <motion.div
              key="one-click"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <button 
                onClick={onOneClick}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 py-4 rounded-2xl flex items-center justify-center gap-3 group transition-all active:scale-95 shadow-lg"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Play size={20} className="fill-black text-black" />
                    <span className="text-black font-black uppercase tracking-tight">ওয়ান ক্লিক এ নিবন্ধন</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-[1px] bg-white/10"></div>
                <span className="text-[10px] text-gray-500 font-bold uppercase">অথবা</span>
                <div className="flex-1 h-[1px] bg-white/10"></div>
              </div>

              <button 
                onClick={onGoogleLogin}
                disabled={isLoading}
                className="w-full bg-white/5 border border-white/10 py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-95"
              >
                <Chrome size={20} className="text-white" />
                <span className="text-white font-bold text-sm">গুগল দিয়ে লগইন</span>
              </button>
            </motion.div>
          )}

          {authMode === 'login' && (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSubmitLogin(onEmailLogin)}
              className="space-y-4"
            >
              <div className="space-y-1">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input 
                    {...registerLogin('email')}
                    type="email" 
                    placeholder="ইমেইল এড্রেস"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:border-yellow-500 outline-none transition-all"
                  />
                </div>
                {loginErrors.email && <p className="text-[10px] text-red-400 text-left pl-2">{loginErrors.email.message}</p>}
              </div>

              <div className="space-y-1">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input 
                    {...registerLogin('password')}
                    type={showPassword ? "text" : "password"} 
                    placeholder="পাসওয়ার্ড"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white text-sm focus:border-yellow-500 outline-none transition-all"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {loginErrors.password && <p className="text-[10px] text-red-400 text-left pl-2">{loginErrors.password.message}</p>}
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-yellow-500 py-4 rounded-2xl text-black font-black uppercase tracking-tight flex items-center justify-center gap-2 hover:bg-yellow-400 transition-all active:scale-95"
              >
                {isLoading ? <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin"></div> : <><LogIn size={20} /> লগইন করুন</>}
              </button>
            </motion.form>
          )}

          {authMode === 'register' && (
            <motion.form
              key="register"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSubmitSignup(onEmailRegister)}
              className="space-y-3"
            >
              <div className="space-y-1">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input 
                    {...registerSignup('username')}
                    type="text" 
                    placeholder="আপনার নাম"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white text-sm focus:border-yellow-500 outline-none transition-all"
                  />
                </div>
                {signupErrors.username && <p className="text-[10px] text-red-400 text-left pl-2">{signupErrors.username.message}</p>}
              </div>

              <div className="space-y-1">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input 
                    {...registerSignup('email')}
                    type="email" 
                    placeholder="ইমেইল এড্রেস"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white text-sm focus:border-yellow-500 outline-none transition-all"
                  />
                </div>
                {signupErrors.email && <p className="text-[10px] text-red-400 text-left pl-2">{signupErrors.email.message}</p>}
              </div>

              <div className="space-y-1">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input 
                    {...registerSignup('password')}
                    type={showPassword ? "text" : "password"} 
                    placeholder="পাসওয়ার্ড"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-12 text-white text-sm focus:border-yellow-500 outline-none transition-all"
                  />
                </div>
                {signupErrors.password && <p className="text-[10px] text-red-400 text-left pl-2">{signupErrors.password.message}</p>}
              </div>

              <div className="space-y-1">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input 
                    {...registerSignup('confirmPassword')}
                    type={showPassword ? "text" : "password"} 
                    placeholder="পাসওয়ার্ড নিশ্চিত করুন"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-12 text-white text-sm focus:border-yellow-500 outline-none transition-all"
                  />
                </div>
                {signupErrors.confirmPassword && <p className="text-[10px] text-red-400 text-left pl-2">{signupErrors.confirmPassword.message}</p>}
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-yellow-500 py-4 rounded-2xl text-black font-black uppercase tracking-tight flex items-center justify-center gap-2 hover:bg-yellow-400 transition-all active:scale-95 mt-2"
              >
                {isLoading ? <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin"></div> : <><UserPlus size={20} /> নিবন্ধন করুন</>}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="mt-8 text-gray-600 text-[9px] font-bold uppercase tracking-widest leading-relaxed">
          নিবন্ধন করার মাধ্যমে আপনি আমাদের <span className="text-teal-500">শর্তাবলী</span> মেনে নিচ্ছেন
        </p>
      </motion.div>

      {/* Success Popup */}
      <AnimatePresence>
        {showSuccessPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />
            
            <motion.div 
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              className="relative bg-[#111] border border-white/10 rounded-[40px] p-8 max-w-sm w-full text-center shadow-2xl overflow-hidden"
            >
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-teal-500/20 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="w-20 h-20 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(20,184,166,0.5)]">
                  <CheckCircle2 size={40} className="text-white" />
                </div>
                
                <h2 className="text-3xl font-black text-white mb-2 italic">অভিনন্দন!</h2>
                <p className="text-teal-400 font-bold text-lg mb-8">আপনার নিবন্ধন সফল হয়েছে</p>

                <div className="bg-white/5 rounded-2xl p-4 mb-8 border border-white/5">
                  <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mb-1">Welcome Bonus</p>
                  <p className="text-yellow-400 text-3xl font-black">৳ ৫০৭.০০</p>
                </div>

                <button 
                  onClick={onContinue} 
                  className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white font-black py-5 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 group"
                >
                  গেম শুরু করুন <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
