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
  username: z.string()
    .min(3, 'ইউজারনেম অথবা ইমেইল দিন (Enter username or email)'),
  password: z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে (Min 6 chars)'),
});

const registerSchema = z.object({
  username: z.string()
    .min(6, 'ইউজারনেম কমপক্ষে ৬ অক্ষরের হতে হবে (Min 6 chars)')
    .max(13, 'ইউজারনেম ১৩ অক্ষরের বেশি হতে পারবে না (Max 13 chars)')
    .regex(/^[a-zA-Z0-9]+$/, 'বিশেষ চিহ্ন বা স্পেস ছাড়া অক্ষর দিন (Only letters and numbers)'),
  email: z.string().email('সঠিক ইমেইল দিন (Invalid email)'),
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

import { ToastType } from '../components/ui/Toast';
import { auth, db } from '../services/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  FacebookAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, increment, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { defaultAvatarBase64 } from '../assets/default-avatar';

interface LoginPageProps {
  onRegisterSuccess: () => void;
  onContinue: () => void;
  onLoginSuccess: (user: any) => void;
  showToast: (msg: string, type?: ToastType) => void;
  casinoName?: string;
  isLoggedIn?: boolean;
  welcomeBonus?: number;
}

export default function LoginPage({ onRegisterSuccess, onContinue, onLoginSuccess, showToast, casinoName = "SPIN71.bet", isLoggedIn = false, welcomeBonus = 507 }: LoginPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot-password'>(() => {
    return localStorage.getItem('referralCode') ? 'register' : 'login';
  });
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
    if (err.code === 'auth/email-already-in-use') msg = "এই ইমেইলটি ইতিমধ্যে ব্যবহার করা হয়েছে! (Email already in use)";
    if (err.code === 'auth/invalid-email') msg = "সঠিক ইমেইল এড্রেস দিন! (Invalid email address)";
    if (err.code === 'auth/weak-password') msg = "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে (Weak password)";
    if (err.code === 'auth/too-many-requests') msg = "অতিরিক্ত রিকোয়েস্ট! কিছুক্ষণ পর চেষ্টা করুন। (Too many requests)";
    
    // Custom error messages from thrown errors
    if (err.message && err.message.length < 100) {
      if (err.message.includes('Username already taken')) msg = "এই ইউজারনেমটি ইতিমধ্যে ব্যবহার করা হয়েছে";
      if (err.message.includes('Phone already registered')) msg = "এই ফোন নম্বরটি ইতিমধ্যে ব্যবহার করা হয়েছে";
      if (err.message.includes('not found')) msg = err.message;
    }

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
        const inviterCode = localStorage.getItem('referralCode');
        
        // Find inviter by referral code if skip direct UID
        let inviterUid = null;
        if (inviterCode) {
           // Search users for this code
           const usersRef = collection(db, 'users');
           const q = query(usersRef, where('referralCode', '==', inviterCode), limit(1));
           const snap = await getDocs(q);
           if (!snap.empty) {
             inviterUid = snap.docs[0].id;
           }
        }

        const cleanDisplayName = (user.displayName || 'FB User').replace(/[^a-zA-Z0-9]/g, '').substring(0, 13) || `fb${user.uid.substring(0,5)}`;

        const newUser = {
          username: cleanDisplayName,
          email: user.email || "",
          balance: 507,
          role: 'user',
          createdAt: new Date().toISOString(),
          profilePictureUrl: defaultAvatarBase64,
          referredBy: inviterUid,
          referralCode: generateReferralCode(),
          referralCount: 0,
          validReferralCount: 0,
          totalReferralEarnings: 0
        };
        await setDoc(doc(db, 'users', user.uid), newUser);
        
        // Notify Telegram
        try {
          await fetch('/api/telegram/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: `🎉 <b>New FB User Registered!</b>\n\n👤 <b>Username:</b> ${newUser.username}\n🔢 <b>UID:</b> <code>${user.uid}</code>\n🤝 <b>Referred By:</b> <code>${inviterUid || 'None'}</code>`
            })
          });
        } catch (err) {
          console.error("Telegram notification error", err);
        }
        
        if (inviterUid) {
          try {
            const inviterRef = doc(db, 'users', inviterUid);
            await updateDoc(inviterRef, {
              referralCount: increment(1),
              validReferralCount: increment(1),
              balance: increment(50),
              totalReferralEarnings: increment(50)
            });
            await setDoc(doc(collection(db, 'transactions')), {
              type: 'bonus',
              status: 'approved',
              uid: inviterUid,
              amount: 50,
              description: 'Referral Bonus (FB Signup)',
              date: new Date().toISOString(),
              createdAt: new Date().toISOString()
            });
          } catch (e) {
            console.error("Inviter update failed:", e);
          }
          localStorage.removeItem('referralCode');
        }
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
        const inviterCode = localStorage.getItem('referralCode');
        
        // Find inviter by referral code
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

        const newUser = {
          username: cleanDisplayName,
          email: user.email || "",
          balance: 507,
          role: 'user',
          createdAt: new Date().toISOString(),
          profilePictureUrl: defaultAvatarBase64,
          referredBy: inviterUid,
          referralCode: generateReferralCode(),
          referralCount: 0,
          validReferralCount: 0,
          totalReferralEarnings: 0
        };
        await setDoc(doc(db, 'users', user.uid), newUser);
        
        // Notify Telegram
        try {
          await fetch('/api/telegram/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: `🎉 <b>New Google User Registered!</b>\n\n👤 <b>Username:</b> ${newUser.username}\n🔢 <b>UID:</b> <code>${user.uid}</code>\n🤝 <b>Referred By:</b> <code>${inviterUid || 'None'}</code>`
            })
          });
        } catch (err) {
          console.error("Telegram notification error", err);
        }

        if (inviterUid) {
          try {
            const inviterRef = doc(db, 'users', inviterUid);
            await updateDoc(inviterRef, {
              referralCount: increment(1),
              validReferralCount: increment(1),
              balance: increment(50),
              totalReferralEarnings: increment(50)
            });
            await setDoc(doc(collection(db, 'transactions')), {
              type: 'bonus',
              status: 'approved',
              uid: inviterUid,
              amount: 50,
              description: 'Referral Bonus (Google Signup)',
              date: new Date().toISOString(),
              createdAt: new Date().toISOString()
            });
          } catch (e) {
            console.error("Inviter update failed:", e);
          }
          localStorage.removeItem('referralCode');
        }
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
      let loginEmail = "";
      
      // 1. Check if input is a real email
      if (data.username.includes('@')) {
        loginEmail = data.username;
      } 
      // 2. Check if input is a phone number (11 digits)
      else if (/^\d{11}$/.test(data.username)) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('phoneNumber', '==', data.username), limit(1));
        const snap = await getDocs(q);
        
        if (snap.empty) {
          throw new Error("এই ফোন নম্বর দিয়ে কোনো অ্যাকাউন্ট নেই (Phone number not found)");
        }
        loginEmail = snap.docs[0].data().email;
      } 
      // 3. Assume it's a username
      else {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', data.username), limit(1));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          loginEmail = snap.docs[0].data().email;
        } else {
          // Fallback to legacy convention if not found in Firestore
          loginEmail = `${data.username.toLowerCase()}@spin71bet.com`;
        }
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
      try {
        await fetch('/api/telegram/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `🔑 <b>User Logged In!</b>\n\n👤 <b>Username:</b> ${userData.username || 'Unknown'}\n🔢 <b>UID:</b> <code>${user.uid}</code>`
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
      // Check for existing username
      const usersRef = collection(db, 'users');
      const qUsername = query(usersRef, where('username', '==', data.username), limit(1));
      const snapUsername = await getDocs(qUsername);
      
      if (!snapUsername.empty) {
        throw new Error("এই ইউজারনেমটি ইতিমধ্যে ব্যবহার করা হয়েছে (Username already taken)");
      }

      // Check for existing phone
      const qPhone = query(usersRef, where('phoneNumber', '==', data.phoneNumber), limit(1));
      const snapPhone = await getDocs(qPhone);
      
      if (!snapPhone.empty) {
        throw new Error("এই ফোন নম্বরটি ইতিমধ্যে ব্যবহার করা হয়েছে (Phone already registered)");
      }

      const email = data.email;
      const result = await createUserWithEmailAndPassword(auth, email, data.password);
      const user = result.user;
      
      await updateProfile(user, { displayName: data.username });

      const inviterCode = localStorage.getItem('referralCode');
      
      // Find inviter by referral code
      let inviterUid = null;
      if (inviterCode) {
         console.log("Locating inviter by referral code:", inviterCode);
         const usersRef = collection(db, 'users');
         const q = query(usersRef, where('referralCode', '==', inviterCode), limit(1));
         const snap = await getDocs(q);
         if (!snap.empty) {
           inviterUid = snap.docs[0].id;
           console.log("Inviter found:", inviterUid);
         } else {
           console.log("No inviter found for code.");
         }
      }

      const userData = {
        username: data.username,
        email: data.email,
        phoneNumber: data.phoneNumber,
        balance: 507,
        role: 'user',
        createdAt: new Date().toISOString(),
        profilePictureUrl: defaultAvatarBase64,
        referredBy: inviterUid,
        referralCode: generateReferralCode(),
        referralCount: 0,
        validReferralCount: 0,
        totalReferralEarnings: 0
      };

      await setDoc(doc(db, 'users', user.uid), userData);
      
      // Notify Telegram
      try {
        await fetch('/api/telegram/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `🎉 <b>New User Registered!</b>\n\n👤 <b>Username:</b> ${data.username}\n📞 <b>Phone:</b> ${data.phoneNumber}\n🔢 <b>UID:</b> <code>${user.uid}</code>\n🤝 <b>Referred By:</b> <code>${inviterUid || 'None'}</code>`
          })
        });
      } catch (err) {
        console.error("Telegram notification error", err);
      }

      if (inviterUid) {
        try {
          const inviterRef = doc(db, 'users', inviterUid);
          await updateDoc(inviterRef, {
            referralCount: increment(1),
            validReferralCount: increment(1),
            balance: increment(50),
            totalReferralEarnings: increment(50)
          });
          await setDoc(doc(collection(db, 'transactions')), {
            type: 'bonus',
            status: 'approved',
            uid: inviterUid,
            amount: 50,
            description: 'Referral Bonus (Email Signup)',
            date: new Date().toISOString(),
            createdAt: new Date().toISOString()
          });
        } catch (e) {
          console.error("Inviter update failed:", e);
        }
        localStorage.removeItem('referralCode');
      }
      
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
      <div className="w-full relative h-[250px] sm:h-[280px]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#115e3c] to-black">
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent"></div>
        <button 
          onClick={onContinue}
          className="absolute top-6 right-6 z-20 w-10 h-10 bg-black/40 border border-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-black/80 transition-all backdrop-blur-md"
        >
          <X size={20} />
        </button>
        
        {/* Center Logo/Title in Banner */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pt-4">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] italic tracking-tighter mb-2">
            {casinoName}
          </h1>
          <div className="flex gap-1 items-center px-4 py-1.5 bg-green-900/50 border border-yellow-500/30 rounded-full backdrop-blur-sm">
            <Gift size={14} className="text-yellow-400" />
            <span className="text-yellow-400 font-bold text-xs">স্বাগতম বোনাস ৳{welcomeBonus}</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md px-6 -mt-12 relative z-20 pb-12">
        {/* Auth Mode Toggle */}
        <div className="flex bg-[#0f172a]/80 backdrop-blur-xl p-1.5 rounded-2xl border border-white/5 mb-8 shadow-2xl relative">
          <button 
            onClick={() => setAuthMode('login')}
            className={`flex-1 py-3.5 rounded-xl text-sm font-black transition-all duration-300 relative z-10 ${authMode === 'login' ? 'text-black shadow-lg shadow-yellow-500/20' : 'text-white/50 hover:text-white'}`}
          >
            {authMode === 'login' && (
              <motion.div layoutId="auth-tab" className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl -z-10" />
            )}
            লগইন
          </button>
          <button 
            onClick={() => setAuthMode('register')}
            className={`flex-1 py-3.5 rounded-xl text-sm font-black transition-all duration-300 relative z-10 ${authMode === 'register' ? 'text-black shadow-lg shadow-yellow-500/20' : 'text-white/50 hover:text-white'}`}
          >
            {authMode === 'register' && (
              <motion.div layoutId="auth-tab" className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl -z-10" />
            )}
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
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500 rounded-l-lg opacity-0 group-focus-within:opacity-100 transition-opacity drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]"></div>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-yellow-400 transition-colors">
                    <User size={20} />
                  </div>
                  <input 
                    {...registerLogin('username')}
                    type="text" 
                    placeholder="ইউজারনেম / ইমেইল / মোবাইল নম্বর"
                    className="w-full bg-[#111] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white text-sm focus:border-yellow-500/50 outline-none transition-all placeholder:text-white/30 focus:bg-emerald-950/10 focus:shadow-[0_0_15px_rgba(234,179,8,0.1)]"
                  />
                </div>
                <p className="text-[10px] text-yellow-500 font-medium leading-tight ml-2">
                  সঠিক ইউজারনেম, ইমেইল অথবা মোবাইল নম্বর টি প্রবেশ করুন
                </p>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500 rounded-l-lg opacity-0 group-focus-within:opacity-100 transition-opacity drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]"></div>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-yellow-400 transition-colors">
                    <Lock size={20} />
                  </div>
                  <input 
                    {...registerLogin('password')}
                    type={showPassword ? "text" : "password"} 
                    placeholder="পাসওয়ার্ড প্রবেশ করুন"
                    className="w-full bg-[#111] border border-white/10 rounded-xl py-4 pl-12 pr-12 text-white text-sm focus:border-yellow-500/50 outline-none transition-all placeholder:text-white/30 focus:bg-emerald-950/10 focus:shadow-[0_0_15px_rgba(234,179,8,0.1)]"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-yellow-400 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
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
                className="w-full bg-gradient-to-b from-[#25ab5e] to-[#0c6b32] py-4 rounded-xl text-white font-black text-lg shadow-[0_4px_15px_rgba(37,171,94,0.3)] hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center border border-emerald-400/30"
              >
                {isLoading ? <Loader2 size={24} className="animate-spin" /> : 'লগইন করুন'}
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
              <div className="space-y-2">
                <div className="relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500 rounded-l-lg opacity-0 group-focus-within:opacity-100 transition-opacity drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]"></div>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-yellow-400 transition-colors">
                    <User size={20} />
                  </div>
                  <input 
                    {...registerSignup('username')}
                    type="text" 
                    placeholder="দয়া করে ব্যবহারকারী নাম দিন"
                    className="w-full bg-[#111] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white text-sm focus:border-yellow-500/50 outline-none transition-all placeholder:text-white/30 focus:bg-emerald-950/10 focus:shadow-[0_0_15px_rgba(234,179,8,0.1)]"
                  />
                </div>
                {signupErrors.username && <p className="text-[10px] text-red-500 mt-1 ml-2 font-bold italic">! {signupErrors.username.message}</p>}
              </div>

              {/* Email Field */}
              <div className="space-y-1">
                <div className="relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500 rounded-l-lg opacity-0 group-focus-within:opacity-100 transition-opacity drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]"></div>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-yellow-400 transition-colors">
                    <Mail size={20} />
                  </div>
                  <input 
                    {...registerSignup('email')}
                    type="email" 
                    placeholder="ইমেইল এড্রেস"
                    className="w-full bg-[#111] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white text-sm focus:border-yellow-500/50 outline-none transition-all placeholder:text-white/30 focus:bg-emerald-950/10 focus:shadow-[0_0_15px_rgba(234,179,8,0.1)]"
                  />
                </div>
                {signupErrors.email && <p className="text-[10px] text-red-500 mt-1 ml-2 font-bold italic">! {signupErrors.email.message}</p>}
              </div>

              {/* Password Field */}
              <div className="relative group">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500 rounded-l-lg opacity-0 group-focus-within:opacity-100 transition-opacity drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]"></div>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-yellow-400 transition-colors">
                  <Lock size={20} />
                </div>
                <input 
                  {...registerSignup('password')}
                  type={showPassword ? "text" : "password"} 
                  placeholder="পাসওয়ার্ড"
                  className="w-full bg-[#111] border border-white/10 rounded-xl py-4 pl-12 pr-12 text-white text-sm focus:border-yellow-500/50 outline-none transition-all placeholder:text-white/30 focus:bg-emerald-950/10 focus:shadow-[0_0_15px_rgba(234,179,8,0.1)]"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-yellow-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Confirm Password Field */}
              <div className="relative group">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500 rounded-l-lg opacity-0 group-focus-within:opacity-100 transition-opacity drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]"></div>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-yellow-400 transition-colors">
                  <Lock size={20} />
                </div>
                <input 
                  {...registerSignup('confirmPassword')}
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="পাসওয়ার্ড নিশ্চিত করুন"
                  className="w-full bg-[#111] border border-white/10 rounded-xl py-4 pl-12 pr-12 text-white text-sm focus:border-yellow-500/50 outline-none transition-all placeholder:text-white/30 focus:bg-emerald-950/10 focus:shadow-[0_0_15px_rgba(234,179,8,0.1)]"
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-yellow-400 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Mobile Number Field */}
              <div className="space-y-1">
                <div className="relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500 rounded-l-lg opacity-0 group-focus-within:opacity-100 transition-opacity drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]"></div>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-yellow-400 transition-colors">
                    <Smartphone size={20} />
                  </div>
                  <input 
                    {...registerSignup('phoneNumber')}
                    type="tel" 
                    placeholder="মোবাইল নম্বর"
                    className="w-full bg-[#111] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white text-sm focus:border-yellow-500/50 outline-none transition-all placeholder:text-white/30 focus:bg-emerald-950/10 focus:shadow-[0_0_15px_rgba(234,179,8,0.1)]"
                  />
                </div>
                {signupErrors.phoneNumber && <p className="text-[10px] text-red-500 mt-1 ml-2 font-bold italic">! {signupErrors.phoneNumber.message}</p>}
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-b from-[#25ab5e] to-[#0c6b32] py-4 rounded-xl text-white font-black text-lg shadow-[0_4px_15px_rgba(37,171,94,0.3)] hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center border border-emerald-400/30"
                >
                  {isLoading ? <Loader2 size={24} className="animate-spin" /> : 'নিবন্ধন'}
                </button>
                <button 
                  type="reset"
                  className="flex-1 bg-black/40 border border-[#25ab5e] py-4 rounded-xl text-[#25ab5e] font-black text-lg hover:bg-[#25ab5e]/10 transition-all active:scale-95"
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
            <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-white/10"></div>
            <span className="text-yellow-500/60 text-xs font-bold uppercase tracking-widest">অথবা চালিয়ে যান</span>
            <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-white/10"></div>
          </div>

          <div className="space-y-4">
            <button 
              onClick={onFacebookLogin}
              disabled={isLoading}
              type="button"
              className="w-full bg-gradient-to-r from-[#1877F2] to-[#166fe5] py-4 rounded-xl text-white font-bold flex items-center justify-center gap-3 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-500/20"
            >
              <Facebook size={20} fill="currentColor" />
              Facebook দিয়ে চালিয়ে যান
            </button>
            <button 
              onClick={onGoogleLogin}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-white to-gray-200 py-4 rounded-xl text-black font-bold flex items-center justify-center gap-3 hover:scale-[1.02] transition-all active:scale-95 shadow-lg shadow-white/10"
            >
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" alt="Google" className="w-5 h-5 flex-shrink-0" />
              <span className="text-[15px]">Google দিয়ে চালিয়ে যান</span>
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
