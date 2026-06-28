import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Mail,
  Smartphone,
  UserPlus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X,
} from "lucide-react";
import { auth, db } from "../services/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  signInWithCustomToken,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { getBackendUrl } from "../config";

const loginSchema = z.object({
  username: z.string().min(3, "ইউজারনেম অন্তত ৩ অক্ষরের হতে হবে"),
  password: z.string().min(6, "পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে"),
});

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "ইউজারনেম অন্তত ৩ অক্ষরের হতে হবে")
      .regex(/^[a-zA-Z0-9_]+$/, "শুধুমাত্র অক্ষর ও সংখ্যা ব্যবহার করুন"),
    mobile: z.string().min(11, "সঠিক মোবাইল নাম্বার দিন"),
    password: z.string().min(6, "পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে"),
    confirmPassword: z.string().min(6, "পাসওয়ার্ড নিশ্চিত করুন"),
    referralCode: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "পাসওয়ার্ড মিলছে না",
    path: ["confirmPassword"],
  });

const forgotPasswordSchema = z.object({
  email: z.string().email("সঠিক ইমেইল দিন"),
});

interface LoginPageProps {
  onLoginSuccess: (userData: any) => void;
  onRegisterSuccess: () => void;
  onContinue: () => void;
  initialMode?: "login" | "register";
  showToast: (
    msg: string,
    type?: "success" | "error" | "warning" | "info",
  ) => void;
  showNotification: (
    msg: string,
    type: "success" | "info" | "error" | "warning",
    title?: string,
  ) => void;
  appLogo?: string;
}

export default function LoginPage({
  onLoginSuccess,
  onRegisterSuccess,
  onContinue,
  initialMode = "login",
  showToast,
  showNotification,
  appLogo,
}: LoginPageProps) {
  const [authMode, setAuthMode] = useState<
    "login" | "register" | "forgot-password"
  >(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberPassword, setRememberPassword] = useState(true);

  // States for pending Google Sign-In registration
  const [googleUserPending, setGoogleUserPending] = useState<{
    uid: string;
    email: string | null;
    displayName: string | null;
  } | null>(null);
  const [googlePassword, setGooglePassword] = useState("");
  const [googleMobile, setGoogleMobile] = useState("");
  const [googleReferralCode, setGoogleReferralCode] = useState("");

  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerRegister,
    handleSubmit: handleSubmitRegister,
    formState: { errors: registerErrors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const {
    register: registerForgot,
    handleSubmit: handleSubmitForgot,
    formState: { errors: forgotErrors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  useEffect(() => {
    setAuthMode(initialMode);
  }, [initialMode]);

  const handleAuthError = (err: any) => {
    console.error("Auth Error:", err);
    let msg = "একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।";
    if (
      err.code === "auth/user-not-found" ||
      err.code === "auth/wrong-password"
    ) {
      msg = "ইমেইল অথবা পাসওয়ার্ড সঠিক নয়";
    } else if (err.code === "auth/email-already-in-use") {
      msg = "এই ইমেইলটি ইতিপূর্বে ব্যবহার করা হয়েছে";
    } else if (err.message && err.message.includes("not found in Firestore")) {
      msg = "ইউজারনেম অথবা পাসওয়ার্ড সঠিক নয়";
    } else if (err.message) {
      msg = err.message;
    }
    setError(msg);
    showToast(msg, "error");
  };

  const onEmailLogin = async (data: any) => {
    setIsLoading(true);
    setError(null);
    const usernameTrimmed = (data.username || "").trim();
    const passwordTrimmed = (data.password || "").trim();

    try {
      // 1. Try secure server-side login
      const loginResponse = await fetch(`${getBackendUrl()}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: usernameTrimmed,
          password: passwordTrimmed,
        }),
      });

      const loginData = await loginResponse.json();

      if (loginResponse.ok && loginData.token) {
        if (loginData.isMock) {
          console.log(
            "[Auth] Detected mock token from server, preparing mock session...",
          );
          localStorage.setItem("mock_user_uid", loginData.userId);
          localStorage.setItem("mock_user_email", loginData.email);
          localStorage.setItem("mock_user_username", loginData.username);
          localStorage.setItem("mock_user_token", loginData.token);

          onLoginSuccess({
            id: loginData.userId,
            username: loginData.username,
            email: loginData.email,
            balance: loginData.balance,
            role: loginData.role,
          });
          showToast("লগইন সফল হয়েছে (সেশন মোড)", "success");
          return;
        }

        try {
          // Log in using the custom token returned by the server (Secure & Reliable)
          const userCredential = await signInWithCustomToken(
            auth,
            loginData.token,
          );
          const user = userCredential.user;
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const userData = userDoc.exists()
            ? userDoc.data()
            : { username: usernameTrimmed, balance: 1000, role: "user" };

          onLoginSuccess({ id: user.uid, ...userData });
          showToast("লগইন সফল হয়েছে", "success");
          return;
        } catch (tokenErr: any) {
          console.warn(
            "[Auth] Custom token sign-in failed, trying fallback:",
            tokenErr.message,
          );
          // If the token is a mock JWT, handle it as a mock session as a last resort
          if (
            loginData.token.split(".").length === 3 &&
            (tokenErr.code === "auth/invalid-credential" ||
              tokenErr.code === "auth/malformed-jwt")
          ) {
            console.log(
              "[Auth] Detected mock token in catch block, preparing mock session...",
            );
            localStorage.setItem("mock_user_uid", loginData.userId);
            localStorage.setItem("mock_user_email", loginData.email);
            localStorage.setItem("mock_user_username", loginData.username);
            localStorage.setItem("mock_user_token", loginData.token);

            onLoginSuccess({
              id: loginData.userId,
              username: loginData.username,
              email: loginData.email,
              balance: loginData.balance,
              role: loginData.role,
            });
            showToast("লগইন সফল হয়েছে (সেশন মোড)", "success");
            return;
          }
        }
      }

      if (!loginData.fallback) {
        throw new Error(loginData.error || "Login failed");
      }

      // 2. Fallback to direct client-side login if server allows it
      const loginEmail = usernameTrimmed.includes("@")
        ? usernameTrimmed
        : `${usernameTrimmed.toLowerCase()}@spin71bet1.aistudio`;
      const userCredential = await signInWithEmailAndPassword(
        auth,
        loginEmail,
        passwordTrimmed,
      );
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.exists()
        ? userDoc.data()
        : { username: usernameTrimmed, balance: 1000, role: "user" };

      onLoginSuccess({ id: user.uid, ...userData });
      showToast("লগইন সফল হয়েছে", "success");
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const onEmailRegister = async (data: any) => {
    setIsLoading(true);
    setError(null);
    const { username, mobile, password, referralCode } = data;
    const usernameTrimmed = username.trim();
    const passwordTrimmed = password.trim();
    const registerEmail = `${usernameTrimmed.toLowerCase()}@spin71bet1.aistudio`;

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        registerEmail,
        passwordTrimmed,
      );
      const user = userCredential.user;

      // 2. Create user document in Firestore
      const newUser = {
        username: usernameTrimmed,
        email: registerEmail,
        password: passwordTrimmed, // Retain password in Firestore for backend validation
        _serverSecret: "be4c6d81-1cb2-4249-a5cd-7822e9fa2a91_server_secret", // Append server secret for bypass rules queries
        mobile: mobile,
        balance: 100, // Welcome bonus
        role: "user",
        status: "active",
        createdAt: new Date().toISOString(),
        referralCode:
          usernameTrimmed.toLowerCase().substring(0, 4) +
          Math.floor(1000 + Math.random() * 9000),
        referredBy: referralCode || null,
        vipLevel: 0,
        experience: 0,
      };

      await setDoc(doc(db, "users", user.uid), newUser);

      onLoginSuccess({ id: user.uid, ...newUser });
      showToast("নিবন্ধন সফল হয়েছে", "success");
      onRegisterSuccess();
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const onForgotPassword = async (data: any) => {
    setIsLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, data.email);
      showToast("পাসওয়ার্ড রিসেট ইমেইল পাঠানো হয়েছে", "success");
      setAuthMode("login");
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-[#0f1115] flex flex-col overflow-y-auto no-scrollbar font-sans selection:bg-emerald-500/30">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/5 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-5">
        <button
          onClick={onContinue}
          className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all active:scale-90"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200 uppercase">
            SPIN71BET✨
          </span>
        </div>
        <div className="w-10"></div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 px-6 w-full max-w-[480px] mx-auto pb-10 flex flex-col justify-center">
        {/* Banner Image */}
        <div className="mb-8 relative group">
          <div className="absolute inset-0 bg-emerald-500/20 blur-2xl opacity-40 group-hover:opacity-60 transition-opacity" />
          <div className="relative z-10 bg-[#1a1c23] rounded-[32px] border border-white/10 shadow-2xl overflow-hidden">
            <img
              src="https://www.image2url.com/r2/default/images/1780868316316-d0893d59-2e15-4b63-b4f7-8e3dd47601b0.jpg"
              alt="App Banner"
              className="w-full h-44 object-contain scale-90 group-hover:scale-100 transition-transform duration-700"
            />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-white uppercase tracking-tight italic">
            {authMode === "login"
              ? "Welcome Back"
              : authMode === "register"
                ? "Join Now"
                : "Reset Password"}
          </h2>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-emerald-500"></div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
              {authMode === "login"
                ? "লগইন করুন"
                : authMode === "register"
                  ? "নিবন্ধন করুন"
                  : "পুনরুদ্ধার করুন"}
            </p>
            <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-emerald-500"></div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {googleUserPending ? (
            <motion.div
              key="google-register-form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-4"
            >
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-emerald-400 text-xs text-center font-bold">
                <div className="flex items-center justify-center gap-2">
                  <ShieldCheck size={16} />
                  <span>গুগল ভেরিফিকেশন সফল! অ্যাকাউন্টটি সম্পন্ন করতে নিচের তথ্যগুলো পূরণ করুন।</span>
                </div>
              </div>

              {/* Email (Read Only) */}
              <div>
                <div className="flex bg-white/5 border border-white/5 rounded-2xl overflow-hidden h-14 items-center px-4">
                  <Mail className="w-5 h-5 text-gray-500 mr-3" />
                  <span className="text-gray-400 text-sm font-bold truncate">
                    {googleUserPending.email}
                  </span>
                </div>
              </div>

              {/* Mobile Input */}
              <div>
                <div className="flex bg-white/5 border border-white/10 rounded-2xl overflow-hidden h-14 transition-all focus-within:border-emerald-500/50">
                  <div className="pl-4 pr-3 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-emerald-500" />
                  </div>
                  <input
                    type="tel"
                    placeholder="মোবাইল নাম্বার (Mobile)"
                    value={googleMobile}
                    onChange={(e) => setGoogleMobile(e.target.value)}
                    className="w-full bg-transparent text-white text-sm font-bold focus:outline-none py-3 pr-4 placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex bg-white/5 border border-white/10 rounded-2xl overflow-hidden h-14 transition-all focus-within:border-emerald-500/50">
                  <div className="pl-4 pr-3 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-emerald-500" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="পাসওয়ার্ড (Password)"
                    value={googlePassword}
                    onChange={(e) => setGooglePassword(e.target.value)}
                    className="w-full bg-transparent text-white text-sm font-bold focus:outline-none py-3 pr-4 placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* Referral Code */}
              <div>
                <div className="flex bg-white/5 border border-white/10 rounded-2xl overflow-hidden h-14 transition-all focus-within:border-emerald-500/50">
                  <div className="pl-4 pr-3 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-emerald-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="রেফারেল কোড (ঐচ্ছিক)"
                    value={googleReferralCode}
                    onChange={(e) => setGoogleReferralCode(e.target.value)}
                    className="w-full bg-transparent text-white text-sm font-bold focus:outline-none py-3 pr-4 placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setGoogleUserPending(null)}
                  className="w-1/3 bg-white/5 border border-white/10 text-white py-4 rounded-[20px] font-bold text-sm hover:bg-white/10 active:scale-95 transition-all"
                >
                  বাতিল করুন
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={async () => {
                    const pass = googlePassword.trim();
                    const mob = googleMobile.trim();
                    if (pass.length < 6) {
                      showToast("পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে", "error");
                      return;
                    }
                    if (mob.length < 11) {
                      showToast("সঠিক মোবাইল নাম্বার দিন", "error");
                      return;
                    }
                    setIsLoading(true);
                    try {
                      const newUser = {
                        username: googleUserPending.email || "user",
                        email: googleUserPending.email,
                        password: pass,
                        _serverSecret:
                          "be4c6d81-1cb2-4249-a5cd-7822e9fa2a91_server_secret",
                        mobile: mob,
                        balance: 100, // Welcome bonus
                        role: "user",
                        status: "active",
                        createdAt: new Date().toISOString(),
                        referralCode:
                          (googleUserPending.email || "user")
                            .split("@")[0]
                            .toLowerCase()
                            .substring(0, 4) +
                          Math.floor(1000 + Math.random() * 9000),
                        referredBy: googleReferralCode.trim() || null,
                        vipLevel: 0,
                        experience: 0,
                      };
                      await setDoc(
                        doc(db, "users", googleUserPending.uid),
                        newUser,
                      );
                      onLoginSuccess({ id: googleUserPending.uid, ...newUser });
                      showToast("নিবন্ধন সফল হয়েছে", "success");
                      onRegisterSuccess();
                      setGoogleUserPending(null);
                    } catch (err: any) {
                      handleAuthError(err);
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-400 text-white py-4 rounded-[20px] font-black text-sm shadow-xl shadow-emerald-900/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center uppercase tracking-wider"
                >
                  {isLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    "সম্পূর্ণ করুন"
                  )}
                </button>
              </div>
            </motion.div>
          ) : authMode === "login" && (
            <motion.div
              key="login-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <form
                onSubmit={handleSubmitLogin(onEmailLogin)}
                className="space-y-4"
              >
                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-500 text-xs text-center font-bold animate-in fade-in zoom-in duration-300">
                    <div className="flex items-center justify-center gap-2">
                      <AlertCircle size={16} />
                      {error}
                    </div>
                  </div>
                )}

                {/* User Input */}
                <div>
                  <div className="flex bg-white/5 border border-white/10 rounded-2xl overflow-hidden h-14 transition-all focus-within:border-emerald-500/50 focus-within:bg-white/10">
                    <div className="pl-4 pr-3 flex items-center justify-center">
                      <User className="w-5 h-5 text-emerald-500" />
                    </div>
                    <input
                      {...registerLogin("username")}
                      type="text"
                      placeholder="ইউজারনেম (Username)"
                      className="w-full bg-transparent text-white text-sm font-bold focus:outline-none py-3 pr-4 placeholder:text-gray-500"
                    />
                  </div>
                  {loginErrors.username && (
                    <p className="text-rose-500 text-[10px] font-bold mt-1 ml-4 uppercase tracking-wider">
                      {loginErrors.username.message}
                    </p>
                  )}
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex bg-white/5 border border-white/10 rounded-2xl overflow-hidden h-14 transition-all focus-within:border-emerald-500/50 focus-within:bg-white/10">
                    <div className="pl-4 pr-3 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-emerald-500" />
                    </div>
                    <input
                      {...registerLogin("password")}
                      type={showPassword ? "text" : "password"}
                      placeholder="পাসওয়ার্ড (Password)"
                      className="w-full bg-transparent text-white text-sm font-bold focus:outline-none py-3 pr-4 placeholder:text-gray-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="px-4 text-gray-500 flex items-center justify-center focus:outline-none hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <p className="text-rose-500 text-[10px] font-bold mt-1 ml-4 uppercase tracking-wider">
                      {loginErrors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs mt-2 px-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${rememberPassword ? "bg-emerald-500 border-emerald-500" : "border-white/10 bg-white/5"}`}
                    >
                      <input
                        type="checkbox"
                        checked={rememberPassword}
                        onChange={(e) => setRememberPassword(e.target.checked)}
                        className="hidden"
                      />
                      {rememberPassword && (
                        <CheckCircle2 size={12} className="text-white" />
                      )}
                    </div>
                    <span className="text-gray-400 font-bold group-hover:text-gray-200 transition-colors">
                      মনে রাখুন
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setAuthMode("forgot-password")}
                    className="text-emerald-400 hover:text-emerald-300 font-black uppercase tracking-widest"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-400 text-white py-4 rounded-[20px] font-black text-lg shadow-xl shadow-emerald-900/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center mt-6 uppercase tracking-widest"
                >
                  {isLoading ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    "Login"
                  )}
                </button>

                <div className="flex items-center gap-4 my-6">
                  <div className="h-[1px] flex-1 bg-white/5"></div>
                  <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                    অথবা
                  </span>
                  <div className="h-[1px] flex-1 bg-white/5"></div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const provider = new GoogleAuthProvider();
                    signInWithPopup(auth, provider)
                      .then((result) => {
                        const user = result.user;
                        getDoc(doc(db, "users", user.uid)).then((docSnap) => {
                          if (docSnap.exists()) {
                            onLoginSuccess({ id: user.uid, ...docSnap.data() });
                          } else {
                            setGooglePassword("");
                            setGoogleMobile("");
                            setGoogleReferralCode("");
                            setGoogleUserPending({
                              uid: user.uid,
                              email: user.email,
                              displayName: user.displayName,
                            });
                          }
                        });
                      })
                      .catch((err) => showToast(err.message, "error"));
                  }}
                  className="w-full bg-white/5 border border-white/10 text-white py-4 rounded-[20px] font-bold text-sm hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google"
                    className="w-5 h-5"
                  />
                  <span>Google দিয়ে লগইন</span>
                </button>

                <div className="text-center mt-6">
                  <p className="text-gray-500 text-xs font-bold">
                    অ্যাকাউন্ট নেই?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthMode("register")}
                      className="text-emerald-400 hover:underline font-black uppercase tracking-widest"
                    >
                      Register Now
                    </button>
                  </p>
                </div>
              </form>
            </motion.div>
          )}

          {authMode === "register" && (
            <motion.div
              key="register-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <form
                onSubmit={handleSubmitRegister(onEmailRegister)}
                className="space-y-4"
              >
                {/* Username */}
                <div>
                  <div className="flex bg-white/5 border border-white/10 rounded-2xl overflow-hidden h-14 transition-all focus-within:border-emerald-500/50">
                    <div className="pl-4 pr-3 flex items-center justify-center">
                      <User className="w-5 h-5 text-emerald-500" />
                    </div>
                    <input
                      {...registerRegister("username")}
                      type="text"
                      placeholder="ইউজারনেম (Username)"
                      className="w-full bg-transparent text-white text-sm font-bold focus:outline-none py-3 pr-4 placeholder:text-gray-500"
                    />
                  </div>
                  {registerErrors.username && (
                    <p className="text-rose-500 text-[10px] font-bold mt-1 ml-4 uppercase">
                      {registerErrors.username.message}
                    </p>
                  )}
                </div>

                {/* Mobile */}
                <div>
                  <div className="flex bg-white/5 border border-white/10 rounded-2xl overflow-hidden h-14 transition-all focus-within:border-emerald-500/50">
                    <div className="pl-4 pr-3 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-emerald-500" />
                    </div>
                    <input
                      {...registerRegister("mobile")}
                      type="tel"
                      placeholder="মোবাইল নাম্বার (Mobile)"
                      className="w-full bg-transparent text-white text-sm font-bold focus:outline-none py-3 pr-4 placeholder:text-gray-500"
                    />
                  </div>
                  {registerErrors.mobile && (
                    <p className="text-rose-500 text-[10px] font-bold mt-1 ml-4 uppercase">
                      {registerErrors.mobile.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex bg-white/5 border border-white/10 rounded-2xl overflow-hidden h-14 transition-all focus-within:border-emerald-500/50">
                      <input
                        {...registerRegister("password")}
                        type="password"
                        placeholder="পাসওয়ার্ড"
                        className="w-full bg-transparent text-white text-sm font-bold focus:outline-none px-4 py-3 placeholder:text-gray-500"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex bg-white/5 border border-white/10 rounded-2xl overflow-hidden h-14 transition-all focus-within:border-emerald-500/50">
                      <input
                        {...registerRegister("confirmPassword")}
                        type="password"
                        placeholder="নিশ্চিত করুন"
                        className="w-full bg-transparent text-white text-sm font-bold focus:outline-none px-4 py-3 placeholder:text-gray-500"
                      />
                    </div>
                  </div>
                </div>
                {(registerErrors.password ||
                  registerErrors.confirmPassword) && (
                  <p className="text-rose-500 text-[10px] font-bold ml-4 uppercase">
                    {registerErrors.password?.message ||
                      registerErrors.confirmPassword?.message}
                  </p>
                )}

                {/* Referral Code */}
                <div>
                  <div className="flex bg-white/5 border border-white/10 rounded-2xl overflow-hidden h-14 transition-all focus-within:border-emerald-500/50">
                    <div className="pl-4 pr-3 flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-emerald-500" />
                    </div>
                    <input
                      {...registerRegister("referralCode")}
                      type="text"
                      placeholder="রেফারেল কোড (ঐচ্ছিক)"
                      className="w-full bg-transparent text-white text-sm font-bold focus:outline-none py-3 pr-4 placeholder:text-gray-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-400 text-white py-4 rounded-[20px] font-black text-lg shadow-xl shadow-emerald-900/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center mt-4 uppercase tracking-widest"
                >
                  {isLoading ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    "Register"
                  )}
                </button>

                <div className="text-center mt-6">
                  <p className="text-gray-500 text-xs font-bold">
                    ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthMode("login")}
                      className="text-emerald-400 hover:underline font-black uppercase tracking-widest"
                    >
                      Login Now
                    </button>
                  </p>
                </div>
              </form>
            </motion.div>
          )}

          {authMode === "forgot-password" && (
            <motion.div
              key="forgot-password-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <form
                onSubmit={handleSubmitForgot(onForgotPassword)}
                className="space-y-4"
              >
                <div>
                  <div className="flex bg-white/5 border border-white/10 rounded-2xl overflow-hidden h-14 transition-all focus-within:border-emerald-500/50">
                    <div className="pl-4 pr-3 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-emerald-500" />
                    </div>
                    <input
                      {...registerForgot("email")}
                      type="email"
                      placeholder="আপনার ইমেইল এড্রেস"
                      className="w-full bg-transparent text-white text-sm font-bold focus:outline-none py-3 pr-4 placeholder:text-gray-500"
                    />
                  </div>
                  {forgotErrors.email && (
                    <p className="text-rose-500 text-[10px] font-bold mt-1 ml-4 uppercase">
                      {forgotErrors.email.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-400 text-white py-4 rounded-[20px] font-black text-lg shadow-xl shadow-emerald-900/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center mt-4 uppercase tracking-widest"
                >
                  {isLoading ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    "Send Reset Link"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className="w-full text-gray-500 text-xs font-black uppercase tracking-widest mt-4 hover:text-white transition-colors"
                >
                  Back to Login
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 px-6 py-6 border-t border-white/5 mt-auto text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="flex flex-col items-center gap-1 opacity-40">
            <ShieldCheck size={18} className="text-emerald-500" />
            <span className="text-[8px] font-black uppercase tracking-widest text-white">
              SSL Secured
            </span>
          </div>
          <div className="h-6 w-[1px] bg-white/10"></div>
          <div className="flex flex-col items-center gap-1 opacity-40">
            <CheckCircle2 size={18} className="text-emerald-500" />
            <span className="text-[8px] font-black uppercase tracking-widest text-white">
              Verified RNG
            </span>
          </div>
        </div>
        <p className="text-[8px] text-gray-600 font-bold uppercase tracking-[0.3em]">
          &copy; 2024 SPIN71BET Official Platform
        </p>
      </div>
    </div>
  );
}
