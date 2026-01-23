import React, { useEffect, useState } from 'react';
import { Users, Download, TrendingUp, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { getAdminMetrics, AdminMetricsResponse } from '../lib/api';

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminMetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await getAdminMetrics();

      if (result.success && result.data) {
        setMetrics(result.data);
        setLastUpdate(new Date());
      } else {
        setError(result.error || 'Failed to fetch metrics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (isLoading && !metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">Loading metrics...</p>
        </div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950 p-6">
        <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-xl shadow-xl p-8 border border-neutral-200 dark:border-neutral-800">
          <div className="flex flex-col items-center text-center space-y-4">
            <AlertCircle className="w-16 h-16 text-red-600 dark:text-red-400" />
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                Error Loading Metrics
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400">{error}</p>
            </div>
            <button
              onClick={fetchMetrics}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <RefreshCw size={18} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={fetchMetrics}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* User Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Total Users
              </span>
            </div>
            <p className="text-3xl font-bold text-neutral-900 dark:text-white">
              {metrics.users.total}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Users size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Free Users
              </span>
            </div>
            <p className="text-3xl font-bold text-neutral-900 dark:text-white">
              {metrics.users.free}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Users size={20} className="text-yellow-600 dark:text-yellow-400" />
              </div>
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Pro Users
              </span>
            </div>
            <p className="text-3xl font-bold text-neutral-900 dark:text-white">
              {metrics.users.active}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TrendingUp size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Conversion Rate
              </span>
            </div>
            <p className="text-3xl font-bold text-neutral-900 dark:text-white">
              {metrics.users.conversionRate}
            </p>
          </div>
        </div>

        {/* Downloads & Revenue */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <Download size={20} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Downloads
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Total</span>
                  <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {metrics.downloads.total}
                  </span>
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-500">
                  Period: {metrics.downloads.period}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Free</div>
                  <div className="text-xl font-semibold text-neutral-900 dark:text-white">
                    {metrics.downloads.free}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Pro</div>
                  <div className="text-xl font-semibold text-neutral-900 dark:text-white">
                    {metrics.downloads.paid}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Revenue
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                  Monthly Recurring Revenue
                </div>
                <div className="text-3xl font-bold text-neutral-900 dark:text-white">
                  {metrics.revenue.currency === 'gbp' ? '£' : '$'}
                  {(metrics.revenue.mrr / 100).toFixed(2)}
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                  Active Subscriptions
                </div>
                <div className="text-2xl font-semibold text-neutral-900 dark:text-white">
                  {metrics.revenue.activeSubscriptions}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {metrics.alerts.failedPayments > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-200 mb-1">
                  Failed Payments
                </h3>
                <p className="text-sm text-red-800 dark:text-red-300">
                  {metrics.alerts.failedPayments} payment{metrics.alerts.failedPayments !== 1 ? 's' : ''} failed.
                  Check Stripe dashboard for details.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            <p className="mb-2">
              <strong>Data Source:</strong> Real-time from DynamoDB and Stripe
            </p>
            <p>
              <strong>Last Synced:</strong> {new Date(metrics.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
