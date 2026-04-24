import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize persistence immediately
setPersistence(auth, browserLocalPersistence).catch(err => console.error("Error setting persistence:", err));
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || '(default)');
export const googleProvider = new GoogleAuthProvider();

// Standard login function using popup
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const logout = () => signOut(auth);

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}

export const handleFirestoreError = (error: any, operationType: FirestoreErrorInfo['operationType'], path: string | null = null) => {
  if (error?.code === 'permission-denied') {
    const user = auth.currentUser;
    const errorInfo: FirestoreErrorInfo = {
      error: error.message,
      operationType,
      path,
      authInfo: {
        userId: user?.uid || 'anonymous',
        email: user?.email || '',
        emailVerified: !!user?.emailVerified,
        isAnonymous: !!user?.isAnonymous,
        providerInfo: user?.providerData.map(p => ({
          providerId: p.providerId,
          displayName: p.displayName || '',
          email: p.email || ''
        })) || []
      }
    };
    throw new Error(JSON.stringify(errorInfo));
  }
  throw error;
};

// Critical: Connection test as required by instructions
export async function testFirestoreConnection() {
  try {
    // Try to get a dummy doc to verify connection
    await getDocFromServer(doc(db, 'system', 'health'));
  } catch (error) {
    // Only log if it's a connection/network error, permission errors are expected if not logged in
    if (error instanceof Error) {
      if (error.message.includes('the client is offline')) {
        console.error("Check your Firebase configuration. Client appears to be offline.");
      } else if (!error.message.includes('permission-denied')) {
        console.log("Firestore connection test status:", error.message);
      }
    }
  }
}
