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
  useEffect(() => {
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      fetch('http://127.0.0.1:7242/ingest/15e638a0-fe86-4f03-83fe-b5c93b699a49',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:11',message:'Global keydown event',data:{key:e.key,targetTag:target.tagName,targetType:(target as HTMLInputElement).type,defaultPrevented:e.defaultPrevented,propagationStopped:e.cancelBubble},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2,H5'})}).catch(()=>{});
    };
    
    document.addEventListener('keydown', handleGlobalKeydown, true);
    return () => document.removeEventListener('keydown', handleGlobalKeydown, true);
  }, []);
  // #endregion

  // Apply dark mode class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // #region agent log
    const overlays = document.querySelectorAll('[class*="fixed"][class*="inset"], [class*="absolute"][class*="inset"]');
    const overlayInfo = Array.from(overlays).map(el => ({className: el.className, zIndex: window.getComputedStyle(el).zIndex}));
    fetch('http://127.0.0.1:7242/ingest/15e638a0-fe86-4f03-83fe-b5c93b699a49',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:15',message:'App mounted - checking overlays',data:{overlaysCount:overlays.length,overlayInfo:overlayInfo.slice(0,5)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
    // #endregion
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