import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Hanko } from "@teamhanko/hanko-frontend-sdk";
import { HANKO_API_URL } from "../config/hanko";

export default function LogoutButton() {
  const navigate = useNavigate();
  const [hanko] = useState(new Hanko(HANKO_API_URL));

  const logout = async () => {
    try {
      await hanko.logout();
      navigate("/"); // Redirect to login page after logout
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <button 
      onClick={logout}
      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
    >
      Logout
    </button>
  );
} 