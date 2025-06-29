import React, { createContext, useContext, useEffect, useState } from 'react';
import { Hanko } from "@teamhanko/hanko-elements";

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  logout: async () => {},
});

const hanko = new Hanko("http://localhost:8000");

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check session on mount
    const checkSession = async () => {
      try {
        const currentUser = await hanko.getUser();
        if (currentUser) {
          setIsAuthenticated(true);
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Session check failed:', error);
        setIsAuthenticated(false);
        setUser(null);
      }
    };

    checkSession();

    // Listen for new sessions (user login / register)
    const unsubscribe = hanko.onSessionCreated(() => {
      checkSession();
    });

    return () => {
      // Cleanup listener on unmount
      unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      await hanko.logout();
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 