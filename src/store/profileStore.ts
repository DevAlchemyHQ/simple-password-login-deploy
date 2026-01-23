import { create } from 'zustand';
import { cognitoGetCurrentUser } from '../lib/cognito';
import { getUserProfile, updateUserProfile, UpdateProfileRequest } from '../lib/api';
import { UserProfile } from '../types/profile';

interface ProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: UpdateProfileRequest) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    try {
      set({ isLoading: true, error: null });

      // Check if user is authenticated via Cognito
      const user = await cognitoGetCurrentUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Fetch profile from backend
      const result = await getUserProfile();
      if (result.success && result.data) {
        set({ profile: result.data });
      } else {
        throw new Error(result.error || 'Failed to fetch profile');
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch profile' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (updates) => {
    try {
      set({ isLoading: true, error: null });

      // Check if user is authenticated
      const user = await cognitoGetCurrentUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Update profile via backend
      const result = await updateUserProfile(updates);
      if (result.success && result.data) {
        set({ profile: result.data });
      } else {
        throw new Error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update profile' });
    } finally {
      set({ isLoading: false });
    }
  },
}));
