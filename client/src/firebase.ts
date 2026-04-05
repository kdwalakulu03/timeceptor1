/**
 * client/src/firebase.ts
 * Firebase client SDK — Authentication only.
 *
 * All config values come from Vite env vars (VITE_ prefix makes them
 * available in the browser bundle). Set them in .env at project root.
 *
 * Other data (subscribers, readings) stays in the Express server + data/.
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Avoid duplicate app init in HMR / dev
const firebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);

// Analytics — only in browser (not SSR, not during build)
isSupported().then(yes => {
  if (yes) getAnalytics(firebaseApp);
});

// ── Auth helpers ─────────────────────────────────────────────────────────

const googleProvider = new GoogleAuthProvider();

/** Sign in with Google popup. Returns the signed-in user. */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/** Sign out the current user. */
export function signOutUser(): Promise<void> {
  return signOut(auth);
}

/**
 * Subscribe to auth state changes.
 * Returns Firebase's unsubscribe function — call it on component unmount.
 *
 * @example
 * useEffect(() => onAuthChange(setUser), []);
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get the current user's ID token for sending to the backend.
 * The server verifies this with firebase-admin.
 */
export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}
