import React, { useState } from 'react';
import { LogOut, Images, FileText, Calculator, Globe } from 'lucide-react';
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
    { id: 'images', icon: Images, label: 'Images' },
    { id: 'calculator', icon: Calculator, label: 'Calc' },
    { id: 'browser', icon: Globe, label: 'Site Exam' },
    { id: 'pdf', icon: FileText, label: 'FAQ' }
  ];

  return (
    <header className="bg-slate-900 dark:bg-gray-900 shadow-md">
      <div className="max-w-[1920px] mx-auto px-4">
        <div className="h-16 flex items-center justify-between gap-8">
          {/* Left: Profile + Greeting */}
          <div className="flex items-center gap-3 min-w-fit">
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="profile-button w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center text-lg hover:bg-indigo-600 transition overflow-hidden"
              >
                {PROFILE_EMOJI}
              </button>

              {showProfileMenu && (
                <div className="profile-menu absolute left-0 top-12 w-48 bg-gray-800/95 rounded-lg shadow-xl border border-gray-700 backdrop-blur-lg z-50">
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
            
            <span className="text-white font-medium whitespace-nowrap">
              {getGreeting()}, Test! 😊
            </span>
          </div>

          {/* Center: Navigation Tabs */}
          <nav className="flex items-center gap-1 flex-1 justify-center">
            {tabs.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  activeTab === id
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* Right: Date, Premium, Version */}
          <div className="flex items-center gap-4 min-w-fit">
            <span className="text-gray-300 text-sm whitespace-nowrap">
              {currentTime}
            </span>
            
            <span className="text-gray-400 text-xs">UK</span>

            <button className="px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded hover:bg-purple-700 transition-colors">
              👑 Premium
            </button>

            <div className="flex items-center gap-1 px-2 py-1 bg-slate-800 rounded text-xs text-gray-300">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              <span>v1.1.1</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};