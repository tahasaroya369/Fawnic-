import React, { useState, useEffect } from 'react';
import { Mail, KeyRound, Lock, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, X, Eye, EyeOff } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  onSuccessRedirectToLogin: () => void;
}

type Step = 'email' | 'verify' | 'new-password' | 'success';

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
  onSuccessRedirectToLogin,
}) => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialEmail) setEmail(initialEmail);
      setErrorMsg(null);
      setInfoMsg(null);
    } else {
      // Reset state when closed
      setStep('email');
      setCode('');
      setResetToken('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg(null);
      setInfoMsg(null);
    }
  }, [isOpen, initialEmail]);

  // Countdown timer for resend
  useEffect(() => {
    let timer: any;
    if (step === 'verify' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, countdown]);

  if (!isOpen) return null;

  // Step 1: Send Code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please provide a valid email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/forgot-password/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.success) {
        setStep('verify');
        setCountdown(60);
        setCanResend(false);
        setInfoMsg(data.message || 'Verification code sent to your registered email address.');
      } else {
        setErrorMsg(data.error || 'No account registered with this email address.');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Network connection failed. Please try again.');
    }
  };

  // Step 2: Verify Code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const cleanCode = code.trim();
    if (!cleanCode || cleanCode.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/forgot-password/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: cleanCode,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.success && data.resetToken) {
        setResetToken(data.resetToken);
        setStep('new-password');
        setInfoMsg(data.message || 'Code verified successfully.');
      } else {
        setErrorMsg(data.error || 'Invalid or expired verification code.');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Verification failed. Please check network.');
    }
  };

  // Resend Code
  const handleResend = async () => {
    if (!canResend || loading) return;
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      setLoading(true);
      const res = await fetch('/api/auth/forgot-password/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.success) {
        setCountdown(60);
        setCanResend(false);
        setInfoMsg('A fresh verification code has been dispatched.');
      } else {
        setErrorMsg(data.error || 'Could not resend code. Please try again.');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg('Failed to resend verification code.');
    }
  };

  // Step 3: Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters in length.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-type carefully.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/forgot-password/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          resetToken,
          newPassword,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.success) {
        setStep('success');
      } else {
        setErrorMsg(data.error || 'Failed to update password. Session may have expired.');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg('Failed to update password. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-stone-50 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step Indicator */}
        {step !== 'success' && (
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="flex-1 flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  step === 'email'
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {step !== 'email' ? '✓' : '1'}
              </div>
              <div
                className={`h-1 flex-1 rounded-full ${
                  step !== 'email' ? 'bg-emerald-600' : 'bg-stone-200 dark:bg-stone-800'
                }`}
              />
            </div>

            <div className="flex-1 flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  step === 'verify'
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                    : step === 'new-password'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-200 dark:bg-stone-800 text-stone-500'
                }`}
              >
                {step === 'new-password' ? '✓' : '2'}
              </div>
              <div
                className={`h-1 flex-1 rounded-full ${
                  step === 'new-password' ? 'bg-emerald-600' : 'bg-stone-200 dark:bg-stone-800'
                }`}
              />
            </div>

            <div className="flex items-center">
              <div
                className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  step === 'new-password'
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                    : 'bg-stone-200 dark:bg-stone-800 text-stone-500'
                }`}
              >
                3
              </div>
            </div>
          </div>
        )}

        {/* Error / Info messages */}
        {errorMsg && (
          <div className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-400 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && !errorMsg && (
          <div className="mb-5 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* STEP 1: ENTER EMAIL */}
        {step === 'email' && (
          <div className="space-y-5">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center mx-auto text-stone-900 dark:text-stone-100 shadow-xs mb-3">
                <Mail className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold font-serif text-stone-950 dark:text-stone-50">
                Forgot your password?
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed max-w-xs mx-auto">
                Enter your registered email address and we'll send you a 6-digit verification code.
              </p>
            </div>

            <form onSubmit={handleSendCode} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Registered Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    required
                    className="w-full pl-10 pr-3.5 py-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:border-stone-900 dark:focus:border-stone-400 shadow-2xs text-xs"
                  />
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-950 font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Account...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: VERIFY CODE */}
        {step === 'verify' && (
          <div className="space-y-5">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center mx-auto text-stone-900 dark:text-stone-100 shadow-xs mb-3">
                <KeyRound className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold font-serif text-stone-950 dark:text-stone-50">
                Verify your email
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                We sent a 6-digit code to <strong className="text-stone-900 dark:text-stone-100">{email}</strong>
              </p>
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1.5 text-center">
                  6-Digit Verification Code
                </label>
                <div className="relative max-w-[240px] mx-auto">
                  <input
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="123456"
                    required
                    autoFocus
                    className="w-full text-center tracking-[0.5em] text-lg font-mono font-bold py-3 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:border-stone-900 dark:focus:border-stone-400 shadow-2xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-950 font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-xs text-stone-500 dark:text-stone-400 space-y-1">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="text-stone-900 dark:text-stone-100 font-bold hover:underline cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Resend Code</span>
                  </button>
                ) : (
                  <p>
                    Didn't receive code? Resend in <span className="font-mono font-bold text-stone-900 dark:text-stone-100">{countdown}s</span>
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 text-[11px] block mx-auto underline cursor-pointer"
                >
                  Change email address
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: NEW PASSWORD */}
        {step === 'new-password' && (
          <div className="space-y-5">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center mx-auto text-stone-900 dark:text-stone-100 shadow-xs mb-3">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold font-serif text-stone-950 dark:text-stone-50">
                Create a new password
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Choose a secure password for your FAWNIC account.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  New Password (min 6 characters)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:border-stone-900 dark:focus:border-stone-400 shadow-2xs"
                  />
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:border-stone-900 dark:focus:border-stone-400 shadow-2xs"
                  />
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-stone-100 dark:bg-stone-800/60 rounded-xl text-[11px] text-stone-500 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className={newPassword.length >= 6 ? 'text-emerald-600 font-bold' : 'text-stone-400'}>
                    {newPassword.length >= 6 ? '✓' : '•'} Minimum 6 characters
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={
                      newPassword && newPassword === confirmPassword ? 'text-emerald-600 font-bold' : 'text-stone-400'
                    }
                  >
                    {newPassword && newPassword === confirmPassword ? '✓' : '•'} Passwords match
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-950 font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Update Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* STEP 4: SUCCESS */}
        {step === 'success' && (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold font-serif text-stone-950 dark:text-stone-50">
              Password Updated Successfully
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto leading-relaxed">
              Your password has been changed. You can now log into your account with your new credentials.
            </p>
            <button
              onClick={() => {
                onClose();
                onSuccessRedirectToLogin();
              }}
              className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-950 font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Sign In Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
