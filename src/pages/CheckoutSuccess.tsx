import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProfileStore } from '../store/profileStore';

export const CheckoutSuccess: React.FC = () => {
  const navigate = useNavigate();
  const { fetchProfile } = useProfileStore();
  const [isRefreshing, setIsRefreshing] = useState(true);

  useEffect(() => {
    // Give Stripe webhook a moment to process, then refresh profile
    const refreshProfile = async () => {
      // Wait 2 seconds for webhook to process
      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
        await fetchProfile();
      } catch (error) {
        console.error('Failed to refresh profile:', error);
      } finally {
        setIsRefreshing(false);
      }
    };

    refreshProfile();
  }, [fetchProfile]);

  const handleContinue = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-neutral-900 dark:to-neutral-800 p-6">
      <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-2xl shadow-xl p-8 border border-neutral-200 dark:border-neutral-800">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
            <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-3">
              Welcome to Pro!
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 text-lg">
              Your subscription has been activated successfully.
            </p>
          </div>

          {isRefreshing ? (
            <div className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-center gap-3 text-blue-900 dark:text-blue-200">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm">Activating your account...</span>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 dark:text-green-200 mb-2">
                  What's included:
                </h3>
                <ul className="space-y-2 text-sm text-green-800 dark:text-green-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="flex-shrink-0" />
                    <span>Unlimited downloads</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="flex-shrink-0" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="flex-shrink-0" />
                    <span>Early access to new features</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={handleContinue}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Start using Pro
                <ArrowRight size={18} />
              </button>

              <p className="text-xs text-center text-neutral-500 dark:text-neutral-500">
                You can manage your subscription anytime from your profile
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
