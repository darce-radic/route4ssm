import React, { useEffect } from 'react';
import { register } from '@teamhanko/hanko-elements';

const hankoApi = "http://localhost:8000";

const Login = (): React.ReactElement => {
  useEffect(() => {
    // Register the Hanko auth element
    register(hankoApi).catch((error: unknown) => {
      console.error("Error registering Hanko element:", error);
    });
  }, []);

  return (
    <div className="login-container">
      <hanko-auth />
    </div>
  );
};

export default Login; 