import { useEffect } from "react";
import { register } from "@teamhanko/hanko-elements";
import { HANKO_API_URL } from "../config/hanko";

export default function HankoProfile() {
  useEffect(() => {
    // Register the Hanko elements
    register(HANKO_API_URL).catch((error) => {
      console.error("Error registering Hanko elements:", error);
    });
  }, []);

  return <hanko-profile />;
} 