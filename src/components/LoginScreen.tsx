import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2, AlertCircle, Mail } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useMetadataStore } from "../store/metadataStore";

const SUPPORT_EMAIL = 'infor@exametry.xyz';
const SIMPLE_PASSWORD = 'Exametry55';

export const LoginScreen: React.FC = () => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((state) => state.setAuth);
  const loadUserData = useMetadataStore((state) => state.loadUserData);

  // Auto-login if already authenticated
  useEffect(() => {
    const isAuth = localStorage.getItem('isAuthenticated');
    if (isAuth === 'true') {
      setAuth(true);
      loadUserData();
    }
  }, [setAuth, loadUserData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    setIsLoading(true);

    // Small delay for UX
    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      if (password === SIMPLE_PASSWORD) {
        localStorage.setItem('isAuthenticated', 'true');
        await loadUserData();
          setAuth(true);
      } else {
        setError('Incorrect password');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailClick = () => {
    window.location.href = `mailto:${SUPPORT_EMAIL}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-6">
      <div className="bg-white dark:bg-neutral-900 p-10 rounded-2xl shadow-large w-full max-w-md border border-neutral-200 dark:border-neutral-800">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-accent flex items-center justify-center">
            <span className="text-white text-2xl font-bold">E</span>
          </div>
        </div>
        
        <h1 className="text-2xl font-semibold text-center mb-2 text-neutral-900 dark:text-neutral-100">
          Welcome to Exametry
        </h1>
        <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 mb-8">
          Sign in to continue
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 pr-10 transition-all focus:ring-2 focus:ring-accent focus:border-transparent outline-none placeholder-neutral-400 dark:placeholder-neutral-500 text-sm"
              placeholder="Enter password"
              required
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-900/50">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-accent text-white py-3 rounded-lg font-medium hover:bg-accent-dark transition-colors flex items-center justify-center gap-2 shadow-soft disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center mb-3">
            Need assistance or have suggestions? We'd love to hear from you.
          </p>
          <button
            onClick={handleEmailClick}
            className="w-full flex items-center justify-center gap-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-4 py-2.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-sm font-medium"
          >
            <Mail size={16} />
            Email Support
          </button>
        </div>
      </div>
    </div>
  );
};