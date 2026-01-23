export interface UserProfile {
  userId: string;
  email: string;
  fullName: string;
  avatarEmoji: string;
  avatarUrl?: string;
  subscriptionStatus: 'free' | 'active' | 'canceling';
  downloadCount: number;
  stripeCustomerId: string;
  createdAt: string;
  updatedAt: string;
}