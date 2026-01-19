import React, { useState } from 'react';
import { LogOut, Info } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { signOut } from '../lib/supabase';

const PROFILE_EMOJI = '🚂';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const getFormattedDate = () => {
  const now = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const dayName = days[now.getDay()];
  const day = now.getDate();
  const month = months[now.getMonth()];
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  
  return `${dayName} ${day} ${month}    ${hours}:${minutes}`;
};

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  const { logout } = useAuthStore();
  const { isDark } = useThemeStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showBetaInfo, setShowBetaInfo] = useState(false);
  const [currentTime, setCurrentTime] = useState(getFormattedDate());

  const handleLogout = async () => {
    try {
      setShowProfileMenu(false);
      await signOut();
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Update time every minute
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getFormattedDate());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close profile menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.profile-menu') && !target.closest('.profile-button')) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tabs = [
    { id: 'images', label: 'Images' },
    { id: 'calculator', label: 'Calc' },
    { id: 'browser', label: 'Browser' },
    { id: 'pdf', label: 'FAQ' }
  ];

  return (
    <>
      <header className="bg-slate-900 dark:bg-gray-900 shadow-md">
        <div className="max-w-[1920px] mx-auto px-4">
          <div className="h-16 flex items-center justify-between gap-8">
            {/* Left: Greeting */}
            <div className="flex items-center gap-3 min-w-fit">
              <span className="text-white font-medium whitespace-nowrap">
                {getGreeting()}, Test! 😊
              </span>
            </div>

            {/* Center: Navigation Tabs */}
            <nav className="flex items-center gap-1 flex-1 justify-center">
              {tabs.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => onTabChange(id)}
                  className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                    activeTab === id
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>

            {/* Right: Date, Premium, Beta, Version, Profile */}
            <div className="flex items-center gap-4 min-w-fit">
              <span className="text-gray-300 text-sm whitespace-nowrap">
                {currentTime}
              </span>
              
              <span className="text-gray-400 text-xs">UK</span>

              <button className="px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded hover:bg-purple-700 transition-colors">
                👑 Premium
              </button>

              <button
                onClick={() => setShowBetaInfo(true)}
                className="text-xs font-medium px-2 py-1 bg-indigo-900/50 text-indigo-400 rounded-full hover:bg-indigo-900/70 transition-colors flex items-center gap-1"
              >
                <Info size={12} />
                BETA
              </button>

              <div className="flex items-center gap-1 px-2 py-1 bg-slate-800 rounded text-xs text-gray-300">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                <span>v1.1.1</span>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="profile-button w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center text-lg hover:bg-indigo-600 transition overflow-hidden"
                >
                  {PROFILE_EMOJI}
                </button>

                {showProfileMenu && (
                  <div className="profile-menu absolute right-0 top-12 w-48 bg-gray-800/95 rounded-lg shadow-xl border border-gray-700 backdrop-blur-lg z-50">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-900/20 flex items-center gap-2 rounded-lg"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {showBetaInfo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                Beta Version
              </h3>
            </div>
            <p className="text-slate-600 dark:text-gray-300 mb-6">
              Some features may be incomplete or have occasional glitches. We value your
              feedback and patience!
            </p>
            <button
              onClick={() => setShowBetaInfo(false)}
              className="w-full px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};