import { Amplify } from 'aws-amplify';
import {
  signIn,
  signUp,
  confirmSignUp,
  signOut,
  getCurrentUser,
  fetchAuthSession,
  resetPassword,
  confirmResetPassword,
  resendSignUpCode,
} from 'aws-amplify/auth';

// Configure Amplify
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
      signUpVerificationMethod: 'code',
    },
  },
});

export interface CognitoUser {
  userId: string;
  username: string;
  email: string;
  emailVerified: boolean;
}

export interface AuthError {
  code: string;
  message: string;
}

// Sign up a new user
export async function cognitoSignUp(email: string, password: string, fullName: string) {
  try {
    const { isSignUpComplete, userId, nextStep } = await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          'custom:fullName': fullName,
        },
      },
    });

    return {
      success: true,
      isSignUpComplete,
      userId,
      nextStep,
    };
  } catch (error: any) {
    console.error('Sign up error:', error);
    return {
      success: false,
      error: {
        code: error.code || 'SignUpError',
        message: error.message || 'Failed to sign up',
      } as AuthError,
    };
  }
}

// Confirm sign up with OTP code
export async function cognitoConfirmSignUp(email: string, code: string) {
  try {
    const { isSignUpComplete, nextStep } = await confirmSignUp({
      username: email,
      confirmationCode: code,
    });

    return {
      success: true,
      isSignUpComplete,
      nextStep,
    };
  } catch (error: any) {
    console.error('Confirm sign up error:', error);
    return {
      success: false,
      error: {
        code: error.code || 'ConfirmSignUpError',
        message: error.message || 'Failed to confirm sign up',
      } as AuthError,
    };
  }
}

// Resend confirmation code
export async function cognitoResendCode(email: string) {
  try {
    await resendSignUpCode({ username: email });
    return { success: true };
  } catch (error: any) {
    console.error('Resend code error:', error);
    return {
      success: false,
      error: {
        code: error.code || 'ResendCodeError',
        message: error.message || 'Failed to resend code',
      } as AuthError,
    };
  }
}

// Sign in
export async function cognitoSignIn(email: string, password: string) {
  try {
    const { isSignedIn, nextStep } = await signIn({
      username: email,
      password,
    });

    if (isSignedIn) {
      const user = await getCurrentUser();
      return {
        success: true,
        user: {
          userId: user.userId,
          username: user.username,
        },
      };
    }

    return {
      success: false,
      nextStep,
    };
  } catch (error: any) {
    console.error('Sign in error:', error);
    return {
      success: false,
      error: {
        code: error.code || 'SignInError',
        message: error.message || 'Failed to sign in',
      } as AuthError,
    };
  }
}

// Sign out
export async function cognitoSignOut() {
  try {
    await signOut();
    return { success: true };
  } catch (error: any) {
    console.error('Sign out error:', error);
    return {
      success: false,
      error: {
        code: error.code || 'SignOutError',
        message: error.message || 'Failed to sign out',
      } as AuthError,
    };
  }
}

// Get current authenticated user
export async function cognitoGetCurrentUser(): Promise<CognitoUser | null> {
  try {
    const user = await getCurrentUser();
    const session = await fetchAuthSession();

    const idToken = session.tokens?.idToken;
    const email = idToken?.payload.email as string;
    const emailVerified = idToken?.payload.email_verified as boolean;

    return {
      userId: user.userId,
      username: user.username,
      email,
      emailVerified,
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

// Get ID token for API calls
export async function cognitoGetIdToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() || null;
  } catch (error) {
    console.error('Get ID token error:', error);
    return null;
  }
}

// Reset password
export async function cognitoResetPassword(email: string) {
  try {
    const { nextStep } = await resetPassword({ username: email });
    return {
      success: true,
      nextStep,
    };
  } catch (error: any) {
    console.error('Reset password error:', error);
    return {
      success: false,
      error: {
        code: error.code || 'ResetPasswordError',
        message: error.message || 'Failed to reset password',
      } as AuthError,
    };
  }
}

// Confirm password reset with code
export async function cognitoConfirmResetPassword(
  email: string,
  code: string,
  newPassword: string
) {
  try {
    await confirmResetPassword({
      username: email,
      confirmationCode: code,
      newPassword,
    });
    return { success: true };
  } catch (error: any) {
    console.error('Confirm reset password error:', error);
    return {
      success: false,
      error: {
        code: error.code || 'ConfirmResetPasswordError',
        message: error.message || 'Failed to confirm password reset',
      } as AuthError,
    };
  }
}
