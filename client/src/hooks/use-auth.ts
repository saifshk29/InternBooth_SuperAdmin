import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { loginWithEmail, logout as firebaseLogout, auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider(props: AuthProviderProps) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Check if user is authenticated on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("superAdmin");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("superAdmin");
      }
    }
    
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        // User is signed in
        const userData = {
          uid: authUser.uid,
          email: authUser.email,
          displayName: authUser.displayName || "Super Admin",
          role: "superadmin",
        };
        
        setUser(userData);
        localStorage.setItem("superAdmin", JSON.stringify(userData));
      } else {
        // User is signed out
        setUser(null);
        localStorage.removeItem("superAdmin");
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Handle user login
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const userCredential = await loginWithEmail(email, password);
      
      // For the super admin dashboard, we'll consider any authenticated user as a super admin
      const userData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName || "Super Admin",
        role: "superadmin",
      };
      
      setUser(userData);
      localStorage.setItem("superAdmin", JSON.stringify(userData));
      
      // Try to create the user document but don't stop the login process if it fails
      try {
        const userDocRef = doc(db, "users", userCredential.user.uid);
        await setDoc(userDocRef, {
          ...userData,
          lastLogin: serverTimestamp()
        }, { merge: true });
      } catch (docError) {
        console.warn("Could not save user document, but login succeeded:", docError);
      }
      
      return userCredential;
    } catch (error: any) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle user logout
  const logout = async () => {
    try {
      setLoading(true);
      await firebaseLogout();
      setUser(null);
      localStorage.removeItem("superAdmin");
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error: any) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: error.message || "Failed to logout. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return React.createElement(
    AuthContext.Provider,
    { value: { user, loading, login, logout } },
    props.children
  );
}

export const useAuth = () => useContext(AuthContext);
