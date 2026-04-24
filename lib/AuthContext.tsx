import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, signInAnonymously } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  isCustomAuth?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  isLoggingIn: boolean;
  login: () => Promise<void>;
  loginWithPassword: (user: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTHORIZED_EMAILS = [
  'lucaspassa@gmail.com',
  'maru.crespo.arg@gmail.com',
  'sinapsis3dbariloche@gmail.com'
];

const CUSTOM_CREDENTIALS = {
  user: 'admin',
  pass: 'Maru2709'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      const savedSession = localStorage.getItem('s3d_session');
      
      if (currentUser) {
        const authUser: AuthUser = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          isCustomAuth: !!savedSession && currentUser.isAnonymous
        };
        
        setUser(authUser);
        
        if (currentUser.email && AUTHORIZED_EMAILS.includes(currentUser.email)) {
          setIsAdmin(true);
        } else if (currentUser.isAnonymous && savedSession) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
        setLoading(false);
      } else if (savedSession) {
        // We have a saved session but Firebase Auth is not active yet (e.g. page refresh)
        // Auto sign-in anonymously to re-establish the connection for rules
        signInAnonymously(auth).catch(err => {
          if (err.code === 'auth/admin-restricted-operation' || err.code === 'auth/operation-not-allowed') {
            console.warn("Anonymous sign-in is disabled in Firebase Console. Please enable it in Authentication > Sign-in method.");
            try {
              const sessionData = JSON.parse(savedSession);
              setUser(sessionData);
              setIsAdmin(true);
            } catch (e) {
              localStorage.removeItem('s3d_session');
            }
          } else {
            console.error("Auto anonymous sign-in failed:", err);
            localStorage.removeItem('s3d_session');
          }
          setLoading(false);
        });
      } else {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithPassword = async (userInput: string, passInput: string) => {
    if (userInput.toLowerCase() === CUSTOM_CREDENTIALS.user && passInput === CUSTOM_CREDENTIALS.pass) {
      setIsLoggingIn(true);
      try {
        // MUST wait for anonymous sign-in to be ready for Firestore rules
        const cred = await signInAnonymously(auth);
        
        const customUser: AuthUser = {
          uid: cred.user.uid,
          email: 'admin@sinapsis3d.com',
          displayName: 'Administrador',
          isCustomAuth: true
        };
        
        localStorage.setItem('s3d_session', JSON.stringify(customUser));
        setUser(customUser);
        setIsAdmin(true);
      } catch (err: any) {
        console.error("Login session failed:", err);
        if (err.code === 'auth/admin-restricted-operation' || err.code === 'auth/operation-not-allowed') {
          throw new Error('El inicio de sesión anónimo está desactivado en Firebase. Por favor, habilítalo en la consola de Firebase (Authentication > Sign-in method > Anonymous).');
        }
        throw new Error('Error al establecer conexión segura con el servidor');
      } finally {
        setIsLoggingIn(false);
      }
    } else {
      throw new Error('Credenciales incorrectas');
    }
  };

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('s3d_session');
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isLoggingIn, login, loginWithPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
