import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Divider,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { userService } from "../services/user";
import PositionedSnackbar from "../utils/snackbar";

interface UserData {
  name: string;
  username: string;
  email: string;
  role: string;
  profileImage?: string;
  createdAt?: string;
}

export default function Profile() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", success: false });
  const navigate = useNavigate();

  const getProfileDetails = async () => {
    try {
      const resp = await userService.getProfileservice();
      setUserData(resp.user);
    } catch (error) {
      console.log("error fetching profile", error);
    }
  };

  useEffect(() => {
    getProfileDetails();
  }, []);

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
    try {
      await userService.deleteProfileservice();
      localStorage.removeItem("accessToken");
      navigate("/login");
    } catch (error) {
      setSnackbar({ open: true, message: "Failed to delete account", success: false });
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        My Profile
      </Typography>

      <Card>
        <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, p: 4 }}>
          <Avatar
            src={userData?.profileImage}
            sx={{ width: 80, height: 80, fontSize: 32, bgcolor: "#4687ff" }}
          >
            {userData?.name?.[0]?.toUpperCase()}
          </Avatar>
          <Typography variant="h6" fontWeight="bold">
            {userData?.name}
          </Typography>
          <Typography color="text.secondary">@{userData?.username}</Typography>

          <Divider sx={{ width: "100%", my: 1 }} />

          <Box sx={{ width: "100%" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", py: 1 }}>
              <Typography color="text.secondary">Email</Typography>
              <Typography>{userData?.email}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", py: 1 }}>
              <Typography color="text.secondary">Role</Typography>
              <Typography sx={{ textTransform: "capitalize" }}>{userData?.role}</Typography>
            </Box>
            {userData?.createdAt && (
              <Box sx={{ display: "flex", justifyContent: "space-between", py: 1 }}>
                <Typography color="text.secondary">Member since</Typography>
                <Typography>{new Date(userData.createdAt).toLocaleDateString()}</Typography>
              </Box>
            )}
          </Box>

          <Divider sx={{ width: "100%", my: 1 }} />

          <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate("/edit-profile")}
            >
              Edit Profile
            </Button>
            <Button
              variant="outlined"
              color="error"
              fullWidth
              onClick={handleDeleteAccount}
            >
              Delete Account
            </Button>
          </Box>
        </CardContent>
      </Card>

      <PositionedSnackbar
        open={snackbar.open}
        message={snackbar.message}
        success={snackbar.success}
        onClose={() => setSnackbar({ open: false, message: "", success: false })}
      />
    </Box>
  );
}
