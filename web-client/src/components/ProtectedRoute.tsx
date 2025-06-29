import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Hanko } from "@teamhanko/hanko-frontend-sdk";
import { HANKO_API_URL } from "../config/hanko";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();
  const [hanko] = useState(new Hanko(HANKO_API_URL));

  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionStatus = await hanko.validateSession();
        setIsAuthenticated(sessionStatus.is_valid);
      } catch (error) {
        console.error('Session check failed:', error);
        setIsAuthenticated(false);
      }
    };

    checkSession();

    // Listen for session changes
    const unsubscribeExpired = hanko.onSessionExpired(() => {
      setIsAuthenticated(false);
    });

    const unsubscribeLoggedOut = hanko.onUserLoggedOut(() => {
      setIsAuthenticated(false);
    });

    return () => {
      unsubscribeExpired();
      unsubscribeLoggedOut();
    };
  }, [hanko]);

  if (isAuthenticated === null) {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <>{children}</>;
} 