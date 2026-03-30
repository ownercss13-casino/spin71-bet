import React, { useState, useRef } from 'react';
import { User, Phone, Lock, Eye, EyeOff, ChevronLeft, ShieldCheck, ArrowRight, UserPlus, Facebook } from 'lucide-react';
import { motion } from 'motion/react';
import { GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '../firebase';

interface RegisterViewProps {
  onRegister: (userData: any) => void;
  onBackToLogin?: () => void;
}

export default function RegisterView({ onRegister, onBackToLogin }: RegisterViewProps) {
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [agreed, setAgreed] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Phone Auth States
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);

  const setupRecaptcha = () => {
    if (!recaptchaVerifier.current && recaptchaRef.current) {
      recaptchaVerifier.current = new RecaptchaVerifier(auth, recaptchaRef.current, {
        'size': 'invisible',
      });
    }
  };

  const handleGoogleRegister = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      onRegister({ method: 'google', user: result.user });
    } catch (err) {
      console.error("Google Registration Error:", err);
      setError("জিমেইল দিয়ে রেজিস্ট্রেশন ব্যর্থ হয়েছে। (Google registration failed.)");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookRegister = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new FacebookAuthProvider();
      const result = await signInWithPopup(auth, provider);
      onRegister({ method: 'facebook', user: result.user });
    } catch (err) {
      console.error("Facebook Registration Error:", err);
      setError("ফেসবুক দিয়ে রেজিস্ট্রেশন ব্যর্থ হয়েছে। (Facebook registration failed.)");
    } finally {
      setIsLoading(false);
    }
  };

  const sendOtp = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setupRecaptcha();
      const formattedPhone = phone.startsWith('+') ? phone : `+88${phone}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier.current!);
      setConfirmationResult(confirmation);
      setIsOtpSent(true);
    } catch (err: any) {
      console.error("OTP Error:", err);
      setError("ওটিপি পাঠানো ব্যর্থ হয়েছে। নম্বরটি সঠিক কিনা যাচাই করুন।");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (confirmationResult) {
        await confirmationResult.confirm(otp);
        // OTP verified, proceed to registration
        onRegister({ username, phone, password, referralCode });
      }
    } catch (err: any) {
      console.error("Verification Error:", err);
      setError("ভুল ওটিপি। আবার চেষ্টা করুন।");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || !phone || !password || !confirmPassword) {
      setError("সবগুলো ঘর পূরণ করুন। (Please fill all fields.)");
      return;
    }

    if (username.length < 6) {
      setError("ইউজার নেম অন্তত ৬ অক্ষরের হতে হবে। (Username must be at least 6 characters.)");
      return;
    }

    if (phone.length !== 10 && phone.length !== 11) {
      setError("ফোন নম্বর ১০ অথবা ১১ অক্ষরের হতে হবে। (Phone number must be 10 or 11 digits.)");
      return;
    }

    if (password !== confirmPassword) {
      setError("পাসওয়ার্ড মেলেনি। (Passwords do not match.)");
      return;
    }

    if (password.length < 6) {
      setError("পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে। (Password must be at least 6 characters.)");
      return;
    }

    if (!agreed) {
      setError("শর্তাবলীতে সম্মত হতে হবে। (You must agree to terms.)");
      return;
    }

    await sendOtp();
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white flex flex-col font-sans max-w-md mx-auto">
      <div ref={recaptchaRef}></div>
      {/* Header */}
      <div className="bg-[#128a61] p-6 pt-10 rounded-b-[40px] shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-yellow-400/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            {onBackToLogin && (
              <button 
                onClick={onBackToLogin}
                className="p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors text-white backdrop-blur-sm"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <h2 className="text-3xl font-black italic tracking-tighter text-white drop-shadow-md">
              SPIN71 <span className="text-yellow-400">JOIN</span>
            </h2>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{isOtpSent ? 'ওটিপি যাচাই করুন' : 'নতুন অ্যাকাউন্ট তৈরি করুন'}</h1>
          <p className="text-teal-100 text-sm opacity-80">{isOtpSent ? 'আপনার ফোনে পাঠানো ওটিপি দিন' : 'সেরা গেমিং অভিজ্ঞতার জন্য আজই যোগ দিন!'}</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 p-6 -mt-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1b1b1b] rounded-3xl p-6 shadow-2xl border border-white/5"
        >
          {isOtpSent ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs text-teal-300 font-bold ml-1 uppercase tracking-wider">ওটিপি (OTP)</label>
                <input 
                  type="text" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="ওটিপি লিখুন"
                  className="w-full bg-black/40 border border-teal-900/50 rounded-2xl py-3.5 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-teal-500 transition-all"
                />
              </div>
              <button 
                onClick={verifyOtp}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-black py-4 rounded-2xl shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {isLoading ? 'যাচাই হচ্ছে...' : 'যাচাই করুন'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs text-center animate-pulse">
                  {error}
                </div>
              )}

              {/* Username */}
              <div className="space-y-2">
                <label className="text-xs text-teal-300 font-bold ml-1 uppercase tracking-wider">ইউজার নেম (Username)</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-500" size={18} />
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="যেমন: player71"
                    className="w-full bg-black/40 border border-teal-900/50 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-teal-500 transition-all"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-xs text-teal-300 font-bold ml-1 uppercase tracking-wider">ফোন নম্বর (Phone Number)</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-500" size={18} />
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full bg-black/40 border border-teal-900/50 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-teal-500 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-xs text-teal-300 font-bold ml-1 uppercase tracking-wider">পাসওয়ার্ড (Password)</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-500" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black/40 border border-teal-900/50 rounded-2xl py-3.5 pl-12 pr-12 text-white placeholder-gray-600 focus:outline-none focus:border-teal-500 transition-all"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-teal-400 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-xs text-teal-300 font-bold ml-1 uppercase tracking-wider">পাসওয়ার্ড নিশ্চিত করুন</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-500" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black/40 border border-teal-900/50 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-teal-500 transition-all"
                  />
                </div>
              </div>

              {/* Referral Code */}
              <div className="space-y-2">
                <label className="text-xs text-teal-300 font-bold ml-1 uppercase tracking-wider">রেফারেল কোড (ঐচ্ছিক)</label>
                <div className="relative">
                  <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-500" size={18} />
                  <input 
                    type="text" 
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="যদি থাকে"
                    className="w-full bg-black/40 border border-teal-900/50 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-teal-500 transition-all"
                  />
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3 py-2">
                <button 
                  type="button"
                  onClick={() => setAgreed(!agreed)}
                  className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-all ${agreed ? 'bg-teal-500 border-teal-500' : 'border-teal-800 bg-black/40'}`}
                >
                  {agreed && <ShieldCheck size={14} className="text-white" />}
                </button>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  আমি নিশ্চিত করছি যে আমার বয়স ১৮+ এবং আমি <span className="text-teal-400 underline">শর্তাবলী ও গোপনীয়তা নীতি</span> মেনে চলছি।
                </p>
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={isLoading}
                className={`w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-black py-4 rounded-2xl shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                ) : (
                  <>
                    রেজিস্ট্রেশন করুন
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-8 flex items-center gap-4">
            <div className="h-px bg-white/10 flex-1"></div>
            <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">অথবা</span>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <button 
              type="button"
              onClick={handleGoogleRegister}
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
              onClick={handleFacebookRegister}
              className="bg-[#1877F2] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#166fe5] transition-all active:scale-95 shadow-xl"
            >
              <Facebook size={20} />
              Facebook
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              ইতিমধ্যে অ্যাকাউন্ট আছে? 
              <button 
                onClick={onBackToLogin}
                className="text-yellow-400 font-bold ml-2 hover:underline"
              >
                লগইন করুন
              </button>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Footer Info */}
      <div className="p-8 text-center space-y-4">
        <div className="flex justify-center gap-6 opacity-30">
          <img src="https://www.visa.com.bd/dam/VCOM/regional/ap/bangladesh/global-elements/images/visa-logo-800x450.jpg" alt="Visa" className="h-4 grayscale" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" alt="Mastercard" className="h-4 grayscale" />
          <div className="text-[10px] font-bold text-white border border-white px-1">18+</div>
        </div>
        <p className="text-[10px] text-gray-600 uppercase tracking-widest">© 2026 SPIN71 BET. ALL RIGHTS RESERVED.</p>
      </div>
    </div>
  );
}
