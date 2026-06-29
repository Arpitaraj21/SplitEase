import { Box, Typography, Button, Card, CardContent, CircularProgress } from "@mui/material";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { invitationService } from "../services/invitation";
import PositionedSnackbar from "../utils/snackbar";

export default function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", success: false });

  useEffect(() => {
    if (token) {
      fetchInvitation();
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const resp = await invitationService.getInvitationByToken(token!);
      setInvitation(resp.invitation);
    } catch (error) {
      setSnackbar({ open: true, message: "Invalid or expired invitation", success: false });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      const isLoggedIn = localStorage.getItem("accessToken");
      if (!isLoggedIn) {
        // Store token and redirect to login
        localStorage.setItem("pendingInvite", token!);
        navigate("/login");
        return;
      }

      const resp = await invitationService.acceptInvitation(token!);
      setSnackbar({ open: true, message: "Invitation accepted!", success: true });
      setTimeout(() => navigate(`/groups/${resp.groupId}`), 1500);
    } catch (error: any) {
      setSnackbar({ open: true, message: error?.message || "Failed to accept", success: false });
    }
  };

  const handleDecline = async () => {
    try {
      await invitationService.declineInvitation(token!);
      setSnackbar({ open: true, message: "Invitation declined", success: true });
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error: any) {
      setSnackbar({ open: true, message: error?.message || "Failed", success: false });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!invitation) {
    return (
      <Box sx={{ textAlign: "center", mt: 10 }}>
        <Typography variant="h6" color="error">
          Invalid or expired invitation
        </Typography>
        <Button sx={{ mt: 2 }} onClick={() => navigate("/login")}>
          Go to Login
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
      <Card sx={{ maxWidth: 400, width: "100%" }}>
        <CardContent sx={{ textAlign: "center", p: 4 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            Group Invitation
          </Typography>
          <Typography sx={{ mb: 1 }}>
            <strong>{invitation.invitedBy?.name}</strong> has invited you to join
          </Typography>
          <Typography variant="h6" color="primary" sx={{ mb: 3 }}>
            "{invitation.group?.name}"
          </Typography>
          {invitation.group?.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {invitation.group.description}
            </Typography>
          )}
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button variant="contained" color="success" onClick={handleAccept} size="large">
              Accept & Join
            </Button>
            <Button variant="outlined" color="error" onClick={handleDecline} size="large">
              Decline
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
