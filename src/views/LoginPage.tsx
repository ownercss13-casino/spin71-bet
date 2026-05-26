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
  Send,
  Scan,
  Smartphone,
  ShieldCheck,
  ChevronLeft,
  Gift,
  Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Validation Schemas
const loginSchema = z.object({
  username: z.string()
    .min(3, 'ইউজারনেম অথবা ইমেইল দিন (Enter username or email)'),
  password: z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে (Min 6 chars)'),
});

const registerSchema = z.object({
  username: z.string()
    .min(4, 'দয়া করে ব্যবহারকারী নাম দিন')
    .max(20, 'ইউজারনেম ২০ অক্ষরের বেশি হতে পারবে না (Max 20 chars)')
    .regex(/^[a-zA-Z0-9_]+$/, 'বিশেষ চিহ্ন বা স্পেস ছাড়া অক্ষর দিন'),
  password: z.string()
    .min(6, 'পাসওয়ার্ড প্রবেশ করুন'),
  confirmPassword: z.string(),
  mobile: z.string()
    .min(11, 'মোবাইল নম্বর দিন')
    .regex(/^[0-9]+$/, 'Please enter a valid number'),
  promoCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "পাসওয়ার্ড মিলছে না",
  path: ["confirmPassword"],
});

const resetSchema = z.object({
  email: z.string().email('সঠিক ইমেইল দিন (Invalid email)'),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;
type ResetFormValues = z.infer<typeof resetSchema>;

import { ToastType } from '../components/ui/Toast';
import { auth, db } from '../services/firebase';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';

import { doc, setDoc, getDoc, updateDoc, increment, collection, query, where, getDocs, limit, writeBatch } from 'firebase/firestore';
import { defaultAvatarBase64 } from '../assets/default-avatar';

interface LoginPageProps {
  onRegisterSuccess: () => void;
  onContinue: () => void;
  onLoginSuccess: (user: any) => void;
  showToast: (msg: string, type?: ToastType) => void;
  casinoName?: string;
  isLoggedIn?: boolean;
  welcomeBonus?: number;
  initialMode?: 'login' | 'register';
}

export default function LoginPage({ onRegisterSuccess, onContinue, onLoginSuccess, showToast, casinoName = "SPIN71.bet", isLoggedIn = false, welcomeBonus = 507, initialMode = 'login' }: LoginPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'forgot-password' | 'register'>(initialMode);
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

  const { 
    register: registerRegister, 
    handleSubmit: handleSubmitRegister, 
    formState: { errors: registerErrors },
    watch: watchRegister,
    setValue: setValueRegister
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      promoCode: localStorage.getItem('referralCode') || ''
    }
  });

  const passwordWatch = watchRegister('password');
  useEffect(() => {
    if (passwordWatch) checkPasswordStrength(passwordWatch);
  }, [passwordWatch]);

  useEffect(() => {
    if (rememberPassword) {
      const savedUsername = localStorage.getItem('saved_username');
      if (savedUsername && authMode === 'login') {
        setValueLogin('username', savedUsername);
      }
    }
  }, [rememberPassword, authMode, setValueLogin]);


  const { 
    register: registerReset, 
    handleSubmit: handleSubmitReset, 
    formState: { errors: resetErrors } 
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema)
  });

  const generateReferralCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

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
    
    // Firebase Auth Error Codes
    if (err.code === 'auth/wrong-password') msg = "ভুল পাসওয়ার্ড! (Wrong password)";
    if (err.code === 'auth/user-not-found') msg = "অ্যাকাউন্ট পাওয়া যায়নি! (No account found)";
    if (err.code === 'auth/invalid-credential') msg = "ভুল তথ্য (Invalid credentials)";
    if (err.code === 'auth/email-already-in-use') msg = "এই ইউজারনেমটি ইতিমধ্যে ব্যবহার করা হয়েছে! (Username already in use)";
    if (err.code === 'auth/invalid-email') msg = "সঠিক ফরম্যাট দিন! (Invalid format)";
    if (err.code === 'auth/weak-password') msg = "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে (Weak password)";
    if (err.code === 'auth/too-many-requests') msg = "অতিরিক্ত রিকোয়েস্ট! কিছুক্ষণ পর চেষ্টা করুন। (Too many requests)";
    if (err.code === 'auth/operation-not-allowed') msg = "ইমেইল/পাসওয়ার্ড পদ্ধতিটি ফায়ারবেস কনসোলে বন্ধ করা আছে!";
    if (err.message && err.message.includes('missing or insufficient permissions')) msg = "ডেটাবেস পারমিশন সমস্যা! (Permission Denied)";
    
    // Custom error messages from thrown errors
    if (err.message && err.message.length < 100) {
      if (err.message.includes('Username already taken')) msg = "এই ইউজারনেমটি ইতিমধ্যে ব্যবহার করা হয়েছে";
      if (err.message.includes('Phone already registered')) msg = "এই ফোন নম্বরটি ইতিমধ্যে ব্যবহার করা হয়েছে";
      if (err.message.includes('not found')) msg = err.message;
    }

    setError(msg);
    showToast(msg, "error");
  };


  const onGoogleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        const inviterCode = localStorage.getItem('referralCode');
        let inviterUid = null;
        
        if (inviterCode) {
           const usersRef = collection(db, 'users');
           const q = query(usersRef, where('referralCode', '==', inviterCode), limit(1));
           const snap = await getDocs(q);
           if (!snap.empty) {
             inviterUid = snap.docs[0].id;
           }
        }

        const cleanDisplayName = (user.displayName || 'Google User').replace(/[^a-zA-Z0-9]/g, '').substring(0, 13) || `g${user.uid.substring(0,5)}`;
        const isAdmin = user.email === 'owner.css13@gmail.com';
        
        const batch = writeBatch(db);

        const newUser = {
          username: cleanDisplayName,
          email: user.email || "",
          balance: inviterUid ? 50 : 500, // New user gets 500 by default or 50 if referred? Wait, App.tsx says 500.
          role: isAdmin ? 'admin' : 'user',
          isAdmin: isAdmin,
          totalDeposits: 0,
          totalWithdrawals: 0,
          bonusesClaimed: [],
          createdAt: new Date().toISOString(),
          profilePictureUrl: defaultAvatarBase64,
          referredBy: inviterUid,
          referralCode: generateReferralCode(),
          referralCount: 0,
          validReferralCount: 0,
          totalReferralEarnings: 0
        };
        
        batch.set(userDocRef, newUser);
        
        if (isAdmin) {
          batch.set(doc(db, 'admins', user.uid), {
            email: user.email,
            addedAt: new Date().toISOString()
          });
        }
        
        if (inviterUid) {
          const inviterRef = doc(db, 'users', inviterUid);
          batch.update(inviterRef, {
            referralCount: increment(1),
            validReferralCount: increment(1),
            balance: increment(50),
            totalReferralEarnings: increment(50)
          });

          // Log transaction for inviter
          const inviterTrxRef = doc(collection(db, 'transactions'));
          batch.set(inviterTrxRef, {
            type: 'bonus',
            status: 'approved',
            userId: inviterUid,
            amount: 50,
            description: `Referral Bonus (Google: ${cleanDisplayName})`,
            date: new Date().toISOString(),
            createdAt: new Date().toISOString()
          });

          // Transaction for new user
          const newUserTrxRef = doc(collection(db, 'transactions'));
          batch.set(newUserTrxRef, {
            type: 'bonus',
            status: 'approved',
            userId: user.uid,
            amount: 50,
            description: 'Referral Signup Bonus',
            date: new Date().toISOString(),
            createdAt: new Date().toISOString()
          });
        }
        
        await batch.commit();
        localStorage.removeItem('referralCode');
      }
      
      showToast("গুগল লগইন সফল হয়েছে", "success");
      onLoginSuccess({ id: user.uid, username: user.displayName, ...(userDoc.exists() ? userDoc.data() : { balance: 500 }) });
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
      let loginEmail = "";
      
      // 1. Check if input is a real email
      if (data.username.includes('@')) {
        loginEmail = data.username;
      } 
      // 2. Otherwise assume it's a username and use the dummy domain pattern
      else {
        loginEmail = `${data.username.toLowerCase()}@spin71bet.com`;
      }

      const result = await signInWithEmailAndPassword(auth, loginEmail, data.password);
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
      
      // Notify Telegram
      const escapeHTML = (str: string) => str.replace(/[&<>"']/g, m => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'}[m] || m));
      try {
        await fetch('/api/telegram/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'Login',
            userId: user.uid,
            username: userData.username,
            balance: userData.balance
          })
        });
      } catch (err) {
        console.error("Telegram notification error", err);
      }

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
      // 1. Create email from username
      const registerEmail = `${data.username.toLowerCase()}@spin71bet.com`;
      
      const result = await createUserWithEmailAndPassword(auth, registerEmail, data.password);
      const user = result.user;
      
      // 2. Set Firebase Auth display name
      await updateProfile(user, { displayName: data.username });

      const inviterCode = data.promoCode || localStorage.getItem('referralCode');
      let inviterUid = null;
      if (inviterCode) {
         try {
           const usersRef = collection(db, 'users');
           const q = query(usersRef, where('referralCode', '==', inviterCode), limit(1));
           const snap = await getDocs(q);
           if (!snap.empty) {
             inviterUid = snap.docs[0].id;
             console.log("Found inviter:", inviterUid);
           }
         } catch (e) {
           console.error("Referral lookup failed:", e);
         }
      }

      const batch = writeBatch(db);
      const userDocRef = doc(db, 'users', user.uid);

      // 3. Create user document in Firestore
      const newUser = {
        username: data.username,
        email: registerEmail,
        mobile: data.mobile,
        balance: inviterUid ? 50 : 0, 
        role: 'user',
        totalDeposits: 0,
        totalWithdrawals: 0,
        bonusesClaimed: [], // Track claimed bonuses
        createdAt: new Date().toISOString(),
        profilePictureUrl: defaultAvatarBase64,
        referralCode: generateReferralCode(),
        referralCount: 0,
        validReferralCount: 0,
        totalReferralEarnings: 0,
        referredBy: inviterUid
      };
      
      batch.set(userDocRef, newUser);
      
      // Handle referral bonus if inviter exists
      if (inviterUid) {
        const inviterRef = doc(db, 'users', inviterUid);
        batch.update(inviterRef, {
          referralCount: increment(1),
          // We give a small signup bonus to both if referred
          balance: increment(50),
          totalReferralEarnings: increment(50)
        });

        // Log transaction for inviter
        const inviterTrxRef = doc(collection(db, 'transactions'));
        batch.set(inviterTrxRef, {
          type: 'bonus',
          status: 'approved',
          userId: inviterUid,
          amount: 50,
          description: `Referral Signup Bonus (${data.username})`,
          date: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });

        // Give signup bonus to the new user too
        const newUserTrxRef = doc(collection(db, 'transactions'));
        batch.set(newUserTrxRef, {
          type: 'bonus',
          status: 'approved',
          userId: user.uid,
          amount: 50,
          description: 'Referral Signup Bonus',
          date: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });
      }

      await batch.commit();
      localStorage.removeItem('referralCode');

      // Notify Telegram
      try {
        await fetch('/api/telegram/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'Registration',
            userId: user.uid,
            username: data.username,
            balance: inviterUid ? 50 : 0,
            details: `Mobile: ${data.mobile}${inviterUid ? ' | Referred by: ' + inviterUid : ''}`
          })
        });
      } catch (e) {
        console.error("Telegram notify failed", e);
      }
      
      showToast("নিবন্ধন সফল হয়েছে!", "success");
      setShowSuccessPopup(true);
      onLoginSuccess({ id: user.uid, ...newUser, balance: inviterUid ? 50 : 0 });

      // Notify Telegram
      const escapeHTML = (str: string) => str.replace(/[&<>"']/g, m => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'}[m] || m));
      await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `🆕 <b>New User Registered!</b>\n\n👤 <b>Username:</b> ${escapeHTML(data.username)}\n🔢 <b>UID:</b> <code>${user.uid}</code>${inviterUid ? '\n🤝 <b>Referred By:</b> <code>' + inviterUid + '</code>' : ''}`
        })
      });
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
    <div className="fixed inset-0 z-[1000] bg-[#1a1a1a] flex flex-col font-sans text-white overflow-y-auto overflow-x-hidden pb-4">
      
      {/* Top Banner Image with Close Button */}
      <div className="relative w-full bg-black flex justify-center shrink-0">
        <img 
          src="https://www.image2url.com/r2/default/images/png-to-jpg-1779212444352-08afde36-0420-4349-9fd1-6fed72d4bab6.jpg" 
          alt="Banner" 
          className="w-full h-auto max-h-72 object-contain"
        />
        <button 
          onClick={() => onContinue && onContinue()}
          className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors z-10 bg-black/40 rounded-full"
        >
          <X size={24} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-5 w-full max-w-[500px] mx-auto pb-6">
        
        {/* Title */}
        <h2 className="text-2xl font-bold text-center mt-6 mb-8 text-white tracking-wide">
          {authMode === 'login' ? 'লগইন' : authMode === 'register' ? 'নিবন্ধন' : 'পাসওয়ার্ড পুনরুদ্ধার'}
        </h2>

        <AnimatePresence mode="wait">
          {authMode === 'login' && (
            <motion.div
              key="login-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <form onSubmit={handleSubmitLogin(onEmailLogin)} className="space-y-4">
                
                {/* User Input */}
                <div>
                  <div className="flex bg-[#2a2b2d] rounded-lg overflow-hidden h-14">
                    <div className="w-1.5 bg-green-500 shrink-0"></div>
                    <div className="pl-4 pr-3 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                    <input 
                      {...registerLogin('username')}
                      type="text" 
                      placeholder="দয়া করে ব্যবহারকারী নাম দিন"
                      className="w-full bg-transparent text-white text-base focus:outline-none py-3 pr-4 placeholder:text-gray-200"
                    />
                  </div>
                  {loginErrors.username && <p className="text-red-500 text-xs mt-1 ml-4">{loginErrors.username.message}</p>}
                </div>
                
                {/* Password Input */}
                <div>
                  <div className="flex bg-[#2a2b2d] rounded-lg overflow-hidden h-14">
                    <div className="w-1.5 bg-green-500 shrink-0"></div>
                    <div className="pl-4 pr-3 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input 
                      {...registerLogin('password')}
                      type={showPassword ? "text" : "password"} 
                      placeholder="পাসওয়ার্ড প্রবেশ করুন"
                      className="w-full bg-transparent text-white text-base focus:outline-none py-3 pr-4 placeholder:text-gray-200"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="px-4 text-gray-400 flex items-center justify-center focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {loginErrors.password && <p className="text-red-500 text-xs mt-1 ml-4">{loginErrors.password.message}</p>}
                </div>

                {/* Options Row */}
                <div className="flex items-center justify-between text-sm mt-1 mb-6 px-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={rememberPassword}
                      onChange={(e) => setRememberPassword(e.target.checked)}
                      className="w-4 h-4 rounded text-white accent-green-500 bg-[#2a2b2d]"
                    />
                    <span className="text-white font-medium">মনে রাখুন</span>
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setAuthMode('forgot-password')}
                    className="text-yellow-500 hover:underline font-medium"
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </button>
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#4ade80] text-black py-3.5 rounded-full font-bold text-xl hover:bg-[#22c55e] transition-colors flex items-center justify-center mt-6"
                >
                  {isLoading ? <Loader2 size={24} className="animate-spin" /> : 'লগইন'}
                </button>
              </form>
            </motion.div>
          )}

          {authMode === 'register' && (
            <motion.div
              key="register-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <form onSubmit={handleSubmitRegister(onEmailRegister)} className="space-y-4">
                
                {/* User Input */}
                <div>
                  <div className="flex bg-[#2a2b2d] rounded-lg overflow-hidden h-14">
                    <div className="w-1.5 bg-green-500 shrink-0"></div>
                    <div className="pl-4 pr-3 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                    <input 
                      {...registerRegister('username')}
                      type="text" 
                      placeholder="দয়া করে ব্যবহারকারী নাম দিন"
                      className="w-full bg-transparent text-white text-base focus:outline-none py-3 pr-4 placeholder:text-gray-200"
                    />
                  </div>
                  {registerErrors.username && <p className="text-red-500 text-xs mt-1 ml-4">{registerErrors.username.message}</p>}
                </div>
                
                {/* Password Input */}
                <div>
                  <div className="flex bg-[#2a2b2d] rounded-lg overflow-hidden h-14">
                    <div className="w-1.5 bg-green-500 shrink-0"></div>
                    <div className="pl-4 pr-3 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input 
                      {...registerRegister('password')}
                      type={showPassword ? "text" : "password"} 
                      placeholder="পাসওয়ার্ড"
                      className="w-full bg-transparent text-white text-base focus:outline-none py-3 pr-4 placeholder:text-gray-200"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="px-4 text-gray-400 flex items-center justify-center focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {registerErrors.password && <p className="text-red-500 text-xs mt-1 ml-4">{registerErrors.password.message}</p>}
                </div>
                
                {/* Confirm Password Input */}
                <div>
                  <div className="flex bg-[#2a2b2d] rounded-lg overflow-hidden h-14">
                    <div className="w-1.5 bg-green-500 shrink-0"></div>
                    <div className="pl-4 pr-3 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input 
                      {...registerRegister('confirmPassword')}
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="পাসওয়ার্ড নিশ্চিত করুন"
                      className="w-full bg-transparent text-white text-base focus:outline-none py-3 pr-4 placeholder:text-gray-200"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="px-4 text-gray-400 flex items-center justify-center focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {registerErrors.confirmPassword && <p className="text-red-500 text-xs mt-1 ml-4">{registerErrors.confirmPassword.message}</p>}
                </div>
                
                {/* Mobile Input */}
                <div>
                  <div className="flex bg-[#2a2b2d] rounded-lg overflow-hidden h-14">
                    <div className="w-1.5 bg-green-500 shrink-0"></div>
                    <div className="pl-4 pr-3 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-gray-400" />
                    </div>
                    <input 
                      {...registerRegister('mobile')}
                      type="text" 
                      placeholder="মোবাইল নম্বর"
                      className="w-full bg-transparent text-white text-base focus:outline-none py-3 pr-4 placeholder:text-gray-200"
                    />
                  </div>
                  {registerErrors.mobile && <p className="text-red-500 text-xs mt-1 ml-4">{registerErrors.mobile.message}</p>}
                </div>

                {/* Promo Code Input */}
                <div>
                  <div className="flex bg-[#2a2b2d] rounded-lg overflow-hidden h-14">
                    <div className="w-1.5 bg-yellow-500 shrink-0"></div>
                    <div className="pl-4 pr-3 flex items-center justify-center">
                      <Gift className="w-5 h-5 text-gray-400" />
                    </div>
                    <input 
                      {...registerRegister('promoCode')}
                      type="text" 
                      placeholder="আমন্ত্রণ কোড (Invite / Promo Code) - ঐচ্ছিক"
                      className="w-full bg-transparent text-white text-base focus:outline-none py-3 pr-4 placeholder:text-gray-200 uppercase"
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-[#4ade80] text-[#111] py-3.5 rounded-full font-bold text-xl hover:bg-[#22c55e] transition-colors flex items-center justify-center shadow-lg"
                  >
                    {isLoading ? <Loader2 size={24} className="animate-spin" /> : 'নিবন্ধন'}
                  </button>
                  
                  <button 
                    type="reset"
                    disabled={isLoading}
                    className="flex-1 bg-transparent border border-green-500 text-[#4ade80] py-3.5 rounded-full font-bold text-xl hover:bg-green-500/10 transition-colors flex items-center justify-center"
                  >
                    রিসেট
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {authMode === 'forgot-password' && (
            <motion.div
              key="forgot-password"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <form onSubmit={handleSubmitReset(onPasswordReset)} className="space-y-4">
                <div>
                  <div className="flex bg-[#2a2b2d] rounded-lg overflow-hidden h-14">
                    <div className="w-1.5 bg-green-500 shrink-0"></div>
                    <div className="pl-4 pr-3 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-gray-400" />
                    </div>
                    <input 
                      {...registerReset('email')}
                      type="email" 
                      placeholder="আপনার ইমেইল এড্রেস"
                      className="w-full bg-transparent text-white text-base focus:outline-none py-3 pr-4 placeholder:text-gray-200"
                    />
                  </div>
                  {resetErrors.email && <p className="text-red-500 text-xs mt-1 ml-4">{resetErrors.email.message}</p>}
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#4ade80] text-black py-3.5 rounded-full font-bold text-xl hover:bg-[#22c55e] transition-colors flex items-center justify-center mt-6 shadow-lg"
                >
                  {isLoading ? <Loader2 size={24} className="animate-spin" /> : 'লিঙ্ক পাঠান'}
                </button>
                
                <div className="text-center mt-4">
                  <button 
                    type="button" 
                    onClick={() => setAuthMode('login')}
                    className="text-white font-bold hover:underline"
                  >
                    ফিরে যান
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Separator */}
        <div className="flex items-center gap-3 mt-10 mb-6">
          <div className="flex-1 h-[1px] bg-white/10"></div>
          <span className="text-white text-sm font-medium">অথবা চালিয়ে যান</span>
          <div className="flex-1 h-[1px] bg-white/10"></div>
        </div>

        {/* Social Buttons */}
        <div className="flex gap-4 mb-10 text-lg font-medium justify-center">
            <button 
               onClick={onGoogleLogin} 
               className="flex-1 flex items-center justify-center gap-2 bg-[#ea4335] hover:bg-[#ea4335]/90 text-white py-2.5 rounded-full transition-colors shadow-none border border-transparent"
            >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.662 3.999-5.445 3.999-3.359 0-6.082-2.723-6.082-6.082s2.723-6.082 6.082-6.082c1.48 0 2.827.531 3.896 1.483l2.846-2.846C17.585 2.827 15.26 1.8 12.545 1.8 6.945 1.8 2.455 6.29 2.455 11.89s4.49 10.09 10.09 10.09c5.166 0 8.783-3.616 8.783-8.783 0-.745-.084-1.455-.245-2.127h-8.538z"/></svg>
                Google
            </button>
        </div>

        {/* Footer Toggle */}
        <div className="text-center text-gray-200 text-sm font-medium pb-2">
          {authMode === 'login' ? (
            <p>এখনও কোনও একাউন্ট নেই? <button type="button" onClick={() => setAuthMode('register')} className="text-[#4ade80] hover:underline cursor-pointer ml-1 font-bold">সাইন আপ</button></p>
          ) : (
            <p>ইতিমধ্যে একটি অ্যাকাউন্ট আছে? <button type="button" onClick={() => setAuthMode('login')} className="text-[#4ade80] hover:underline cursor-pointer ml-1 font-bold">লগইন</button></p>
          )}
        </div>

      </div>

      <AnimatePresence>
        {showSuccessPopup && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              className="relative bg-[#2a2b2d] border-l-4 border-l-green-500 rounded-xl p-8 max-w-sm w-full text-center shadow-2xl overflow-hidden"
            >
              <div className="relative z-10">
                <div className="w-16 h-16 bg-[#4ade80]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={32} className="text-[#4ade80]" />
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-2">অভিনন্দন!</h2>
                <p className="text-gray-300 font-medium text-base mb-6">আপনার নিবন্ধন সফল হয়েছে</p>

                
                <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-[#4ade80] text-sm font-bold">প্রথম ডিপোজিটে ১১৯% বোনাস এবং ৩x টানউবার</p>
                </div>

                <button 
                  onClick={() => {
                    setShowSuccessPopup(false);
                    onContinue();
                  }} 
                  className="w-full font-bold py-3.5 rounded-full transition-all flex items-center justify-center gap-2 bg-[#4ade80] text-[#111] hover:bg-[#22c55e] active:scale-95"
                >
                  গেম শুরু করুন <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
