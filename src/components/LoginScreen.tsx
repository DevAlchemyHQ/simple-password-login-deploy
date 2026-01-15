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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-6">
      <div className="bg-gray-800/90 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-700 backdrop-blur-lg">
        <div className="flex justify-center mb-6">
          <span className="text-5xl">🪶</span>
        </div>
        <h1 className="text-3xl font-extrabold text-center mb-6 text-white tracking-wide">
          Welcome to <span className="text-indigo-400">Exametry</span>
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white pr-10 transition-all focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-gray-400"
              placeholder="Enter password"
                required
              autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-white transition"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-lg">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-500 text-white py-3 rounded-lg font-semibold hover:bg-indigo-600 transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
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

        <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
          <p className="text-sm text-gray-300 text-center">
            Need assistance or have suggestions? <br /> We'd love to hear from you.
          </p>
          <button
            onClick={handleEmailClick}
            className="mt-3 w-full flex items-center justify-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
          >
            <Mail size={18} />
            Email Support
          </button>
        </div>
      </div>
    </div>
  );
};