import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  ShieldCheck,
  Phone,
  KeyRound,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  ArrowRight,
  Edit2,
  Send,
  MessageSquare
} from 'lucide-react';

interface LoginModalProps {
  type: 'admin' | 'customer';
  onClose: () => void;
  onLoginSuccess: (data: any) => void;
}

export default function LoginModal({ type: initialType, onClose, onLoginSuccess }: LoginModalProps) {
  const [activeType, setActiveType] = useState<'customer' | 'admin'>(initialType);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Customer Phone & OTP states
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [otpStep, setOtpStep] = useState<'phone' | 'otp'>('phone');
  const [otpCode, setOtpCode] = useState('');
  const [otpPreviewMsg, setOtpPreviewMsg] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(30);

  // Admin PIN states
  const [adminPin, setAdminPin] = useState('');
  const [showAdminPin, setShowAdminPin] = useState(false);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval: any;
    if (otpStep === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpStep, resendTimer]);

  // Clean phone helper
  const getCleanPhone = (p: string) => p.replace(/[^0-9]/g, '').slice(-10);

  // Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = getCleanPhone(customerPhone);
    if (!clean || clean.length !== 10) {
      setError('कृपया सही 10-अंकों का मोबाइल नंबर दर्ज करें।');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setOtpPreviewMsg(null);

      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOtpStep('otp');
        setResendTimer(30);
        if (data.otpPreview) {
          setOtpPreviewMsg(`📩 Neeraj Store OTP: ${data.otpPreview}`);
          setOtpCode(data.otpPreview); // convenient prefill for testing
        }
      } else {
        setError(data.error || 'OTP भेजने में समस्या हुई। कृपया पुनः प्रयास करें।');
      }
    } catch (err: any) {
      setError(err.message || 'नेटवर्क त्रुटि। कृपया पुनः प्रयास करें।');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPhone = getCleanPhone(customerPhone);
    const cleanOtp = otpCode.trim();

    if (!cleanOtp) {
      setError('कृपया 4-अंकों का OTP दर्ज करें।');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          otp: cleanOtp,
          name: customerName.trim(),
          role: activeType === 'admin' ? 'admin' : 'customer'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.role === 'admin') {
          localStorage.setItem('admin_session_token', data.token);
          localStorage.setItem('admin_email', data.user.email);
        } else {
          localStorage.setItem('customer_session_token', data.token);
          localStorage.setItem('customer_session', JSON.stringify(data.user));
        }

        onLoginSuccess(data.user);
      } else {
        setError(data.error || 'गलत OTP! कृपया सही कोड दर्ज करें।');
      }
    } catch (err: any) {
      setError(err.message || 'सत्यापन विफल रहा।');
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Tap Fast Direct Phone Login
  const handleFastPhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = getCleanPhone(customerPhone);
    if (!clean || clean.length !== 10) {
      setError('कृपया 10-अंकों का मोबाइल नंबर दर्ज करें।');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const res = await fetch('/api/auth/phone-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: clean,
          name: customerName.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('customer_session_token', data.token);
        localStorage.setItem('customer_session', JSON.stringify(data.user));
        onLoginSuccess(data.user);
      } else {
        setError(data.error || 'लॉगिन विफल रहा।');
      }
    } catch (err: any) {
      setError(err.message || 'लॉगिन विफल रहा।');
    } finally {
      setIsLoading(false);
    }
  };

  // Admin PIN Login
  const handleAdminPinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPin.trim()) {
      setError('कृपया एडमिन सिक्योरिटी पिन दर्ज करें।');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const res = await fetch('/api/admin/auth-passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passcode: adminPin.trim(),
          email: 'dubeyavinash157@gmail.com'
        })
      });

      const data = await res.json();
      if (res.ok && data.authorized) {
        if (data.token) {
          localStorage.setItem('admin_session_token', data.token);
        }
        localStorage.setItem('admin_email', data.email);
        onLoginSuccess({
          role: 'admin',
          uid: 'admin_master',
          email: data.email,
          name: data.name
        });
      } else {
        setError(data.error || 'अमान्य एडमिन पिन!');
      }
    } catch (err: any) {
      setError(err.message || 'वेरिफिकेशन विफल रहा।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#141418] border border-white/15 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -z-10 translate-x-1/2 -translate-y-1/2"></div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#9CA3AF] hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-7">
          {/* Header */}
          <div className="flex flex-col items-center justify-center text-center mb-5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 border ${
                activeType === 'admin'
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                  : 'bg-primary/10 text-primary border-primary/20 shadow-[0_0_20px_rgba(255,107,0,0.2)]'
              }`}
            >
              {activeType === 'admin' ? <ShieldCheck className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {activeType === 'admin' ? 'Store Admin Portal' : 'Customer Account Login'}
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              {activeType === 'admin'
                ? 'Store owner console • Real-time sales & stock'
                : 'Mobile number se OTP login • Fast order tracking'}
            </p>
          </div>

          {/* Role Switcher Tabs */}
          <div className="flex bg-[#1c1c24] p-1 rounded-xl mb-4 border border-white/5">
            <button
              type="button"
              onClick={() => {
                setActiveType('customer');
                setError('');
                setOtpStep('phone');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeType === 'customer'
                  ? 'bg-primary text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Customer (OTP)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveType('admin');
                setError('');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeType === 'admin'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Store Owner PIN</span>
            </button>
          </div>

          {/* Simulated SMS banner for Instant Testing */}
          {otpPreviewMsg && (
            <div className="mb-3.5 p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-in slide-in-from-top-1">
              <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-mono font-semibold">{otpPreviewMsg}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-3.5 p-2.5 border border-red-500/30 bg-red-500/10 text-red-300 text-xs rounded-xl flex items-start gap-2 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* CUSTOMER PHONE / OTP FORM */}
          {/* ======================================================== */}
          {activeType === 'customer' && (
            <div>
              {otpStep === 'phone' ? (
                <form onSubmit={handleSendOtp} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                      Mobile Number (मोबाइल नंबर) <span className="text-primary">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 text-xs text-zinc-400 font-mono font-semibold border-r border-zinc-700 pr-2">
                        +91
                      </div>
                      <input
                        type="tel"
                        maxLength={10}
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="98765 43210"
                        className="w-full bg-[#1c1c22] border border-border-subtle focus:border-primary text-white text-xs pl-14 pr-3.5 py-2.5 rounded-xl outline-none font-mono tracking-wider"
                        autoFocus
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                      Your Name (आपका नाम - Optional)
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-[#1c1c22] border border-border-subtle focus:border-primary text-white text-xs px-3.5 py-2.5 rounded-xl outline-none"
                    />
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-primary hover:bg-[#ff7a1a] text-black font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending OTP...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Get 4-Digit OTP (ओटीपी पाएं)</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleFastPhoneLogin}
                      disabled={isLoading}
                      className="w-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white py-2 rounded-xl text-[11px] font-medium transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>⚡ 1-Tap Direct Login</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* OTP VERIFICATION STEP */
                <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                  <div className="flex items-center justify-between bg-[#1c1c24] p-2.5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-mono font-bold text-white">
                        +91 {getCleanPhone(customerPhone)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpStep('phone');
                        setError('');
                      }}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Change</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                      Enter 4-Digit OTP (ओटीपी दर्ज करें)
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="••••"
                      className="w-full bg-[#1c1c22] border border-border-subtle focus:border-primary text-white text-center text-lg tracking-[0.5em] py-2.5 rounded-xl outline-none font-mono font-bold"
                      autoFocus
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-[#ff7a1a] text-black font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify & Login (सत्यापित करें)</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-1">
                    {resendTimer > 0 ? (
                      <span className="text-[11px] text-zinc-500 font-mono">
                        Resend OTP in {resendTimer}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendOtp()}
                        className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                      >
                        Resend OTP (ओटीपी दोबारा भेजें)
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* STORE OWNER / ADMIN PIN FORM */}
          {/* ======================================================== */}
          {activeType === 'admin' && (
            <form onSubmit={handleAdminPinLogin} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Store Owner Security PIN / Passcode
                </label>
                <div className="relative">
                  <input
                    type={showAdminPin ? 'text' : 'password'}
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    placeholder="Enter Security PIN"
                    className="w-full bg-[#1c1c22] border border-border-subtle focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white font-mono text-xs px-3.5 py-2.5 rounded-xl outline-none tracking-wider pr-10"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPin(!showAdminPin)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-1 text-xs cursor-pointer"
                    title={showAdminPin ? 'Hide PIN' : 'Show PIN'}
                  >
                    {showAdminPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying PIN...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Authorize Admin Portal</span>
                  </>
                )}
              </button>

              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-200/80 leading-relaxed text-center">
                Owner Registered Mobile: <span className="font-mono text-white font-bold">+91 9935118811</span>
              </div>
            </form>
          )}

          <div className="pt-4 text-center text-[10px] text-[#A1A1AA]/50 font-mono uppercase tracking-widest">
            Neeraj General Store • Jalalpur Panwara
          </div>
        </div>
      </div>
    </div>
  );
}
