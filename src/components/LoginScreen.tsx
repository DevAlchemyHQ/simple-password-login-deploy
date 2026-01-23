import React, { useState, useEffect, useRef, useCallback } from "react";
import { Eye, EyeOff, Loader2, AlertCircle, Mail, Heart, ChevronDown } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useMetadataStore } from "../store/metadataStore";
import { DONATION_TIERS } from "../utils/donationConfig";
import { useClickOutside } from "../hooks/useClickOutside";

const SUPPORT_EMAIL = 'infor@exametry.xyz';
const SIMPLE_PASSWORD = 'Exametry55';

export const LoginScreen: React.FC = () => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDonateMenu, setShowDonateMenu] = useState(false);
  const donateMenuRef = useRef<HTMLDivElement>(null);
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

  // Close donate menu when clicking outside
  const closeDonateMenu = useCallback(() => setShowDonateMenu(false), []);
  useClickOutside(donateMenuRef, closeDonateMenu, showDonateMenu);

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
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Premium gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 dark:from-black dark:via-neutral-950 dark:to-black" />
      
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }} />
      
      {/* Main card with premium styling */}
      <div className="relative bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl p-12 pb-16 rounded-3xl shadow-2xl w-full max-w-md border border-neutral-200/50 dark:border-neutral-800/50 transform transition-all duration-300 hover:shadow-3xl">
        {/* Logo with premium styling */}
        <div className="flex justify-center mb-10">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-neutral-800 dark:from-neutral-800 dark:to-neutral-900 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 dark:from-neutral-800 dark:via-neutral-900 dark:to-neutral-800 flex items-center justify-center shadow-2xl border border-neutral-700/50 dark:border-neutral-700/30 transform transition-all duration-300 group-hover:scale-105">
              <span className="text-white text-3xl font-bold tracking-tight">E</span>
            </div>
          </div>
        </div>
        
        {/* Typography with better hierarchy */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3 text-neutral-900 dark:text-neutral-100 tracking-tight">
            Welcome to Exametry
          </h1>
          <p className="text-base text-neutral-500 dark:text-neutral-400 font-medium">
            Sign in to continue
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Premium input styling */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-100 to-transparent dark:from-neutral-800/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                className="w-full px-5 py-4 border-2 border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100 pr-12 transition-all duration-200 focus:ring-0 focus:border-neutral-900 dark:focus:border-neutral-100 focus:shadow-lg outline-none placeholder-neutral-400 dark:placeholder-neutral-500 text-base font-medium backdrop-blur-sm"
                placeholder="Enter password"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-all duration-200 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700/50"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm p-4 rounded-xl border border-red-200/50 dark:border-red-900/30 animate-in slide-in-from-top-2">
              <AlertCircle size={18} className="flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* Premium button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 bg-gradient-to-r from-neutral-900 to-neutral-800 dark:from-neutral-800 dark:to-neutral-900 text-white py-3 rounded-xl font-semibold hover:from-neutral-800 hover:to-neutral-700 dark:hover:from-neutral-700 dark:hover:to-neutral-800 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm transform hover:scale-[1.02] active:scale-[0.98] border border-neutral-700/20 dark:border-neutral-700/30"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </div>
        </form>

        {/* Support Exametry Dropdown */}
        <div className="mt-4 text-center">
          <div className="relative inline-block" ref={donateMenuRef}>
            <button
              onClick={() => setShowDonateMenu(!showDonateMenu)}
              className="inline-flex items-center gap-2 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors text-sm font-medium"
            >
              <Heart size={16} className="text-red-500 dark:text-red-400" />
              <span>Support Exametry</span>
              <ChevronDown size={16} className={`transition-transform ${showDonateMenu ? 'rotate-180' : ''}`} />
            </button>

            {showDonateMenu && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white dark:bg-neutral-900 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden z-50 min-w-[280px]">
                <div className="p-2">
                  {DONATION_TIERS.map((tier, index) => (
                    <a
                      key={index}
                      href={tier.stripeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowDonateMenu(false)}
                      className="block px-4 py-2.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
                            {tier.label}
                          </div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                            {tier.description}
                          </div>
                        </div>
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                          {tier.amount}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Email icon at bottom left */}
        <button
          onClick={handleEmailClick}
          className="absolute bottom-6 left-6 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors p-2 rounded-lg hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50"
          aria-label="Email Support"
        >
          <Mail size={20} />
        </button>
      </div>
    </div>
  );
};