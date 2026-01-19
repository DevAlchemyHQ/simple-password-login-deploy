import React, { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { LoginScreen } from './components/LoginScreen';
import { MainLayout } from './components/layout/MainLayout';
import { FeedbackAdmin } from './pages/FeedbackAdmin';
import { UserProfile } from './components/profile/UserProfile';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useThemeStore } from './store/themeStore';

const App: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const isDark = useThemeStore((state) => state.isDark);

  // #region agent log
  // Capture any window.location changes
  useEffect(() => {
    const originalReload = window.location.reload.bind(window.location);
    (window.location as any).reload = function() {
      fetch('http://127.0.0.1:7242/ingest/15e638a0-fe86-4f03-83fe-b5c93b699a49',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App:WINDOW_RELOAD',message:'window.location.reload() called',data:{stack:new Error().stack?.split('\n').slice(0,5).join(' | '),hypothesisId:'C,F'},timestamp:Date.now(),sessionId:'debug-session'})}).catch(()=>{});
      return originalReload();
    };

    const originalBack = window.history.back.bind(window.history);
    window.history.back = function() {
      fetch('http://127.0.0.1:7242/ingest/15e638a0-fe86-4f03-83fe-b5c93b699a49',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App:HISTORY_BACK',message:'history.back() called',data:{stack:new Error().stack?.split('\n').slice(0,5).join(' | '),hypothesisId:'B,C'},timestamp:Date.now(),sessionId:'debug-session'})}).catch(()=>{});
      return originalBack();
    };

    return () => {
      window.location.reload = originalReload;
      window.history.back = originalBack;
    };
  }, []);
  // #endregion

  // Apply dark mode class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/feedback" 
          element={isAuthenticated ? <FeedbackAdmin /> : <Navigate to="/" replace />} 
        />
        <Route
          path="/profile"
          element={
            isAuthenticated ? (
              <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
                <MainLayout>
                  <UserProfile />
                </MainLayout>
              </div>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route 
          path="/" 
          element={isAuthenticated ? <MainLayout /> : <LoginScreen />} 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;