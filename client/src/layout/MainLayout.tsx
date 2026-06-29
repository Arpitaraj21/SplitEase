import { Box, BottomNavigation, BottomNavigationAction } from "@mui/material";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupIcon from "@mui/icons-material/Group";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const getNavValue = () => {
    if (location.pathname.startsWith("/groups")) return 1;
    if (location.pathname.startsWith("/account") || location.pathname.startsWith("/edit-profile")) return 2;
    return 0;
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Box sx={{ flex: 1, overflow: "auto", pb: 8 }}>
        <Outlet />
      </Box>
      <BottomNavigation
        value={getNavValue()}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          boxShadow: "0 -2px 10px rgba(0,0,0,0.1)",
          zIndex: 100,
        }}
      >
        <BottomNavigationAction
          label="Dashboard"
          icon={<DashboardIcon />}
          onClick={() => navigate("/dashboard")}
        />
        <BottomNavigationAction
          label="Groups"
          icon={<GroupIcon />}
          onClick={() => navigate("/groups")}
        />
        <BottomNavigationAction
          label="Account"
          icon={<AccountCircleIcon />}
          onClick={() => navigate("/account")}
        />
      </BottomNavigation>
    </Box>
  );
}
