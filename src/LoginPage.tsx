import React, { useState } from 'react';
import { 
  signInAnonymously, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail
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
  AlertCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Validation Schemas
const loginSchema = z.object({
  username: z.string().min(3, 'নাম কমপক্ষে ৩ অক্ষরের হতে হবে (Min 3 chars)'),
  password: z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে (Min 6 chars)'),
});

const registerSchema = z.object({
  username: z.string().min(3, 'নাম কমপক্ষে ৩ অক্ষরের হতে হবে (Min 3 chars)'),
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

interface LoginPageProps {
  onRegisterSuccess: () => void;
  onContinue: () => void;
  onLoginSuccess: () => void;
  showToast: (msg: string, type?: ToastType) => void;
  casinoName?: string;
  isLoggedIn?: boolean;
  welcomeBonus?: number;
}

export default function LoginPage({ onRegisterSuccess, onContinue, onLoginSuccess, showToast, casinoName = "SPIN71BET", isLoggedIn = false, welcomeBonus = 507 }: LoginPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot-password'>('login');
  const [showPassword, setShowPassword] = useState(false);
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

  const { 
    register: registerReset, 
    handleSubmit: handleSubmitReset, 
    formState: { errors: resetErrors } 
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema)
  });

  const handleAuthError = (err: any) => {
    setIsLoading(false);
    
    // Ignore popup closed by user as it's a common cancellation
    if (err.code === 'auth/popup-closed-by-user') {
      return;
    }

    console.error("Auth Error:", err);
    
    let msg = "কিছু ভুল হয়েছে। আবার চেষ্টা করুন। (Something went wrong. Please try again.)";

    if (err.code === 'auth/admin-restricted-operation') {
      setError("ADMIN_RESTRICTED");
      return;
    }

    if (err.code === 'auth/email-already-in-use') {
      msg = "এই ইমেইলটি ইতিমধ্যে ব্যবহার করা হয়েছে। (Email already in use.)";
    } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
      msg = "পাসওয়ার্ড ভুল। অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন। (Invalid password. Please enter correct password.)";
    } else if (err.code === 'auth/user-not-found') {
      msg = "এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি। (User not found. Please register first.)";
    } else if (err.code === 'auth/invalid-email') {
      msg = "ইমেইলটি সঠিক নয়। (Invalid email format.)";
    } else if (err.code === 'auth/too-many-requests') {
      msg = "অনেকবার ভুল চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন। (Too many failed attempts. Try again later.)";
    } else if (err.code === 'auth/network-request-failed') {
      msg = "ইন্টারনেট সংযোগে সমস্যা হচ্ছে। (Network error. Please check your connection.)";
    } else if (err.code === 'auth/user-disabled') {
      msg = "এই অ্যাকাউন্টটি বন্ধ করে দেওয়া হয়েছে। (User account disabled.)";
    } else if (err.code === 'auth/operation-not-allowed') {
      msg = "এই লগইন পদ্ধতিটি বর্তমানে বন্ধ আছে। (Auth method not allowed)";
    } else if (err.code === 'auth/network-request-failed') {
      msg = "ইন্টারনেট সংযোগে সমস্যা। দয়া করে আপনার কানেকশন চেক করুন। (Network error. Check your connection.)";
    }
    
    setError(msg);
    showToast(msg, "error");
  };

  // Remove onOneClick function
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
      // Since we are using username, we need to map it to a dummy email for Firebase Auth
      const dummyEmail = `${data.username.toLowerCase().replace(/\s/g, '')}@spin71bet.com`;
      await signInWithEmailAndPassword(auth, dummyEmail, data.password);
      showToast("লগইন সফল হয়েছে", "success");
      onLoginSuccess();
      onRegisterSuccess();
    } catch (err) {
      handleAuthError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const onEmailRegister = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      // Create user with a dummy email based on username since email is removed from form
      const dummyEmail = `${data.username.toLowerCase().replace(/\s/g, '')}@${Date.now()}.com`;
      const userCredential = await createUserWithEmailAndPassword(auth, dummyEmail, data.password);
      
      // Update profile
      await updateProfile(userCredential.user, { displayName: data.username });
      
      // Immediately trigger success UI
      setIsLoading(false);
      setShowSuccessPopup(true);
      onLoginSuccess();
      onRegisterSuccess();
      showToast("অ্যাকাউন্ট তৈরি সফল হয়েছে", "success");
    } catch (err) {
      handleAuthError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordReset = async (data: ResetFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, data.email);
      showToast("পাসওয়ার্ড রিসেট ইমেইল পাঠানো হয়েছে। আপনার ইনবক্স চেক করুন। (Reset email sent. Check your inbox.)", "success");
      setAuthMode('login');
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-main)] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans safe-top safe-bottom">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[var(--bg-card)] rounded-full blur-[120px] opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[var(--bg-surface)] rounded-full blur-[120px] opacity-50"></div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center max-w-sm w-full bg-[var(--bg-card)] p-8 rounded-[32px] border border-[var(--border-color)] shadow-2xl"
      >
        {/* Logo Section */}
        <div className="mb-8">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-block p-4 bg-[var(--bg-surface)] rounded-full border border-[var(--border-color)]"
          >
            <Plane size={48} className="text-white" />
          </motion.div>
          <h1 className="text-3xl font-black text-[var(--text-main)] mt-4 italic tracking-tighter">
            {casinoName}
          </h1>
          <p className="text-[var(--text-muted)] font-bold uppercase tracking-widest text-[10px] mt-1">VIP Gaming Platform</p>
        </div>

        {/* Auth Mode Toggle */}
        <div className="flex bg-[var(--bg-surface)] p-1 rounded-2xl mb-8 border border-[var(--border-color)]">
          <button 
            onClick={() => setAuthMode('login')}
            className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${authMode === 'login' ? 'bg-[var(--bg-main)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}
          >
            লগইন
          </button>
          <button 
            onClick={() => setAuthMode('register')}
            className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${authMode === 'register' ? 'bg-[var(--bg-main)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}
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
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                  <input 
                    {...registerLogin('username')}
                    type="text" 
                    placeholder="আপনার নাম (Username)"
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl py-4 pl-12 pr-4 text-[var(--text-main)] text-sm focus:border-[var(--brand-primary)] outline-none transition-all"
                  />
                </div>
                {loginErrors.username && <p className="text-[10px] text-red-400 text-left pl-2">{loginErrors.username.message}</p>}
              </div>

              <div className="space-y-1">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                  <input 
                    {...registerLogin('password')}
                    type={showPassword ? "text" : "password"} 
                    placeholder="পাসওয়ার্ড"
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl py-4 pl-12 pr-12 text-[var(--text-main)] text-sm focus:border-[var(--brand-primary)] outline-none transition-all"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {loginErrors.password && <p className="text-[10px] text-red-400 text-left pl-2">{loginErrors.password.message}</p>}
                <div className="text-right pr-2">
                  <button 
                    type="button"
                    onClick={() => setAuthMode('forgot-password')}
                    className="text-[10px] text-[var(--text-muted)] hover:text-white font-bold"
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-[var(--brand-primary)] py-4 rounded-2xl text-white font-black uppercase tracking-tight flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95"
              >
                {isLoading ? <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div> : <><LogIn size={20} /> লগইন করুন</>}
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
              <div className="space-y-2">
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--brand-primary)] transition-colors" size={18} />
                  <input 
                    {...registerSignup('username')}
                    type="text" 
                    placeholder="আপনার নাম (Username)"
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl py-4 pl-12 pr-4 text-[var(--text-main)] text-sm focus:border-[var(--brand-primary)] outline-none transition-all duration-300"
                  />
                </div>
                {signupErrors.username && <p className="text-[10px] text-red-400 text-left pl-2">{signupErrors.username.message}</p>}
              </div>

              <div className="space-y-2">
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--brand-primary)] transition-colors" size={18} />
                  <input 
                    {...registerSignup('password', { onChange: (e) => checkPasswordStrength(e.target.value) })}
                    type={showPassword ? "text" : "password"} 
                    placeholder="পাসওয়ার্ড"
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl py-4 pl-12 pr-12 text-[var(--text-main)] text-sm focus:border-[var(--brand-primary)] outline-none transition-all duration-300"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {/* Strength Meter */}
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${i <= passwordStrength ? (passwordStrength > 2 ? 'bg-green-500' : 'bg-[var(--brand-primary)]') : 'bg-[var(--bg-surface)]'}`} />
                  ))}
                </div>
                {signupErrors.password && <p className="text-[10px] text-red-400 text-left pl-2">{signupErrors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--brand-primary)] transition-colors" size={18} />
                  <input 
                    {...registerSignup('confirmPassword')}
                    type={showPassword ? "text" : "password"} 
                    placeholder="পাসওয়ার্ড নিশ্চিত করুন"
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl py-4 pl-12 pr-12 text-[var(--text-main)] text-sm focus:border-[var(--brand-primary)] outline-none transition-all duration-300"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {signupErrors.confirmPassword && <p className="text-[10px] text-red-400 text-left pl-2">{signupErrors.confirmPassword.message}</p>}
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-[var(--brand-primary)] py-4 rounded-2xl text-white font-black uppercase tracking-tight flex items-center justify-center gap-2 hover:opacity-90 transition-all duration-300 active:scale-[0.98] mt-4"
              >
                {isLoading ? <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div> : <><UserPlus size={20} /> নিবন্ধন করুন</>}
              </button>
            </motion.form>
          )}
          {authMode === 'forgot-password' && (
            <motion.form
              key="forgot-password"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSubmitReset(onPasswordReset)}
              className="space-y-4"
            >
              <div className="text-left mb-4">
                <h3 className="text-white font-bold text-sm mb-1">পাসওয়ার্ড রিসেট করুন</h3>
                <p className="text-gray-500 text-[10px]">আপনার ইমেইল এড্রেস দিন, আমরা আপনাকে একটি রিসেট লিঙ্ক পাঠাবো।</p>
              </div>

              <div className="space-y-1">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input 
                    {...registerReset('email')}
                    type="email" 
                    placeholder="ইমেইল এড্রেস"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:border-yellow-500 outline-none transition-all"
                  />
                </div>
                {resetErrors.email && <p className="text-[10px] text-red-400 text-left pl-2">{resetErrors.email.message}</p>}
              </div>

              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="flex-1 bg-white/5 py-4 rounded-2xl text-white font-black uppercase tracking-tight hover:bg-white/10 transition-all active:scale-95"
                >
                  ফিরে যান
                </button>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="flex-[2] bg-yellow-500 py-4 rounded-2xl text-black font-black uppercase tracking-tight flex items-center justify-center gap-2 hover:bg-yellow-400 transition-all active:scale-95"
                >
                  {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'লিঙ্ক পাঠান'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Alternative Login Methods */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-4 my-4">
            <div className="flex-1 h-[1px] bg-white/10"></div>
            <span className="text-[10px] text-gray-500 font-bold uppercase">অথবা (Or)</span>
            <div className="flex-1 h-[1px] bg-white/10"></div>
          </div>

          <button 
            onClick={onGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white/5 border border-white/10 py-3.5 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-95"
          >
            <Chrome size={18} className="text-white" />
            <span className="text-white font-bold text-sm">গুগল দিয়ে চালিয়ে যান</span>
          </button>
        </div>

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
