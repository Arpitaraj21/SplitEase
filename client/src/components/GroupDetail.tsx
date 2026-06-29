import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Autocomplete,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { groupService } from "../services/group";
import { expenseService } from "../services/expense";
import { invitationService } from "../services/invitation";
import { userService } from "../services/user";
import PositionedSnackbar from "../utils/snackbar";
import type { Group, Expense, Balance, SimplifiedDebt } from "../types/User";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

const SPLIT_TYPES = [
  { value: "equal", label: "Equal Split" },
  { value: "you_owe", label: "You Owe (full amount)" },
  { value: "they_owe", label: "They Owe (full amount)" },
  { value: "percentage", label: "By Percentage" },
  { value: "exact", label: "Exact Amounts" },
];

const CATEGORIES = [
  { value: "food", label: "🍕 Food" },
  { value: "transport", label: "🚗 Transport" },
  { value: "shopping", label: "🛍️ Shopping" },
  { value: "entertainment", label: "🎬 Entertainment" },
  { value: "utilities", label: "💡 Utilities" },
  { value: "rent", label: "🏠 Rent" },
  { value: "healthcare", label: "🏥 Healthcare" },
  { value: "other", label: "📋 Other" },
];

export default function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [debts, setDebts] = useState<SimplifiedDebt[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [openExpenseDialog, setOpenExpenseDialog] = useState(false);
  const [openInviteDialog, setOpenInviteDialog] = useState(false);
  const [openSettleDialog, setOpenSettleDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", success: false });

  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    splitType: "equal" as "equal" | "percentage" | "exact" | "you_owe" | "they_owe",
    category: "other",
    notes: "",
    splits: [] as { user: string; amount: string; percentage: string }[],
    selectedMember: "", // for you_owe / they_owe
  });

  const [inviteData, setInviteData] = useState({ email: "", method: "email" });
  const [settleData, setSettleData] = useState({ paidTo: "", amount: "", notes: "" });
  const [searchResults, setSearchResults] = useState<{ _id: string; name: string; email: string; profileImage?: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchGroup = async () => {
    try {
      const resp = await groupService.getGroupById(groupId!);
      setGroup(resp.group);
    } catch (error) {
      console.log("error fetching group", error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const resp = await expenseService.getGroupExpenses(groupId!);
      setExpenses(resp.expenses);
    } catch (error) {
      console.log("error fetching expenses", error);
    }
  };

  const fetchBalances = async () => {
    try {
      const resp = await expenseService.getGroupBalances(groupId!);
      setBalances(resp.balances);
      setDebts(resp.simplifiedDebts);
    } catch (error) {
      console.log("error fetching balances", error);
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchGroup();
      fetchExpenses();
      fetchBalances();
    }
  }, [groupId]);

  const handleCreateExpense = async () => {
    try {
      let splits;

      if (newExpense.splitType === "you_owe" || newExpense.splitType === "they_owe") {
        // For you_owe/they_owe, send the selected member
        splits = [{ user: newExpense.selectedMember }];
      } else if (newExpense.splitType !== "equal") {
        splits = newExpense.splits.map((s) => ({
          user: s.user,
          amount: s.amount ? parseFloat(s.amount) : undefined,
          percentage: s.percentage ? parseFloat(s.percentage) : undefined,
        }));
      }

      await expenseService.createExpense({
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
        groupId: groupId!,
        splitType: newExpense.splitType,
        splits,
        category: newExpense.category,
        notes: newExpense.notes,
      });

      setSnackbar({ open: true, message: "Expense added!", success: true });
      setOpenExpenseDialog(false);
      setNewExpense({ description: "", amount: "", splitType: "equal", category: "other", notes: "", splits: [], selectedMember: "" });
      fetchExpenses();
      fetchBalances();
    } catch (error: any) {
      setSnackbar({ open: true, message: error?.message || "Failed to add expense", success: false });
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await expenseService.deleteExpense(expenseId);
      setSnackbar({ open: true, message: "Expense deleted", success: true });
      fetchExpenses();
      fetchBalances();
    } catch (error: any) {
      setSnackbar({ open: true, message: error?.message || "Failed to delete", success: false });
    }
  };

  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const resp = await userService.searchUsers(query);
      setSearchResults(resp.users || []);
    } catch (error) {
      console.log("search error:", error);
    }
  };

  const handleInvite = async () => {
    try {
      const resp = await invitationService.sendInvitation({
        groupId: groupId!,
        email: inviteData.email,
        method: inviteData.method,
      });

      // Show share message for WhatsApp/SMS
      if (inviteData.method === "whatsapp") {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(resp.shareMessage)}`;
        window.open(whatsappUrl, "_blank");
      } else if (inviteData.method === "sms") {
        const smsUrl = `sms:?body=${encodeURIComponent(resp.shareMessage)}`;
        window.open(smsUrl);
      }

      setSnackbar({ open: true, message: "Invitation sent!", success: true });
      setOpenInviteDialog(false);
      setInviteData({ email: "", method: "email" });
      fetchGroup();
    } catch (error: any) {
      setSnackbar({ open: true, message: error?.message || "Failed to invite", success: false });
    }
  };

  const handleSettleUp = async () => {
    try {
      await expenseService.settleUp({
        groupId: groupId!,
        paidTo: settleData.paidTo,
        amount: parseFloat(settleData.amount),
        notes: settleData.notes,
      });
      setSnackbar({ open: true, message: "Settlement recorded!", success: true });
      setOpenSettleDialog(false);
      setSettleData({ paidTo: "", amount: "", notes: "" });
      fetchBalances();
    } catch (error: any) {
      setSnackbar({ open: true, message: error?.message || "Failed to settle", success: false });
    }
  };

  const initSplits = () => {
    if (group) {
      setNewExpense((prev) => ({
        ...prev,
        splits: group.members.map((m) => ({ user: m._id, amount: "", percentage: "" })),
      }));
    }
  };

  const getCategoryEmoji = (category: string) => {
    return CATEGORIES.find((c) => c.value === category)?.label || "📋 Other";
  };

  if (!group) return <Typography sx={{ p: 3 }}>Loading...</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate("/groups")}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight="bold">
            {group.name}
          </Typography>
          {group.description && (
            <Typography variant="body2" color="text.secondary">
              {group.description}
            </Typography>
          )}
        </Box>
        <Button variant="outlined" startIcon={<PersonAddIcon />} onClick={() => setOpenInviteDialog(true)}>
          Invite
        </Button>
        <Button variant="contained" onClick={() => { initSplits(); setOpenExpenseDialog(true); }}>
          + Add Expense
        </Button>
      </Box>

      {/* Tabs */}
      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
        <Tab label="Expenses" />
        <Tab label="Balances" />
        <Tab label="Members" />
      </Tabs>

      {/* Expenses Tab */}
      {tabValue === 0 && (
        <Box>
          {expenses.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: "center", mt: 4 }}>
              No expenses yet. Add one!
            </Typography>
          ) : (
            <List>
              {expenses.map((expense) => (
                <ListItem
                  key={expense._id}
                  sx={{ border: "1px solid #eee", borderRadius: 1, mb: 1 }}
                  secondaryAction={
                    <IconButton edge="end" onClick={() => handleDeleteExpense(expense._id)}>
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "#4687ff" }}>
                      {expense.paidBy?.name?.[0]?.toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography fontWeight="500">{expense.description}</Typography>
                        <Chip label={getCategoryEmoji(expense.category)} size="small" variant="outlined" />
                      </Box>
                    }
                    secondary={`Paid by ${expense.paidBy?.name} • ${expense.splitType} split • ${new Date(expense.date).toLocaleDateString()}`}
                  />
                  <Typography fontWeight="bold" color="primary" sx={{ mr: 2 }}>
                    ₹{expense.amount.toFixed(2)}
                  </Typography>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      )}

      {/* Balances Tab */}
      {tabValue === 1 && (
        <Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Member Balances
            </Typography>
            {balances.map((b) => (
              <Box key={b.user._id} sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1, p: 1, border: "1px solid #eee", borderRadius: 1 }}>
                <Avatar sx={{ width: 32, height: 32 }}>{b.user.name?.[0]?.toUpperCase()}</Avatar>
                <Typography sx={{ flex: 1 }}>{b.user.name}</Typography>
                <Typography
                  fontWeight="bold"
                  color={b.balance > 0 ? "success.main" : b.balance < 0 ? "error.main" : "text.secondary"}
                >
                  {b.balance > 0 ? `gets back ₹${b.balance.toFixed(2)}` : b.balance < 0 ? `owes ₹${Math.abs(b.balance).toFixed(2)}` : "settled up"}
                </Typography>
              </Box>
            ))}
          </Box>

          {debts.length > 0 && (
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="h6">Simplified Debts</Typography>
                <Button variant="outlined" size="small" onClick={() => setOpenSettleDialog(true)}>
                  Settle Up
                </Button>
              </Box>
              {debts.map((debt, i) => (
                <Card key={i} sx={{ mb: 1 }}>
                  <CardContent sx={{ display: "flex", alignItems: "center", gap: 1, py: 1, "&:last-child": { pb: 1 } }}>
                    <Typography>{debt.from.name}</Typography>
                    <Typography color="text.secondary">→ pays →</Typography>
                    <Typography>{debt.to.name}</Typography>
                    <Typography fontWeight="bold" color="error.main" sx={{ ml: "auto" }}>
                      ₹{debt.amount.toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Members Tab */}
      {tabValue === 2 && (
        <Box>
          <List>
            {group.members.map((member) => (
              <ListItem key={member._id} sx={{ border: "1px solid #eee", borderRadius: 1, mb: 1 }}>
                <ListItemAvatar>
                  <Avatar>{member.name?.[0]?.toUpperCase()}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={member.name}
                  secondary={member.email}
                />
                {member._id === group.admin._id && <Chip label="Admin" size="small" color="primary" />}
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Add Expense Dialog */}
      <Dialog open={openExpenseDialog} onClose={() => setOpenExpenseDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Expense</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Description"
            value={newExpense.description}
            onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
            required
          />
          <TextField
            label="Amount (₹)"
            type="number"
            value={newExpense.amount}
            onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
            required
          />
          <FormControl fullWidth>
            <InputLabel>Split Type</InputLabel>
            <Select
              value={newExpense.splitType}
              label="Split Type"
              onChange={(e) => {
                setNewExpense({ ...newExpense, splitType: e.target.value as any });
                initSplits();
              }}
            >
              {SPLIT_TYPES.map((s) => (
                <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={newExpense.category}
              label="Category"
              onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* "I owe" — select who paid for you */}
          {newExpense.splitType === "you_owe" && (
            <Box>
              <FormControl fullWidth>
                <InputLabel>Who paid for you?</InputLabel>
                <Select
                  value={newExpense.selectedMember}
                  label="Who paid for you?"
                  onChange={(e) => setNewExpense({ ...newExpense, selectedMember: e.target.value })}
                >
                  {group.members.map((m) => (
                    <MenuItem key={m._id} value={m._id}>{m.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {newExpense.amount && newExpense.selectedMember && (
                <Typography variant="body2" color="text.secondary" sx={{ bgcolor: "#fff3e0", p: 1.5, borderRadius: 1, mt: 1 }}>
                  💡 You owe ₹{newExpense.amount} to {group.members.find((m) => m._id === newExpense.selectedMember)?.name}
                </Typography>
              )}
            </Box>
          )}

          {/* "They owe me" — select who owes you the full amount */}
          {newExpense.splitType === "they_owe" && (
            <Box>
              <FormControl fullWidth>
                <InputLabel>Who owes you?</InputLabel>
                <Select
                  value={newExpense.selectedMember}
                  label="Who owes you?"
                  onChange={(e) => setNewExpense({ ...newExpense, selectedMember: e.target.value })}
                >
                  {group.members.map((m) => (
                    <MenuItem key={m._id} value={m._id}>{m.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {newExpense.amount && newExpense.selectedMember && (
                <Typography variant="body2" color="text.secondary" sx={{ bgcolor: "#e8f5e9", p: 1.5, borderRadius: 1, mt: 1 }}>
                  💡 {group.members.find((m) => m._id === newExpense.selectedMember)?.name} owes you ₹{newExpense.amount}
                </Typography>
              )}
            </Box>
          )}

          {/* Show split inputs for percentage/exact */}
          {(newExpense.splitType === "percentage" || newExpense.splitType === "exact") && newExpense.splits.length > 0 && (
            <Box sx={{ border: "1px solid #ddd", p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {newExpense.splitType === "percentage" ? "Enter percentages:" : "Enter exact amounts:"}
              </Typography>
              {newExpense.splits.map((split, idx) => {
                const member = group.members.find((m) => m._id === split.user);
                return (
                  <Box key={split.user} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Typography sx={{ flex: 1, fontSize: 14 }}>{member?.name}</Typography>
                    <TextField
                      size="small"
                      type="number"
                      label={newExpense.splitType === "percentage" ? "%" : "₹"}
                      value={newExpense.splitType === "percentage" ? split.percentage : split.amount}
                      onChange={(e) => {
                        const updated = [...newExpense.splits];
                        if (newExpense.splitType === "percentage") {
                          updated[idx].percentage = e.target.value;
                        } else {
                          updated[idx].amount = e.target.value;
                        }
                        setNewExpense({ ...newExpense, splits: updated });
                      }}
                      sx={{ width: 100 }}
                    />
                  </Box>
                );
              })}
            </Box>
          )}

          <TextField
            label="Notes (optional)"
            value={newExpense.notes}
            onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExpenseDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateExpense} disabled={!newExpense.description || !newExpense.amount}>
            Add Expense
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={openInviteDialog} onClose={() => setOpenInviteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite to Group</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <Autocomplete
            freeSolo
            options={searchResults}
            getOptionLabel={(option) =>
              typeof option === "string"
                ? option
                : `${option.name} (${option.email})`
            }
            inputValue={searchQuery}
            onInputChange={(_, value) => {
              handleSearchUsers(value);
              setInviteData({ ...inviteData, email: value });
            }}
            onChange={(_, value) => {
              if (value && typeof value !== "string") {
                setInviteData({ ...inviteData, email: value.email });
                setSearchQuery(value.email);
              }
            }}
            filterOptions={(x) => x}
            renderOption={(props, option) => (
              <li {...props} key={option._id}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{option.email}</Typography>
                  </Box>
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search by name or email"
                placeholder="Type a name, username, or email..."
                required
                helperText="Search registered users to invite"
              />
            )}
          />
          <FormControl fullWidth>
            <InputLabel>Send via</InputLabel>
            <Select
              value={inviteData.method}
              label="Send via"
              onChange={(e) => setInviteData({ ...inviteData, method: e.target.value })}
            >
              <MenuItem value="email">📧 Email</MenuItem>
              <MenuItem value="whatsapp">💬 WhatsApp</MenuItem>
              <MenuItem value="sms">📱 SMS</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary">
            {inviteData.method === "whatsapp"
              ? "A WhatsApp message with join link will be opened"
              : inviteData.method === "sms"
              ? "An SMS with join link will be opened"
              : "User will receive an in-app invitation"}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInviteDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleInvite} disabled={!inviteData.email}>
            Send Invitation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settle Up Dialog */}
      <Dialog open={openSettleDialog} onClose={() => setOpenSettleDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Settle Up</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Pay to</InputLabel>
            <Select
              value={settleData.paidTo}
              label="Pay to"
              onChange={(e) => setSettleData({ ...settleData, paidTo: e.target.value })}
            >
              {group.members.map((m) => (
                <MenuItem key={m._id} value={m._id}>{m.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Amount (₹)"
            type="number"
            value={settleData.amount}
            onChange={(e) => setSettleData({ ...settleData, amount: e.target.value })}
            required
          />
          <TextField
            label="Notes (optional)"
            value={settleData.notes}
            onChange={(e) => setSettleData({ ...settleData, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSettleDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSettleUp} disabled={!settleData.paidTo || !settleData.amount}>
            Record Payment
          </Button>
        </DialogActions>
      </Dialog>

      <PositionedSnackbar
        open={snackbar.open}
        message={snackbar.message}
        success={snackbar.success}
        onClose={() => setSnackbar({ open: false, message: "", success: false })}
      />
    </Box>
  );
}
