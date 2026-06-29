import { Box, Typography, Card, CardContent, Grid, Button, Chip } from "@mui/material";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { expenseService } from "../services/expense";
import { groupService } from "../services/group";
import { userService } from "../services/user";
import { invitationService } from "../services/invitation";
import { icons } from "../utils/Icons";
import PositionedSnackbar from "../utils/snackbar";
import SettingsModal from "./SettingsModal";
import SpendingStats from "./SpendingStats";
import type { Group, Invitation } from "../types/User";

interface OverallBalance {
  totalOwed: number;
  totalOwe: number;
  netBalance: number;
  balances: { user: { _id: string; name: string; email: string }; amount: number }[];
}

export default function Dashboard() {
  const [userData, setUserData] = useState<{ name: string; email: string } | null>(null);
  const [overallBalance, setOverallBalance] = useState<OverallBalance | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", success: false });
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileResp, balanceResp, groupsResp, inviteResp] = await Promise.allSettled([
        userService.getProfileservice(),
        expenseService.getOverallBalances(),
        groupService.getGroups(),
        invitationService.getMyInvitations(),
      ]);

      if (profileResp.status === "fulfilled") setUserData(profileResp.value.user);
      if (balanceResp.status === "fulfilled") setOverallBalance(balanceResp.value);
      if (groupsResp.status === "fulfilled") setGroups(groupsResp.value.groups);
      if (inviteResp.status === "fulfilled") setInvitations(inviteResp.value.invitations);
    } catch (error) {
      console.log("error fetching dashboard data", error);
    }
  };

  const handleAcceptInvite = async (token: string) => {
    try {
      await invitationService.acceptInvitation(token);
      setSnackbar({ open: true, message: "Invitation accepted!", success: true });
      fetchData();
    } catch (error: any) {
      setSnackbar({ open: true, message: error?.message || "Failed", success: false });
    }
  };

  const handleDeclineInvite = async (token: string) => {
    try {
      await invitationService.declineInvitation(token);
      setSnackbar({ open: true, message: "Invitation declined", success: true });
      fetchData();
    } catch (error: any) {
      setSnackbar({ open: true, message: error?.message || "Failed", success: false });
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 3,
          background: "linear-gradient(135deg, #4687ff 0%, #2563eb 100%)",
          color: "white",
          borderRadius: "0 0 16px 16px",
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Hi, {userData?.name?.split(" ")[0] ?? "there"} 👋
          </Typography>
          <Typography sx={{ opacity: 0.9, mt: 0.5 }}>Here's your expense overview</Typography>
        </Box>
        <icons.setting
          sx={{ cursor: "pointer", color: "white", fontSize: 30 }}
          onClick={() => setOpenModal(true)}
        />
      </Box>

      <Box sx={{ p: 3 }}>
        {/* Balance Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: "#e8f5e9" }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">You are owed</Typography>
                <Typography variant="h5" fontWeight="bold" color="success.main">
                  ₹{overallBalance?.totalOwed?.toFixed(2) || "0.00"}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: "#ffebee" }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">You owe</Typography>
                <Typography variant="h5" fontWeight="bold" color="error.main">
                  ₹{overallBalance?.totalOwe?.toFixed(2) || "0.00"}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: "#e3f2fd" }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Net Balance</Typography>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  color={
                    (overallBalance?.netBalance || 0) >= 0 ? "success.main" : "error.main"
                  }
                >
                  ₹{overallBalance?.netBalance?.toFixed(2) || "0.00"}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Pending Invitations</Typography>
            {invitations.map((invite) => (
              <Card key={invite._id} sx={{ mb: 1 }}>
                <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, py: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography fontWeight="500">
                      {invite.invitedBy?.name} invited you to "{invite.group?.name}"
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    onClick={() => handleAcceptInvite(invite.token)}
                  >
                    Accept
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => handleDeclineInvite(invite.token)}
                  >
                    Decline
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {/* Per-person balances */}
        {overallBalance && overallBalance.balances.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Who owes whom</Typography>
            {overallBalance.balances
              .filter((b) => Math.abs(b.amount) > 0.01)
              .map((b) => (
                <Box
                  key={b.user._id}
                  sx={{ display: "flex", alignItems: "center", gap: 2, p: 1.5, border: "1px solid #eee", borderRadius: 1, mb: 1 }}
                >
                  <Typography sx={{ flex: 1 }}>{b.user.name}</Typography>
                  <Typography fontWeight="bold" color={b.amount > 0 ? "success.main" : "error.main"}>
                    {b.amount > 0 ? `owes you ₹${b.amount.toFixed(2)}` : `you owe ₹${Math.abs(b.amount).toFixed(2)}`}
                  </Typography>
                </Box>
              ))}
          </Box>
        )}

        {/* Spending Statistics */}
        <SpendingStats />

        {/* Recent Groups */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Typography variant="h6">Your Groups</Typography>
          <Button size="small" onClick={() => navigate("/groups")}>View All</Button>
        </Box>
        {groups.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography color="text.secondary">No groups yet</Typography>
              <Button variant="outlined" sx={{ mt: 1 }} onClick={() => navigate("/groups")}>
                Create a Group
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {groups.slice(0, 4).map((group) => (
              <Grid item xs={12} sm={6} key={group._id}>
                <Card
                  sx={{ cursor: "pointer", "&:hover": { boxShadow: 3 } }}
                  onClick={() => navigate(`/groups/${group._id}`)}
                >
                  <CardContent>
                    <Typography fontWeight="500">{group.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {group.members.length} members • {group.category}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <SettingsModal open={openModal} handleClose={() => setOpenModal(false)} />

      <PositionedSnackbar
        open={snackbar.open}
        message={snackbar.message}
        success={snackbar.success}
        onClose={() => setSnackbar({ open: false, message: "", success: false })}
      />
    </Box>
  );
}
