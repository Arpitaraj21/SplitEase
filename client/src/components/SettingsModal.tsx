import {
  Box,
  Button,
  Modal,
  Typography,
  Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import PositionedSnackbar from "../utils/snackbar";
import { userService } from "../services/user";

const style = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 280,
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  p: 3,
  display: "flex",
  flexDirection: "column",
  gap: 1,
};

export default function SettingsModal({ open, handleClose }: { open: boolean; handleClose: () => void }) {
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = useState({ open: false, message: "", success: false });

  const handleLogout = async () => {
    try {
      await userService.logoutservice();
      localStorage.removeItem("accessToken");
      handleClose();
      navigate("/login");
    } catch (error) {
      console.log("error in logout", error);
    }
  };

  const handleEditProfile = () => {
    handleClose();
    navigate("/edit-profile");
  };

  const handleViewProfile = () => {
    handleClose();
    navigate("/account");
  };

  return (
    <>
      <Modal open={open} onClose={handleClose} aria-labelledby="settings-modal">
        <Box sx={style}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
            Settings
          </Typography>
          <Divider />
          <Button onClick={handleViewProfile} sx={{ justifyContent: "flex-start", color: "text.primary" }}>
            👤 View Profile
          </Button>
          <Button onClick={handleEditProfile} sx={{ justifyContent: "flex-start", color: "text.primary" }}>
            ✏️ Edit Profile
          </Button>
          <Divider />
          <Button onClick={handleLogout} sx={{ justifyContent: "flex-start", color: "error.main" }}>
            🚪 Logout
          </Button>
        </Box>
      </Modal>

      <PositionedSnackbar
        open={snackbar.open}
        message={snackbar.message}
        success={snackbar.success}
        onClose={() => setSnackbar({ open: false, message: "", success: false })}
      />
    </>
  );
}
