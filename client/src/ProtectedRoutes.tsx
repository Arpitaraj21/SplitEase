import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { userService } from "./services/user";
import { Box, CircularProgress } from "@mui/material";

export default function ProtectedRoutes({ children }: { children: React.ReactNode }) {
  const [isAuth, setIsAuth] = useState<boolean | null>(null); // null = loading

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to fetch profile — if cookies are valid, this succeeds
        await userService.getProfileservice();
        setIsAuth(true);
        localStorage.setItem("accessToken", "true");
      } catch {
        // Token expired or invalid — clear localStorage
        localStorage.removeItem("accessToken");
        setIsAuth(false);
      }
    };

    // Quick check: if localStorage has the flag, assume auth is likely valid
    // but still verify in background
    const hasToken = localStorage.getItem("accessToken");
    if (hasToken) {
      setIsAuth(true); // show content immediately
      // Verify in background — if it fails, the axios interceptor handles refresh
      checkAuth();
    } else {
      checkAuth();
    }
  }, []);

  if (isAuth === null) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
