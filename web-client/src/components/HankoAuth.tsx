import { useEffect, useCallback, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import { register } from "@teamhanko/hanko-elements";
import { Hanko } from "@teamhanko/hanko-frontend-sdk";
import { HANKO_API_URL } from "../config/hanko";

export default function HankoAuth() {
  const navigate = useNavigate();
  const hanko = useMemo(() => new Hanko(HANKO_API_URL), []);

  const redirectAfterLogin = useCallback(() => {
    navigate("/dashboard");
  }, [navigate]);

  useEffect(() => {
    // Subscribe to the session created event
    const unsubscribe = hanko.onSessionCreated(() => {
      redirectAfterLogin();
    });

    // Cleanup subscription
    return () => {
      unsubscribe();
    };
  }, [hanko, redirectAfterLogin]);

  useEffect(() => {
    // Register the Hanko elements
    register(HANKO_API_URL).catch((error) => {
      console.error("Error registering Hanko elements:", error);
    });
  }, []);

  return <hanko-auth />;
} 