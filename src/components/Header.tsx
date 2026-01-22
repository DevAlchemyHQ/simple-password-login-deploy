import React, { useState } from 'react';
import { LogOut, Info, Sun, Moon, Heart, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { signOut } from '../lib/supabase';
import { DONATION_TIERS } from '../utils/donationConfig';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 19) return 'Good afternoon';
  return 'Good evening';
};

const getFormattedDate = () => {
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const dayName = days[now.getDay()];
  const day = now.getDate();
  const month = months[now.getMonth()];
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  
  return `${dayName}, ${day} ${month} · ${hours}:${minutes}`;
};

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  const { logout } = useAuthStore();
  const { isDark, toggle } = useThemeStore();
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
    { id: 'images', label: 'Photos' },
    { id: 'pdf', label: 'PDF' },
    { id: 'calculator', label: 'Tools' },
    { id: 'browser', label: 'Maps' }
  ];

  return (
    <>
      <header className="bg-black dark:bg-black">
        <div className="max-w-[1920px] mx-auto px-6">
          <div className="h-14 flex items-center justify-between gap-8">
            {/* Left: Logo/Brand */}
            <div className="min-w-fit flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-black dark:bg-neutral-800 flex items-center justify-center">
                <span className="text-white text-sm font-semibold">E</span>
              </div>
              <span className="text-white font-medium text-sm">Exametry</span>
            </div>

            {/* Center: Navigation Tabs */}
            <nav className="flex items-center gap-1 flex-1 justify-center">
              {tabs.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => onTabChange(id)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                    activeTab === id
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center gap-3 min-w-fit">
              <span className="text-white text-base font-medium whitespace-nowrap">
                {getGreeting()}
              </span>
              
              <div className="h-4 w-px bg-neutral-700" />
              
              <span className="text-white text-sm whitespace-nowrap">
                {currentTime}
              </span>

              <button
                onClick={toggle}
                className="p-2 rounded-md hover:bg-neutral-800 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <Sun size={20} className="text-white" />
                ) : (
                  <Moon size={20} className="text-white" />
                )}
              </button>

              <button
                onClick={() => setShowBetaInfo(true)}
                className="text-sm font-medium px-2.5 py-1.5 bg-neutral-800 rounded-md hover:bg-neutral-700 transition-colors text-white"
              >
                v1.1.1
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="profile-button w-9 h-9 rounded-full bg-neutral-800 text-white flex items-center justify-center hover:bg-neutral-700 transition-colors border border-neutral-700/50"
                  aria-label="Profile menu"
                >
                  <User size={18} />
                </button>

                {showProfileMenu && (
                  <div className="profile-menu absolute right-0 top-11 w-48 bg-neutral-800 rounded-lg shadow-large border border-neutral-700 z-50 overflow-hidden">
                    <a
                      href={DONATION_TIERS[1].stripeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full px-4 py-2.5 text-left text-sm text-neutral-300 hover:bg-neutral-700 flex items-center gap-2 transition-colors border-b border-neutral-700"
                    >
                      <Heart size={16} className="text-red-500" />
                      Support Us
                    </a>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-neutral-700 flex items-center gap-2 transition-colors"
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
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-large max-w-md w-full p-6 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                <Info className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Version Information
              </h3>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 text-sm leading-relaxed">
              Current version: 1.1.1. We value your feedback and are continuously improving the app!
            </p>
            <button
              onClick={() => setShowBetaInfo(false)}
              className="w-full px-4 py-2.5 bg-black dark:bg-neutral-800 text-white rounded-lg hover:bg-neutral-900 dark:hover:bg-neutral-700 transition-colors font-medium text-sm"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};