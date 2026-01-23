import React, { useState, useEffect } from 'react';
import { Download, AlertCircle, Loader2, CheckCircle, Crown, X } from 'lucide-react';
import { useMetadataStore } from '../store/metadataStore';
import { useValidation } from '../hooks/useValidation';
import { useAnalytics } from '../hooks/useAnalytics';
import { validateDescription } from '../utils/fileValidation';
import { handleSingleSelectDownload, handleBatchDragDownload } from '../utils/downloadUtils';
import { checkDownloadQuota, createCheckoutSession } from '../lib/api';

export const DownloadButton: React.FC = () => {
  const { images, selectedImages, formData, bulkDefects } = useMetadataStore();
  const { isValid, getValidationErrors } = useValidation();
  const { trackEvent } = useAnalytics();
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Download quota state
  const [quotaInfo, setQuotaInfo] = useState<{
    canDownload: boolean;
    remaining: number;
    needsSubscription: boolean;
    subscriptionStatus: 'free' | 'active' | 'canceling';
  } | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isCheckingQuota, setIsCheckingQuota] = useState(false);
  const [isRedirectingToCheckout, setIsRedirectingToCheckout] = useState(false);

  // Automatically detect mode based on whether tiles exist
  const isBatchMode = bulkDefects.length > 0;

  // ============================================
  // QUOTA CHECKING - Check on mount and when validation becomes valid
  // ============================================
  useEffect(() => {
    const fetchQuota = async () => {
      setIsCheckingQuota(true);
      const result = await checkDownloadQuota();
      if (result.success && result.data) {
        setQuotaInfo(result.data);
      }
      setIsCheckingQuota(false);
    };

    // Only fetch if form is valid (user is ready to download)
    if (isValid()) {
      fetchQuota();
    }
  }, [isValid]);

  // ============================================
  // SINGLE SELECT MODE - Special Characters Check
  // ============================================
  const hasSpecialCharactersSingleSelect = React.useMemo(() => {
    if (isBatchMode) return false;
    const selectedImagesList = images.filter(img => selectedImages.has(img.id));
    return selectedImagesList.some(img => !validateDescription(img.description || '').isValid);
  }, [isBatchMode, images, selectedImages]);

  // ============================================
  // BATCH DRAG MODE - Special Characters Check
  // ============================================
  const hasSpecialCharactersBatchDrag = React.useMemo(() => {
    if (!isBatchMode) return false;
    const defectsWithImages = bulkDefects.filter(defect => defect.selectedFile);
    return defectsWithImages.some(defect =>
      !validateDescription(defect.description || '').isValid
    );
  }, [isBatchMode, bulkDefects]);

  // ============================================
  // DOWNLOAD HANDLER - Routes to appropriate mode with quota check
  // ============================================
  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setError(null);
      setSuccessMessage(null);

      // Check download quota first
      const quotaResult = await checkDownloadQuota();
      if (!quotaResult.success) {
        throw new Error(quotaResult.error || 'Failed to check download quota');
      }

      const quota = quotaResult.data!;
      setQuotaInfo(quota);

      // If user can't download, show upgrade modal
      if (!quota.canDownload) {
        setShowUpgradeModal(true);
        setIsDownloading(false);
        return;
      }

      let result;
      if (isBatchMode) {
        // BATCH DRAG MODE DOWNLOAD - when tiles exist
        result = await handleBatchDragDownload(
          images,
          bulkDefects,
          formData,
          trackEvent
        );
      } else {
        // SINGLE SELECT MODE DOWNLOAD - when no tiles exist
        result = await handleSingleSelectDownload(
          images,
          selectedImages,
          formData,
          trackEvent
        );
      }

      // Show success message
      setSuccessMessage(result.message);

      // Refresh quota after successful download
      const newQuotaResult = await checkDownloadQuota();
      if (newQuotaResult.success && newQuotaResult.data) {
        setQuotaInfo(newQuotaResult.data);
      }

      // Auto-clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (error) {
      console.error('Error creating download package:', error);
      setError(error instanceof Error ? error.message : 'Failed to create download package');
    } finally {
      setIsDownloading(false);
    }
  };

  // ============================================
  // UPGRADE HANDLER - Redirect to Stripe Checkout
  // ============================================
  const handleUpgrade = async () => {
    try {
      setIsRedirectingToCheckout(true);
      const result = await createCheckoutSession();

      if (result.success && result.data) {
        // Redirect to Stripe Checkout
        window.location.href = result.data.url;
      } else {
        throw new Error(result.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert(error instanceof Error ? error.message : 'Failed to start checkout');
      setIsRedirectingToCheckout(false);
    }
  };

  // ============================================
  // UI STATE
  // ============================================
  const errors = getValidationErrors();
  const hasSpecialCharacters = isBatchMode
    ? hasSpecialCharactersBatchDrag
    : hasSpecialCharactersSingleSelect;
  const isDownloadDisabled = !isValid() || isDownloading || hasSpecialCharacters || isCheckingQuota;

  // Button text based on mode
  const buttonText = isBatchMode
    ? (isDownloading ? 'Creating Batch Package...' : 'Download Batch Package')
    : (isDownloading ? 'Creating Package...' : 'Download Package');

  // Get remaining downloads display
  const getRemainingDisplay = () => {
    if (!quotaInfo) return null;
    if (quotaInfo.subscriptionStatus === 'active') return 'Unlimited downloads';
    return `${quotaInfo.remaining} download${quotaInfo.remaining !== 1 ? 's' : ''} remaining`;
  };

  return (
    <>
      <div className="space-y-2">
        {/* Quota Info */}
        {quotaInfo && isValid() && (
          <div className="text-xs text-center text-neutral-600 dark:text-neutral-400">
            {getRemainingDisplay()}
          </div>
        )}

        <button
          onClick={handleDownload}
          disabled={isDownloadDisabled}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all font-medium text-sm ${
            isDownloadDisabled
              ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700 shadow-soft hover:shadow-medium active:scale-[0.98]'
          }`}
        >
          {isDownloading || isCheckingQuota ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Download size={18} />
          )}
          {buttonText}
        </button>

        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg p-3">
            <div className="flex items-start gap-2 text-green-700 dark:text-green-400">
              <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
              <p className="text-sm">{successMessage}</p>
            </div>
          </div>
        )}

        {(error || (!isValid() && errors.length > 0) || hasSpecialCharacters) && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg p-3">
            <div className="flex items-start gap-2 text-amber-700 dark:text-amber-400">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                {error ? (
                  <p>{error}</p>
                ) : hasSpecialCharacters ? (
                  <p>Remove special characters from defect descriptions before downloading</p>
                ) : (
                  <>
                    <p className="font-medium mb-1">Please complete the following:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && quotaInfo && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-large max-w-lg w-full p-6 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Crown className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                  Upgrade to Pro
                </h3>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
                disabled={isRedirectingToCheckout}
              >
                <X size={20} className="text-neutral-600 dark:text-neutral-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  You've used all {3 - quotaInfo.remaining} of your free downloads. Upgrade to Pro for unlimited downloads!
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Pro Features:</h4>
                <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400" />
                    <span>Unlimited downloads</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400" />
                    <span>Early access to new features</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400" />
                    <span>Cancel anytime</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <div className="flex items-baseline justify-between mb-4">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Monthly subscription</span>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">£9.99</span>
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">/month</span>
                  </div>
                </div>

                <button
                  onClick={handleUpgrade}
                  disabled={isRedirectingToCheckout}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRedirectingToCheckout ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Redirecting to checkout...
                    </>
                  ) : (
                    <>
                      <Crown size={18} />
                      Upgrade to Pro
                    </>
                  )}
                </button>

                <p className="text-xs text-center text-neutral-500 dark:text-neutral-500 mt-3">
                  Secure payment powered by Stripe
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
