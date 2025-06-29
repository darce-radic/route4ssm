export const HANKO_API_URL = "http://localhost:8000";

// Validate the API URL is set
if (!HANKO_API_URL) {
  throw new Error("HANKO_API_URL is not set");
} 