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
import { getBackendUrl } from '../config';
import { formatDisplayUID } from '../utils/idUtils';
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

import { formatDisplayUID } from '../utils/idUtils';
import { ToastType } from '../types';
import { auth, db } from '../services/firebase';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithCustomToken
} from 'firebase/auth';

import { doc, setDoc, getDoc, updateDoc, increment, collection, query, where, getDocs, limit, writeBatch, serverTimestamp } from 'firebase/firestore';
import { defaultAvatarBase64 } from '../assets/default-avatar';

interface LoginPageProps {
  onRegisterSuccess: () => void;
  onContinue: () => void;
  onLoginSuccess: (user: any) => void;
  showToast: (msg: string, type?: ToastType) => void;
  showNotification: (msg: string, type: 'success' | 'info' | 'error') => void;
  casinoName?: string;
  isLoggedIn?: boolean;
  welcomeBonus?: number;
  initialMode?: 'login' | 'register';
  appLogo?: string;
}

export default function LoginPage({ onRegisterSuccess, onContinue, onLoginSuccess, showToast, showNotification, casinoName = "SPIN71BET1", isLoggedIn = false, welcomeBonus = 507, initialMode = 'login', appLogo }: LoginPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      username: localStorage.getItem('remember_me') === 'true' ? localStorage.getItem('saved_username') || '' : '',
      password: localStorage.getItem('remember_me') === 'true' ? localStorage.getItem('saved_password') || '' : ''
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
      promoCode: new URLSearchParams(window.location.search).get('ref') || localStorage.getItem('referralCode') || ''
    }
  });

  const passwordWatch = watchRegister('password');
  useEffect(() => {
    if (passwordWatch) checkPasswordStrength(passwordWatch);
  }, [passwordWatch]);

  useEffect(() => {
    if (rememberPassword) {
      const savedUsername = localStorage.getItem('saved_username');
      const savedPassword = localStorage.getItem('saved_password');
      if (savedUsername && authMode === 'login') {
        setValueLogin('username', savedUsername);
      }
      if (savedPassword && authMode === 'login') {
        setValueLogin('password', savedPassword);
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
    console.log("Auth Error:", err.message);
    
    // Ignore error if user closed the popup deliberately
    if (err.code === 'auth/popup-closed-by-user') {
      console.log("User closed the auth popup.");
      return;
    }

    // Handle network errors gracefully
    if (err.code === 'auth/network-request-failed') {
      showToast("সার্ভারের সাথে সংযোগ করতে ব্যর্থ হয়েছে, পুনরায় চেষ্টা করুন।", "error");
      setError("সার্ভারে সমস্যা অথবা আপনার ইন্টারনেট ধীরগতির। আবার চেষ্টা করুন।");
      return;
    }

    let msg = `কিছু ভুল হয়েছে। (Error: ${err.code || 'unknown'})`;
    
    // Firebase Auth Error Codes
    if (err.code === 'auth/unauthorized-domain') {
      const currentDomain = window.location.hostname;
      msg = `এই ডোমেনটি (${currentDomain}) Firebase Authentication-এ অনুমোদিত (Authorized) নয়! দয়া করে ফায়ারবেস কনসোলে এই ডোমেনটি যুক্ত করুন।`;
    } else if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
      msg = "গুগল লগইন পদ্ধতিটি ফায়ারবেস কনসোলে চালু করা নেই! দয়া করে Authentication > Sign-in method থেকে Google চালু করুন।";
    } else if (err.code === 'auth/popup-blocked') {
      msg = "ব্রাউজার পপআপ ব্লক করেছে! দয়া করে পপআপ অনুমোদন করুন এবং পুনরায় চেষ্টা করুন।";
    } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials' || err.code === 'auth/user-not-found') {
      msg = "অ্যাকাউন্ট পাওয়া যায়নি বা username/পাসওয়ার্ড ভুল হচ্ছে!";
    } else {
      if (err.code === 'auth/wrong-password') msg = "ভুল পাসওয়ার্ড! (Wrong password)";
      if (err.code === 'auth/user-not-found') msg = "অ্যাকাউন্ট পাওয়া যায়নি! (No account found)";
      if (err.code === 'auth/invalid-credential') msg = "username বা পাসওয়ার্ড ভুল হচ্ছে (Invalid credentials)";
      if (err.code === 'auth/email-already-in-use') msg = "এই ইউজারনেমটি ইতিমধ্যে ব্যবহার করা হয়েছে! (Username already in use)";
      if (err.code === 'auth/invalid-email') msg = "সঠিক ফরম্যাট দিন! (Invalid format)";
      if (err.code === 'auth/weak-password') msg = "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে (Weak password)";
      if (err.code === 'auth/too-many-requests') msg = "অতিরিক্ত রিকোয়েস্ট! কিছুক্ষণ পর চেষ্টা করুন। (Too many requests)";
      if (err.message && err.message.includes('missing or insufficient permissions')) msg = "ডেটাবেস পারমিশন সমস্যা! (Permission Denied)";
    }
    
    // Custom error messages from thrown errors
    if (err.message && err.message.length < 100) {
      if (err.message.includes('Username already taken')) msg = "এই ইউজারনেমটি ইতিমধ্যে ব্যবহার করা হয়েছে";
      if (err.message.includes('Phone already registered')) msg = "এই ফোন নম্বরটি ইতিমধ্যে ব্যবহার করা হয়েছে";
      if (err.message.includes('not found')) msg = err.message;
    }

    // Default detailed fallback if msg stays generic
    if (msg.startsWith('কিছু ভুল হয়েছে') && err.message) {
      msg = `অপারেশন ব্যর্থ হয়েছে: ${err.message} (কোড: ${err.code})`;
    }

    setError(msg);
    showNotification(msg, "error");
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
      
      let returnedUserData: any = {};

      if (!userDoc.exists()) {
        let inviterCode = localStorage.getItem('referralCode');
        
        // Secondary fallback for cross-domain redirects (window.name persists)
        if (!inviterCode && window.name && window.name.startsWith('ref_code:')) {
          inviterCode = window.name.split(':')[1];
          console.log("[Google Referral Debug] Recovered referral code from window.name:", inviterCode);
        }

        let inviterUid = null;
        
        if (inviterCode) {
           try {
             const lookupRes = await fetch(`${getBackendUrl()}/api/referral/lookup`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ code: inviterCode })
             });
             const lookupData = await lookupRes.json();
             if (lookupData.exists) {
               inviterUid = lookupData.uid;
             }
           } catch (lookupErr) {
             console.error("[Referral Lookup Error]:", lookupErr);
           }
        }

        const cleanDisplayName = (user.displayName || 'Google User').replace(/[^a-zA-Z0-9]/g, '').substring(0, 13) || `g${user.uid.substring(0,5)}`;
        const isAdmin = user.email === 'owner.css13@gmail.com' || user.email === 'cutelegend7045@gmail.com' || user.email === 'xsaber7644@gmil.com' || user.uid === 'vxjksOlXuChe3OjfYmpxBsJcwLH2';
        
        const initialBalance = inviterCode ? 20 : 0;

        const newUser = {
          username: cleanDisplayName,
          email: user.email || "",
          balance: initialBalance,
          requiredTurnover: 0, // No registration turnover restriction
          role: isAdmin ? 'admin' : 'user',
          isAdmin: isAdmin,
          totalDeposits: 0,
          totalWithdrawals: 0,
          bonusesClaimed: [],
          createdAt: new Date().toISOString(),
          profilePictureUrl: "https://www.image2url.com/r2/default/images/1779828873931-409cfe92-d243-4926-91bd-67da3a1e0adc.png",
          referredBy: inviterUid,
          referralCode: generateReferralCode(),
          referralCount: 0,
          validReferralCount: 0,
          totalReferralEarnings: 0
        };
        
        await setDoc(userDocRef, newUser);
        
        // System Log
        const logRef = doc(collection(db, 'system_logs'));
        setDoc(logRef, {
          type: 'user',
          action: 'user_registered',
          details: { username: cleanDisplayName, method: 'google', email: user.email },
          userId: user.uid,
          createdAt: serverTimestamp ? serverTimestamp() : new Date().toISOString()
        }).catch(err => console.error("Log error", err));

        // If code was provided, try to claim it as a promo code as well
        if (inviterCode) {
          const idToken = await user.getIdToken();
          fetch(`${getBackendUrl()}/api/promo/claim`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ code: inviterCode.toUpperCase(), userId: user.uid })
          }).catch(err => console.warn("Promo claim during registration failed:", err));
        }
        
        if (isAdmin) {
          await setDoc(doc(db, 'admins', user.uid), {
            email: user.email,
            addedAt: new Date().toISOString()
          });
        }
        
        if (inviterUid) {
          // Trigger server-side bonus processing
          fetch(`${getBackendUrl()}/api/referral/process`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              userId: user.uid, 
              inviterUid, 
              referralType: 'Google Signup' 
            })
          }).catch(err => console.error("Referral API error:", err));
        }
        
        localStorage.removeItem('referralCode');
        try {
          if (window.name.startsWith('ref_code:')) window.name = '';
        } catch (e) {}

        returnedUserData = newUser;
      } else {
        returnedUserData = userDoc.data();
      }
      
      showToast("গুগল লগইন সফল হয়েছে", "success");
      onLoginSuccess({ id: user.uid, username: user.displayName, ...returnedUserData });
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
      const usernameTrimmed = (data.username || "").trim();
      const passwordTrimmed = (data.password || "").trim();

      let resultUser = null;
      let serverVerificationSucceeded = false;
      let lastLoginData: any = null;

      // 1. Try secure server-side login with Firestore check & custom token generator (Identity Toolkit API bypass)
      try {
        const loginRes = await fetch(`${getBackendUrl()}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: usernameTrimmed, password: passwordTrimmed })
        });
        const loginData = await loginRes.json();
        if (loginRes.ok && loginData.success && loginData.customToken) {
          serverVerificationSucceeded = true;
          lastLoginData = loginData;
          try {
            const authResult = await signInWithCustomToken(auth, loginData.customToken);
            resultUser = authResult.user;
            console.log("[Login] Successfully authenticated via secure server-side custom token.");
          } catch (customTokenErr: any) {
            console.warn("[Login] signInWithCustomToken failed, trying client-side email/password fallback:", customTokenErr.message);
          }
        } else if (!loginRes.ok && !loginData.fallback) {
          // If server explicitly returned an error (e.g. incorrect password or banned), throw it immediately
          throw new Error(loginData.error || "Authentication failed");
        }
      } catch (authSrvErr: any) {
        // Propagate validation, incorrect, or banned account errors immediately
        if (authSrvErr.message && (authSrvErr.message.includes("Incorrect") || authSrvErr.message.includes("সঠিক নয়") || authSrvErr.message.includes("ব্যান করা") || authSrvErr.message.includes("banned"))) {
          throw authSrvErr;
        }
        console.warn("[Login] Server-side login skipped/failed, falling back to client-side login:", authSrvErr.message);
      }

      // 2. Client-side Legacy Firebase Auth Fallback (if server-side custom token wasn't used)
      if (!resultUser) {
        let loginEmail = "";
        
        // Check if input is a real email
        if (usernameTrimmed.includes('@')) {
          loginEmail = usernameTrimmed;
        } 
        // Otherwise assume it's a username and try to find their real email in Firestore
        else {
          try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('username', '==', usernameTrimmed), limit(1));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
              const userDoc = querySnapshot.docs[0].data();
              loginEmail = userDoc.email || `${usernameTrimmed.toLowerCase()}@spin71bet1.aistudio`;
              console.log("[Login] Found user by username. Email:", loginEmail);
            } else {
              // Secondary check with lowercase
              const qLower = query(usersRef, where('username', '==', usernameTrimmed.toLowerCase()), limit(1));
              const querySnapshotLower = await getDocs(qLower);
              if (!querySnapshotLower.empty) {
                const userDoc = querySnapshotLower.docs[0].data();
                loginEmail = userDoc.email || `${usernameTrimmed.toLowerCase()}@spin71bet1.aistudio`;
              } else {
                loginEmail = `${usernameTrimmed.toLowerCase()}@spin71bet1.aistudio`;
              }
            }
          } catch (dbErr) {
            console.warn("[Login] Firestore lookup failed, falling back to guessing:", dbErr);
            loginEmail = `${usernameTrimmed.toLowerCase()}@spin71bet1.aistudio`;
          }
        }

        let result;
        try {
          result = await signInWithEmailAndPassword(auth, loginEmail, passwordTrimmed);
          resultUser = result.user;
        } catch (signInErr: any) {
          // Ultimate fallback for very old accounts or suffix mismatches
          const possibleSuffixes = ["@spin71bet.netlify.app", "@spin71bet1.netlify.app", "@spin71bet1.aistudio"];
          let success = false;
          
          if (!usernameTrimmed.includes('@') && (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/wrong-password' || signInErr.code === 'auth/invalid-credential')) {
             for (const suffix of possibleSuffixes) {
               const fallbackEmail = `${usernameTrimmed.toLowerCase()}${suffix}`;
               if (fallbackEmail === loginEmail) continue; // Skip what we already tried
               try {
                 result = await signInWithEmailAndPassword(auth, fallbackEmail, passwordTrimmed);
                 success = true;
                 break;
               } catch (fallbackErr) {
                 continue;
               }
             }
          }
          
          if (success) {
            resultUser = result.user;
          } else {
            // Secure Custom Session Fallback if server verification succeeded previously (e.g. Firebase credentials synchronization lag)
            if (serverVerificationSucceeded && lastLoginData) {
              console.log("[Login] Server verification passed but client Firebase Auth failed. Booting secure mock user session.");
              resultUser = {
                uid: lastLoginData.userId,
                displayName: lastLoginData.username || usernameTrimmed,
                email: lastLoginData.email || `${usernameTrimmed.toLowerCase()}@spin71bet1.aistudio`,
                isMock: true,
                getIdToken: async () => lastLoginData.customToken
              };
              localStorage.setItem('mock_user_uid', lastLoginData.userId);
              localStorage.setItem('mock_user_token', lastLoginData.customToken);
              localStorage.setItem('mock_user_username', lastLoginData.username || usernameTrimmed);
              localStorage.setItem('mock_user_email', lastLoginData.email || `${usernameTrimmed.toLowerCase()}@spin71bet1.aistudio`);
              
              if (lastLoginData.balance !== undefined) {
                 localStorage.setItem('offline_balance_cache', lastLoginData.balance.toString());
              }
            } else {
              throw signInErr;
            }
          }
        }
      }

      const user = resultUser as any;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : { username: usernameTrimmed, balance: 1000, role: 'user' };

      // Keep user's Firestore password updated for admin panel view/edit compatibility
      if (userDoc.exists() && (!userData.password || userData.password !== passwordTrimmed)) {
        try {
          await updateDoc(doc(db, 'users', user.uid), { password: passwordTrimmed });
        } catch (pwSyncErr) {
          console.warn("[Login] Could not synchronize password to Firestore directly from client:", pwSyncErr);
        }
        userData.password = passwordTrimmed;
      }

      if (rememberPassword) {
        localStorage.setItem('remember_me', 'true');
        localStorage.setItem('saved_username', usernameTrimmed);
        localStorage.setItem('saved_password', passwordTrimmed);
      } else {
        localStorage.removeItem('remember_me');
        localStorage.removeItem('saved_username');
        localStorage.removeItem('saved_password');
      }

      showToast("লগইন সফল হয়েছে", "success");
      
      // Give a tiny delay before switching views so user sees popup
      setTimeout(() => {
        onLoginSuccess({ id: user.uid, ...userData });
      }, 50);

      const escapeHTML = (str: string) => str.replace(/[&<>"']/g, m => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'}[m] || m));
      fetch(`${getBackendUrl()}/api/telegram/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'Login',
          userId: user.uid,
          username: userData.username,
          balance: userData.balance
        })
      }).catch(err => console.warn("Telegram notification error (skipped):", err));

    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);
  useEffect(() => {
    if (rememberPassword && !autoLoginAttempted && authMode === 'login' && !isLoggedIn) {
      const savedUsername = localStorage.getItem('saved_username');
      const savedPassword = localStorage.getItem('saved_password');
      if (savedUsername && savedPassword) {
        setAutoLoginAttempted(true);
        console.log("[AutoLogin] Tracking found saved credentials, attempting auto login system...");
        showToast("ট্রেকিং লগইন সিস্টেমে প্রবেশ করা হচ্ছে...", "info");
        onEmailLogin({ username: savedUsername, password: savedPassword });
      }
    }
  }, [rememberPassword, autoLoginAttempted, authMode, isLoggedIn]);

  const onEmailRegister = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const usernameTrimmed = (data.username || "").trim();
      const passwordTrimmed = (data.password || "").trim();
      
      // 1. Create email from username (using standardized .aistudio domain)
      const registerEmail = `${usernameTrimmed.toLowerCase()}@spin71bet1.aistudio`;
      
      const result = await createUserWithEmailAndPassword(auth, registerEmail, passwordTrimmed);
      const user = result.user;
      
      // 2. Set Firebase Auth display name
      await updateProfile(user, { displayName: usernameTrimmed });

      // Try to get referral code from various sources (form, localStorage, or window.name hack)
      let inviterCodeRaw = (data.promoCode || localStorage.getItem('referralCode') || '').trim();
      
      // Secondary fallback for cross-domain redirects (window.name persists)
      if (!inviterCodeRaw && window.name && window.name.startsWith('ref_code:')) {
        inviterCodeRaw = window.name.split(':')[1];
        console.log("[Referral Debug] Recovered referral code from window.name:", inviterCodeRaw);
      }

      let inviterUid = null;
      if (inviterCodeRaw) {
         try {
           const lookupRes = await fetch(`${getBackendUrl()}/api/referral/lookup`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ code: inviterCodeRaw })
           });
           const lookupData = await lookupRes.json();
           if (lookupData.exists) {
             inviterUid = lookupData.uid;
             console.log("[Invitaton Debug] Found inviter UID (via server API):", inviterUid, "for code:", inviterCodeRaw);
           }
         } catch (e) {
           console.error("Referral lookup failed:", e);
         }
      }

      const batch = writeBatch(db);
      const userDocRef = doc(db, 'users', user.uid);

      // Standardizing default signup balance
      const initialBalance = 0;

      // 3. Create user document in Firestore
      const newUser = {
        username: usernameTrimmed,
        email: registerEmail,
        password: passwordTrimmed,
        mobile: data.mobile,
        balance: initialBalance, 
        role: 'user',
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalBets: 0,
        requiredTurnover: 0, // No registration turnover restriction
        bonusesClaimed: [],
        createdAt: new Date().toISOString(),
        profilePictureUrl: "https://www.image2url.com/r2/default/images/1779828873931-409cfe92-d243-4926-91bd-67da3a1e0adc.png",
        referralCode: generateReferralCode(),
        referralCount: 0,
        validReferralCount: 0,
        totalReferralEarnings: 0,
        referredBy: inviterUid
      };
      
      await setDoc(userDocRef, newUser);
      
      // System Log
      const logRef = doc(collection(db, 'system_logs'));
      setDoc(logRef, {
        type: 'user',
        action: 'user_registered',
        details: { username: data.username, method: 'email', mobile: data.mobile },
        userId: user.uid,
        createdAt: serverTimestamp ? serverTimestamp() : new Date().toISOString()
      }).catch(err => console.error("Log error", err));

      // If code was provided, try to claim it as a promo code as well (in case it's a bonus code)
      if (inviterCodeRaw) {
        const idToken = await user.getIdToken();
        fetch(`${getBackendUrl()}/api/promo/claim`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ code: inviterCodeRaw.toUpperCase(), userId: user.uid })
        }).catch(err => console.warn("Promo claim during registration failed (might be referral instead):", err));
      }
      
      if (inviterUid) {
        // Trigger server-side bonus processing
        fetch(`${getBackendUrl()}/api/referral/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: user.uid, 
            inviterUid, 
            referralType: 'Email Signup' 
          })
        }).catch(err => console.error("Referral API error:", err));
      }
      
      localStorage.removeItem('referralCode');
      try {
        if (window.name.startsWith('ref_code:')) window.name = '';
      } catch (e) {}

      // Notify Telegram (non-blocking)
      fetch(`${getBackendUrl()}/api/telegram/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'Registration',
          userId: user.uid,
          username: data.username,
          balance: initialBalance,
          details: `Mobile: ${data.mobile}${inviterUid ? ' | Referred by: ' + inviterUid : ''}`
        })
      }).catch(e => console.warn("Telegram notify skipped:", e));
      
      // Auto Login Tracking System
      localStorage.setItem('remember_me', 'true');
      localStorage.setItem('saved_username', usernameTrimmed);
      localStorage.setItem('saved_password', passwordTrimmed);
      console.log("[AutoLogin] Tracking system recorded new credentials for future auto-login");

      showToast("নিবন্ধন সফল হয়েছে!", "success");
      setTimeout(() => {
        onLoginSuccess({ id: user.uid, ...newUser, balance: initialBalance });
      }, 50);

      // Notify Telegram (non-blocking)
      try {
        const escapeHTML = (str: string) => str.replace(/[&<>"']/g, m => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'}[m] || m));
        fetch(`${getBackendUrl()}/api/telegram/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `🆕 <b>New User Registered!</b>\n\n👤 <b>Username:</b> ${escapeHTML(data.username)}\n🔢 <b>UID:</b> <code>${formatDisplayUID(user.uid)}</code>${inviterUid ? '\n🤝 <b>Referred By:</b> <code>' + inviterUid + '</code>' : ''}`
          })
        }).catch(e => console.warn("Telegram submit notify skipped:", e));
      } catch (tErr) {
        console.warn("Telegram notification skipped during registration:", tErr);
      }
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
      await sendPasswordResetEmail(auth, data.email);
      showToast("রিসেট লিঙ্ক আপনার ইমেইলে পাঠানো হয়েছে। (Reset link sent to your email)", "success");
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
      <div className="relative w-full bg-[#0d1a29] flex justify-center shrink-0 py-8">
        <img 
          src="https://www.image2url.com/r2/default/images/1780868316316-d0893d59-2e15-4b63-b4f7-8e3dd47601b0.jpg" 
          onError={(e) => {
            e.currentTarget.src = 'https://www.image2url.com/r2/default/images/1780868316316-d0893d59-2e15-4b63-b4f7-8e3dd47601b0.jpg';
          }}
          alt="SPIN71 BET✨ Logo" 
          className="h-44 md:h-56 lg:h-64 object-contain drop-shadow-[0_0_35px_rgba(253,216,53,0.5)] transition-all duration-300"
          referrerPolicy="no-referrer"
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
                
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-500 text-sm text-center font-medium">
                    {error}
                  </div>
                )}
                
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
                
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-500 text-sm text-center font-medium">
                    {error}
                  </div>
                )}
                
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
                      placeholder="মোাবাইল নম্বর"
                      className="w-full bg-transparent text-white text-base focus:outline-none py-3 pr-4 placeholder:text-gray-200"
                    />
                  </div>
                  {registerErrors.mobile && <p className="text-red-500 text-xs mt-1 ml-4">{registerErrors.mobile.message}</p>}
                </div>

                {/* Promo/Referral Code Input */}
                <div>
                  <div className="flex bg-[#2a2b2d] rounded-lg overflow-hidden h-14">
                    <div className="w-1.5 bg-green-500 shrink-0"></div>
                    <div className="pl-4 pr-3 flex items-center justify-center">
                      <Gift className="w-5 h-5 text-gray-400" />
                    </div>
                    <input 
                      {...registerRegister('promoCode')}
                      type="text" 
                      placeholder="আমন্ত্রণ কোড অথবা প্রোমো কোড (ঐচ্ছিক)"
                      className="w-full bg-transparent text-white text-base focus:outline-none py-3 pr-4 placeholder:text-gray-200 uppercase"
                    />
                  </div>
                  {registerErrors.promoCode && <p className="text-red-500 text-xs mt-1 ml-4">{registerErrors.promoCode.message}</p>}
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

      {/* Removed successPopup UI */}

    </div>
  );
}
