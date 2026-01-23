import { cognitoGetIdToken } from './cognito';

const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL;

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Helper function to make authenticated API calls
async function apiCall<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = await cognitoGetIdToken();

    if (!token) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error('API call error:', error);
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
}

// Download quota checking
export interface DownloadQuotaResponse {
  canDownload: boolean;
  remaining: number;
  needsSubscription: boolean;
  subscriptionStatus: 'free' | 'active' | 'canceling';
}

export async function checkDownloadQuota(): Promise<ApiResponse<DownloadQuotaResponse>> {
  return apiCall<DownloadQuotaResponse>('/downloads/check');
}

// Create download and get presigned URL
export interface CreateDownloadRequest {
  fileName: string;
  fileContent: string; // base64 encoded
}

export interface CreateDownloadResponse {
  downloadUrl: string;
  downloadId: string;
  fileName: string;
  expiresIn: number;
  remaining: number;
}

export async function createDownload(
  request: CreateDownloadRequest
): Promise<ApiResponse<CreateDownloadResponse>> {
  return apiCall<CreateDownloadResponse>('/downloads', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// Track download (for client-side downloads)
export interface TrackDownloadRequest {
  fileName: string;
  fileSize?: number;
}

export interface TrackDownloadResponse {
  success: boolean;
  downloadId: string;
  remaining: number;
}

export async function trackDownload(
  request: TrackDownloadRequest
): Promise<ApiResponse<TrackDownloadResponse>> {
  return apiCall<TrackDownloadResponse>('/downloads/track', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// Get Stripe Customer Portal URL
export interface CustomerPortalResponse {
  url: string;
}

export async function getCustomerPortalUrl(): Promise<ApiResponse<CustomerPortalResponse>> {
  return apiCall<CustomerPortalResponse>('/subscription/portal');
}

// Create Stripe Checkout Session
export interface CheckoutSessionResponse {
  url: string;
  sessionId: string;
}

export async function createCheckoutSession(): Promise<ApiResponse<CheckoutSessionResponse>> {
  return apiCall<CheckoutSessionResponse>('/subscription/checkout', {
    method: 'POST',
  });
}

// Admin: Get metrics
export interface AdminMetricsResponse {
  users: {
    total: number;
    free: number;
    active: number;
    canceling: number;
    conversionRate: string;
  };
  downloads: {
    total: number;
    free: number;
    paid: number;
    period: string;
  };
  revenue: {
    mrr: number;
    currency: string;
    activeSubscriptions: number;
  };
  alerts: {
    failedPayments: number;
  };
  timestamp: number;
}

export async function getAdminMetrics(): Promise<ApiResponse<AdminMetricsResponse>> {
  return apiCall<AdminMetricsResponse>('/admin/metrics');
}

// User Profile
export interface UserProfileResponse {
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

export async function getUserProfile(): Promise<ApiResponse<UserProfileResponse>> {
  return apiCall<UserProfileResponse>('/user/profile');
}

export interface UpdateProfileRequest {
  fullName?: string;
  avatarEmoji?: string;
}

export async function updateUserProfile(
  updates: UpdateProfileRequest
): Promise<ApiResponse<UserProfileResponse>> {
  return apiCall<UserProfileResponse>('/user/profile', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}
