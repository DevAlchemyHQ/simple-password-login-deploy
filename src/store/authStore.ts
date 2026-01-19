import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  setAuth: (isAuthenticated: boolean) => void;
  logout: () => void;
}

// Check localStorage for existing auth state  
const getStoredAuth = () => {
  try {
    return localStorage.getItem('isAuthenticated') === 'true';
  } catch (error) {
    console.error('Error reading auth from localStorage:', error);
    return false;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: getStoredAuth(),
  setAuth: (isAuthenticated) => {
    set({ isAuthenticated });
    if (isAuthenticated) {
      localStorage.setItem('isAuthenticated', 'true');
    } else {
      localStorage.removeItem('isAuthenticated');
    }
  },
  logout: () => {
    localStorage.removeItem('isAuthenticated');
    set({ isAuthenticated: false });
  }
}));