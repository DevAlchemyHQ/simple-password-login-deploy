import React, { useState, useRef, useEffect } from 'react';
import { Loader2, AlertCircle, ArrowLeft, RefreshCw, CheckCircle } from 'lucide-react';
import { cognitoConfirmSignUp, cognitoResendCode, cognitoConfirmResetPassword } from '../../lib/cognito';
import { useAuthStore } from '../../store/authStore';

interface OTPVerificationProps {
  email: string;
  purpose: 'signup' | 'reset';
  onSuccess: () => void;
  onCancel: () => void;
}

export const OTPVerification: React.FC<OTPVerificationProps> = ({
  email,
  purpose,
  onSuccess,
  onCancel
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(60);
  const [showPasswordFields, setShowPasswordFields] = useState(purpose === 'reset');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }

    // Start resend timer
    startResendTimer();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startResendTimer = () => {
    setResendTimer(60);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOTP = async () => {
    try {
      setIsResending(true);
      setError(null);
      setMessage(null);

      const result = await cognitoResendCode(email);

      if (result.success) {
        setMessage('New verification code sent to your email.');
        startResendTimer();
      } else if (result.error) {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    if (!/^\d*$/.test(value)) return; // Only allow numbers

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input if value is entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace if current input is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const validatePassword = () => {
    if (purpose !== 'reset') return true;

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Please enter both password fields');
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);

    if (!(hasUpperCase && hasLowerCase && hasNumbers)) {
      setError('Password must contain uppercase, lowercase, and numbers');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    if (!validatePassword()) return;

    setIsLoading(true);

    try {
      if (purpose === 'signup') {
        const result = await cognitoConfirmSignUp(email, otpString);

        if (result.success) {
          setMessage('Email verified successfully! You can now sign in.');
          setTimeout(() => {
            onSuccess();
          }, 1500);
        } else if (result.error) {
          const errorCode = result.error.code;
          if (errorCode === 'CodeMismatchException') {
            setError('Invalid verification code. Please try again.');
          } else if (errorCode === 'ExpiredCodeException') {
            setError('Verification code has expired. Please request a new one.');
          } else {
            setError(result.error.message);
          }
          setOtp(['', '', '', '', '', '']);
          if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
          }
        }
      } else {
        const result = await cognitoConfirmResetPassword(email, otpString, newPassword);

        if (result.success) {
          setMessage('Password reset successful! You can now sign in.');
          setTimeout(() => {
            onSuccess();
          }, 1500);
        } else if (result.error) {
          const errorCode = result.error.code;
          if (errorCode === 'CodeMismatchException') {
            setError('Invalid verification code. Please try again.');
          } else if (errorCode === 'ExpiredCodeException') {
            setError('Verification code has expired. Please request a new one.');
          } else if (errorCode === 'InvalidPasswordException') {
            setError('Password does not meet requirements.');
          } else {
            setError(result.error.message);
          }
          setOtp(['', '', '', '', '', '']);
          if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
          }
        }
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError('An unexpected error occurred');
      setOtp(['', '', '', '', '', '']);
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-6">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <button
              onClick={onCancel}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition mb-6"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm">Back</span>
            </button>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {purpose === 'signup' ? 'Verify Your Email' : 'Reset Your Password'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {purpose === 'signup'
                ? `We sent a verification code to ${email}. Please enter it below.`
                : `Enter the verification code sent to ${email} and choose a new password.`}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Verification Code
              </label>
              <div className="flex justify-between gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => inputRefs.current[index] = el}
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-xl font-bold border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    autoComplete="one-time-code"
                  />
                ))}
              </div>
            </div>

            {purpose === 'reset' && showPasswordFields && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError(null);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                    minLength={8}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Must be 8+ characters with uppercase, lowercase, and numbers
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError(null);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {message && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{message}</p>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <button
                type="submit"
                disabled={isLoading || otp.some(d => !d)}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>{purpose === 'signup' ? 'Verify Email' : 'Reset Password'}</span>
                )}
              </button>

              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendTimer > 0 || isResending}
                  className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Resending...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      <span>
                        {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};