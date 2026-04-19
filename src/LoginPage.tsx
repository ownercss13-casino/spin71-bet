import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  Loader2,
  Facebook,
  Send,
  Scan,
  Smartphone,
  ShieldCheck,
  ChevronLeft,
  Gift
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Validation Schemas
const loginSchema = z.object({
  username: z.string().min(3, 'নাম অথবা ফোন নম্বর দিন (Enter name or phone)'),
  password: z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে (Min 6 chars)'),
});

const registerSchema = z.object({
  username: z.string().min(3, 'নাম কমপক্ষে ৩ অক্ষরের হতে হবে (Min 3 chars)'),
  phoneNumber: z.string().min(11, 'সঠিক মোবাইল নম্বর দিন (Invalid phone number)'),
  password: z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে (Min 6 chars)'),
  confirmPassword: z.string().min(6, 'পাসওয়ার্ড নিশ্চিত করুন'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "পাসওয়ার্ড মিলছে না (Passwords don't match)",
  path: ["confirmPassword"],
});

const resetSchema = z.object({
  email: z.string().email('সঠিক ইমেইল দিন (Invalid email)'),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;
type ResetFormValues = z.infer<typeof resetSchema>;

import { ToastType } from './components/Toast';
import { auth, db } from './services/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  FacebookAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface LoginPageProps {
  onRegisterSuccess: () => void;
  onContinue: () => void;
  onLoginSuccess: (user: any) => void;
  showToast: (msg: string, type?: ToastType) => void;
  casinoName?: string;
  isLoggedIn?: boolean;
  welcomeBonus?: number;
}

export default function LoginPage({ onRegisterSuccess, onContinue, onLoginSuccess, showToast, casinoName = "SPIN71 BET", isLoggedIn = false, welcomeBonus = 507 }: LoginPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot-password'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(() => {
    return localStorage.getItem('remember_me') === 'true';
  });
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length > 6) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    setPasswordStrength(strength);
  };

  const { 
    register: registerLogin, 
    handleSubmit: handleSubmitLogin, 
    setValue: setValueLogin,
    formState: { errors: loginErrors } 
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: localStorage.getItem('remember_me') === 'true' ? localStorage.getItem('saved_username') || '' : ''
    }
  });

  useEffect(() => {
    if (rememberPassword) {
      const savedUsername = localStorage.getItem('saved_username');
      if (savedUsername && authMode === 'login') {
        setValueLogin('username', savedUsername);
      }
    }
  }, [rememberPassword, authMode, setValueLogin]);

  const { 
    register: registerSignup, 
    handleSubmit: handleSubmitSignup, 
    formState: { errors: signupErrors } 
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema)
  });

  const { 
    register: registerReset, 
    handleSubmit: handleSubmitReset, 
    formState: { errors: resetErrors } 
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema)
  });

  const handleAuthError = (err: any) => {
    setIsLoading(false);
    console.error("Auth Error:", err);
    
    // Ignore error if user closed the popup deliberately
    if (err.code === 'auth/popup-closed-by-user') {
      console.log("User closed the auth popup.");
      return;
    }

    // Handle network errors gracefully
    if (err.code === 'auth/network-request-failed') {
      showToast("ইন্টারনেট সংযোগ সমস্যা, আবার চেষ্টা করুন।", "error");
      setError("ইন্টারনেট সংযোগ সমস্যা। আপনার সংযোগ চেক করে আবার চেষ্টা করুন।");
      return;
    }

    let msg = "কিছু ভুল হয়েছে। (Something went wrong.)";
    setError(msg);
    showToast(msg, "error");
  };

  // Remove onOneClick function
  const onFacebookLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const provider = new FacebookAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        const referralCode = localStorage.getItem('referralCode');
        await setDoc(doc(db, 'users', user.uid), {
          username: user.displayName || 'FB User',
          balance: 507,
          role: 'user',
          createdAt: new Date().toISOString(),
          referredBy: referralCode || null
        });
        if (referralCode) localStorage.removeItem('referralCode');
      }
      
      showToast("ফেসবুক লগইন সফল হয়েছে", "success");
      onLoginSuccess({ id: user.uid, username: user.displayName });
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const onGoogleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        const referralCode = localStorage.getItem('referralCode');
        await setDoc(doc(db, 'users', user.uid), {
          username: user.displayName || 'Google User',
          balance: 507,
          role: 'user',
          createdAt: new Date().toISOString(),
          referredBy: referralCode || null
        });
        if (referralCode) localStorage.removeItem('referralCode');
      }

      showToast("গুগল লগইন সফল হয়েছে", "success");
      onLoginSuccess({ id: user.uid, username: user.displayName });
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const onEmailLogin = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      // For email login, we should probably have email addresses, 
      // but the username field is currently used in the form.
      // If the user enters an email-like string, use it.
      const email = data.username.includes('@') ? data.username : `${data.username}@spin71bet.com`;
      const result = await signInWithEmailAndPassword(auth, email, data.password);
      const user = result.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : { username: data.username, balance: 1000, role: 'user' };

      if (rememberPassword) {
        localStorage.setItem('remember_me', 'true');
        localStorage.setItem('saved_username', data.username);
      } else {
        localStorage.removeItem('remember_me');
        localStorage.removeItem('saved_username');
      }

      showToast("লগইন সফল হয়েছে", "success");
      onLoginSuccess({ id: user.uid, ...userData });
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const onEmailRegister = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const email = `${data.username.replace(/\s+/g, '').toLowerCase()}${Math.floor(Math.random()*1000)}@spin71bet.com`;
      const result = await createUserWithEmailAndPassword(auth, email, data.password);
      const user = result.user;
      
      await updateProfile(user, { displayName: data.username });

      const referralCode = localStorage.getItem('referralCode');

      const userData = {
        username: data.username,
        phoneNumber: data.phoneNumber,
        balance: 507,
        role: 'user',
        createdAt: new Date().toISOString(),
        referredBy: referralCode || null
      };

      await setDoc(doc(db, 'users', user.uid), userData);
      if (referralCode) localStorage.removeItem('referralCode');
      
      setIsLoading(false);
      onLoginSuccess({ id: user.uid, ...userData });
      onRegisterSuccess();
      showToast("অ্যাকাউন্ট তৈরি সফল হয়েছে", "success");
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordReset = async (data: ResetFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      // Mock password reset
      showToast("পাসওয়ার্ড রিসেট রিকোয়েস্ট সফল! (Password reset request successful)", "success");
      setAuthMode('login');
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-black flex flex-col items-center relative overflow-x-hidden font-sans safe-top safe-bottom">
      {/* Header Banner */}
      <div className="w-full relative h-[180px] sm:h-[220px]">
        <img 
          src="https://images.unsplash.com/photo-1585336261022-680e295ce3fe?q=80&w=2070&auto=format&fit=crop" 
          alt="Banner" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80"></div>
        <button 
          onClick={onContinue}
          className="absolute top-4 right-4 z-20 text-white/60 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="w-full max-w-md px-6 -mt-8 relative z-10">
        {/* Auth Mode Toggle */}
        <div className="flex bg-[#1a1a1a] p-1 rounded-2xl border border-[#333] mb-8">
          <button 
            onClick={() => setAuthMode('login')}
            className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${authMode === 'login' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-white/40 hover:text-white'}`}
          >
            লগইন
          </button>
          <button 
            onClick={() => setAuthMode('register')}
            className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${authMode === 'register' ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'text-white/40 hover:text-white'}`}
          >
            নিবন্ধন
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-red-500/20 border border-red-500/30 text-red-200 p-3 rounded-xl text-xs flex items-center gap-2"
          >
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {authMode === 'login' && (
            <motion.form
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onSubmit={handleSubmitLogin(onEmailLogin)}
              className="space-y-6"
            >
              {/* Username Field */}
              <div className="space-y-2">
                <div className="relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-lg opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                    <User size={20} />
                  </div>
                  <input 
                    {...registerLogin('username')}
                    type="text" 
                    placeholder="দয়া করে ব্যবহারকারী নাম দিন"
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg py-4 pl-12 pr-4 text-white text-sm focus:border-red-500/50 outline-none transition-all placeholder:text-white/40"
                  />
                </div>
                <p className="text-[10px] text-red-500 font-medium leading-tight">
                  দয়া করে 6 - 13 বর্ণমালা এবং সংখ্যাসহ বিশেষ চিহ্ন ছাড়া একটি অক্ষর লিখুন
                </p>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-lg opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                    <Lock size={20} />
                  </div>
                  <input 
                    {...registerLogin('password')}
                    type={showPassword ? "text" : "password"} 
                    placeholder="পাসওয়ার্ড প্রবেশ করুন"
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg py-4 pl-12 pr-12 text-white text-sm focus:border-red-500/50 outline-none transition-all placeholder:text-white/40"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="text-[10px] text-red-500 font-medium leading-tight">
                  দয়া করে 6 - 12 বর্ণমালা এবং সংখ্যাসহ বিশেষ চিহ্ন ছাড়া একটি অক্ষর লিখুন
                </p>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div 
                    onClick={() => setRememberPassword(!rememberPassword)}
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${rememberPassword ? 'bg-white border-white' : 'border-white/40'}`}
                  >
                    {rememberPassword && <CheckCircle2 size={14} className="text-black" />}
                  </div>
                  <span className="text-white text-sm font-medium">মনে রাখুন</span>
                </label>
                <button 
                  type="button"
                  onClick={() => setAuthMode('forgot-password')}
                  className="text-yellow-500 text-sm font-bold hover:underline"
                >
                  পাসওয়ার্ড ভুলে গেছেন?
                </button>
              </div>

              {/* Login Button */}
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#22c55e] py-4 rounded-full text-black font-black text-lg shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:bg-[#16a34a] transition-all active:scale-95 flex items-center justify-center"
              >
                {isLoading ? <Loader2 size={24} className="animate-spin" /> : 'লগইন'}
              </button>
            </motion.form>
          )}

          {authMode === 'register' && (
            <motion.form
              key="register"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onSubmit={handleSubmitSignup(onEmailRegister)}
              className="space-y-4"
            >
              {/* Username Field */}
              <div className="relative group">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-l-lg opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                  <User size={20} />
                </div>
                <input 
                  {...registerSignup('username')}
                  type="text" 
                  placeholder="দয়া করে ব্যবহারকারী নাম দিন"
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg py-4 pl-12 pr-4 text-white text-sm focus:border-green-500/50 outline-none transition-all placeholder:text-white/40"
                />
              </div>

              {/* Password Field */}
              <div className="relative group">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-l-lg opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                  <Lock size={20} />
                </div>
                <input 
                  {...registerSignup('password')}
                  type={showPassword ? "text" : "password"} 
                  placeholder="পাসওয়ার্ড"
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg py-4 pl-12 pr-12 text-white text-sm focus:border-green-500/50 outline-none transition-all placeholder:text-white/40"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Confirm Password Field */}
              <div className="relative group">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-l-lg opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                  <Lock size={20} />
                </div>
                <input 
                  {...registerSignup('confirmPassword')}
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="পাসওয়ার্ড নিশ্চিত করুন"
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg py-4 pl-12 pr-12 text-white text-sm focus:border-green-500/50 outline-none transition-all placeholder:text-white/40"
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Mobile Number Field */}
              <div className="space-y-1">
                <div className="relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-l-lg opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                    <Smartphone size={20} />
                  </div>
                  <input 
                    {...registerSignup('phoneNumber')}
                    type="tel" 
                    placeholder="মোবাইল নম্বর"
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg py-4 pl-12 pr-4 text-white text-sm focus:border-green-500/50 outline-none transition-all placeholder:text-white/40"
                  />
                </div>
                {signupErrors.phoneNumber && <p className="text-[10px] text-red-500 mt-1 ml-2 font-bold italic">! {signupErrors.phoneNumber.message}</p>}
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-[#22c55e] py-4 rounded-full text-black font-black text-lg shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:bg-[#16a34a] transition-all active:scale-95 flex items-center justify-center"
                >
                  {isLoading ? <Loader2 size={24} className="animate-spin" /> : 'নিবন্ধন'}
                </button>
                <button 
                  type="reset"
                  className="flex-1 bg-transparent border border-[#22c55e] py-4 rounded-full text-[#22c55e] font-black text-lg hover:bg-[#22c55e]/10 transition-all active:scale-95"
                >
                  রিসেট
                </button>
              </div>
            </motion.form>
          )}
          {authMode === 'forgot-password' && (
            <motion.form
              key="forgot-password"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleSubmitReset(onPasswordReset)}
              className="space-y-6"
            >
              <div className="text-left mb-4">
                <h3 className="text-white font-bold text-lg mb-2">পাসওয়ার্ড রিসেট করুন</h3>
                <p className="text-white/60 text-sm">আপনার ইমেইল এড্রেস দিন, আমরা আপনাকে একটি রিসেট লিঙ্ক পাঠাবো।</p>
              </div>

              <div className="space-y-1">
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                    <Mail size={20} />
                  </div>
                  <input 
                    {...registerReset('email')}
                    type="email" 
                    placeholder="ইমেইল এড্রেস"
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg py-4 pl-12 pr-4 text-white text-sm focus:border-green-500/50 outline-none transition-all placeholder:text-white/40"
                  />
                </div>
                {resetErrors.email && <p className="text-[10px] text-red-500 mt-1 ml-2 font-bold italic">! {resetErrors.email.message}</p>}
              </div>

              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="flex-1 bg-transparent border border-[#333] py-4 rounded-full text-white font-bold hover:bg-white/5 transition-all active:scale-95"
                >
                  ফিরে যান
                </button>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="flex-[2] bg-[#22c55e] py-4 rounded-full text-black font-black text-lg shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:bg-[#16a34a] transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 size={24} className="animate-spin" /> : 'লিঙ্ক পাঠান'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Social Login Section */}
        <div className="mt-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-[1px] bg-[#333]"></div>
            <span className="text-white text-sm font-medium">অথবা চালিয়ে যান</span>
            <div className="flex-1 h-[1px] bg-[#333]"></div>
          </div>

          <div className="space-y-4">
            <button 
              onClick={onFacebookLogin}
              disabled={isLoading}
              type="button"
              className="w-full bg-[#1877F2] py-4 rounded-full text-white font-bold flex items-center justify-center gap-3 hover:bg-[#166fe5] transition-all active:scale-95 disabled:opacity-50"
            >
              <Facebook size={24} fill="currentColor" />
              Facebook
            </button>
            <button 
              onClick={onGoogleLogin}
              disabled={isLoading}
              className="w-full bg-white py-4 rounded-full text-black font-bold flex items-center justify-center gap-3 hover:bg-gray-100 transition-all active:scale-95"
            >
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" alt="Google" className="w-6 h-6" />
              Google
            </button>
          </div>
        </div>

        {/* Toggle Auth Mode */}
        <div className="mt-12 text-center pb-8">
          <button 
            onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
            className="text-white/60 text-sm font-medium"
          >
            {authMode === 'login' ? (
              <>এখনও কোনও অ্যাকাউন্ট নেই? <span className="text-green-500 font-bold">সাইন আপ</span></>
            ) : (
              <>ইতিমধ্যে একটি অ্যাকাউন্ট আছে? <span className="text-green-500 font-bold">লগইন</span></>
            )}
          </button>
        </div>
      </div>

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
                  <p className="text-yellow-400 text-3xl font-black">৳ {welcomeBonus.toFixed(2)}</p>
                </div>

                <button 
                  onClick={() => {
                    if (!isLoggedIn) return;
                    setShowSuccessPopup(false);
                    onContinue();
                  }} 
                  disabled={!isLoggedIn}
                  className={`w-full font-black py-5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 group ${isLoggedIn ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white active:scale-95' : 'bg-gray-600 text-gray-300 cursor-not-allowed'}`}
                >
                  {isLoggedIn ? (
                    <>গেম শুরু করুন <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" /></>
                  ) : (
                    <>অ্যাকাউন্ট প্রস্তুত হচ্ছে... <Loader2 size={22} className="animate-spin" /></>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
