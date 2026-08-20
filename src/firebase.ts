import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google provider parameters
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export interface GoogleSignInResult {
  user: User | null;
  error?: string;
  isPopupBlocked?: boolean;
}

/**
 * Perform Google sign-in with popup.
 * Handles iframe restrictions, popup blocks, and cancellations gracefully.
 */
export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    const errorCode = error?.code || '';
    const errorMessage = error?.message || String(error);
    console.warn('Google sign-in popup attempt status:', errorCode, errorMessage);

    if (
      errorCode === 'auth/popup-blocked' ||
      errorCode === 'auth/cancelled-popup-request' ||
      errorMessage.includes('popup') ||
      errorMessage.includes('Cross-Origin')
    ) {
      const customErr: any = new Error(
        'The sign-in popup was blocked by your browser settings. Please allow popups or open the app in a new window/tab.'
      );
      customErr.code = 'auth/popup-blocked';
      customErr.isPopupBlocked = true;
      throw customErr;
    }

    if (errorCode === 'auth/popup-closed-by-user') {
      const customErr: any = new Error('Sign-in cancelled: The login popup was closed.');
      customErr.code = 'auth/popup-closed-by-user';
      throw customErr;
    }

    throw error;
  }
};

/**
 * Check if redirected back from Google sign-in
 */
export const checkRedirectSignIn = async (): Promise<User | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      return result.user;
    }
    return null;
  } catch (error) {
    console.warn('Redirect check result:', error);
    return null;
  }
};

export const logoutGoogle = async () => {
  try {
    // Clear any local admin session overrides
    localStorage.removeItem('admin_session_token');
    localStorage.removeItem('admin_email');
    localStorage.removeItem('customer_session');
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out', error);
    throw error;
  }
};
