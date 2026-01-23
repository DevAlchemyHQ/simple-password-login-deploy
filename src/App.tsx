import React, { useEffect, Suspense, lazy } from 'react';
import { useAuthStore } from './store/authStore';
import { LoginScreen } from './components/LoginScreen';
import { MainLayout } from './components/layout/MainLayout';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useThemeStore } from './store/themeStore';
import { ToastContainer } from './components/ui/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy load non-critical routes
const FeedbackAdmin = lazy(() => import('./pages/FeedbackAdmin').then(m => ({ default: m.FeedbackAdmin })));
const UserProfile = lazy(() => import('./components/profile/UserProfile').then(m => ({ default: m.UserProfile })));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
    <div className="w-8 h-8 border-2 border-neutral-300 dark:border-neutral-600 border-t-neutral-900 dark:border-t-neutral-100 rounded-full animate-spin" />
  </div>
);

const App: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isDark = useThemeStore((state) => state.isDark);

  // Apply dark mode class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastContainer />
        <Routes>
          <Route
            path="/feedback"
            element={isAuthenticated ? (
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <FeedbackAdmin />
                </Suspense>
              </ErrorBoundary>
            ) : <Navigate to="/" replace />}
          />
          <Route
            path="/profile"
            element={
              isAuthenticated ? (
                <div className="min-h-screen bg-white dark:bg-neutral-950">
                  <MainLayout>
                    <ErrorBoundary>
                      <Suspense fallback={<PageLoader />}>
                        <UserProfile />
                      </Suspense>
                    </ErrorBoundary>
                  </MainLayout>
                </div>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/"
            element={isAuthenticated ? (
              <ErrorBoundary>
                <MainLayout />
              </ErrorBoundary>
            ) : <LoginScreen />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;