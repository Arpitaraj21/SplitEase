import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Autocomplete,
  Tab,
  Tabs,
  Grid,
  LinearProgress,
} from "@mui/material";
import { useState, useEffect } from "react";
import { directExpenseService } from "../services/directExpense";
import { invitationService } from "../services/invitation";
import PositionedSnackbar from "../utils/snackbar";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import HandshakeIcon from "@mui/icons-material/Handshake";

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

interface ContactOption {
  name: string;
  email: string;
  phone: string;
}

interface DirectBalance {
  user: { _id: string; name: string; email: string; profileImage?: string };
  amount: number;
}

interface DirectExpense {
  _id: string;
  description: string;
  amount: number;
  paidBy: { _id: string; name: string; email: string; profileImage?: string };
  owedBy: { _id: string; name: string; email: string; profileImage?: string };
  splitType: "equal" | "full";
  owedAmount: number;
  category: string;
  settled: boolean;
  notes?: string;
  createdAt: string;
}

export default function Friends() {
  const [balances, setBalances] = useState<DirectBalance[]>([]);
  const [expenses, setExpenses] = useState<DirectExpense[]>([]);
  const [totalOwed, setTotalOwed] = useState(0);
  const [totalOwe, setTotalOwe] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<DirectExpense | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", success: false });

  const [googleContacts, setGoogleContacts] = useState<ContactOption[]>([]);
  const [contactsLoaded, setContactsLoaded] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactOption | null>(null);

  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    owedByEmail: "",
    splitType: "equal" as "equal" | "full",
    category: "other",
    notes: "",
  });

  const [editExpense, setEditExpense] = useState({
    description: "",
    amount: "",
    splitType: "equal" as "equal" | "full",
    category: "other",
    notes: "",
  });

  const fetchBalances = async () => {
    try {
      const resp = await directExpenseService.getBalances();
      setBalances(resp.balances);
      setTotalOwed(resp.totalOwed);
      setTotalOwe(resp.totalOwe);
    } catch (error) {
      console.log("error fetching balances", error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const resp = await directExpenseService.getAll();
      setExpenses(resp.expenses);
    } catch (error) {
      console.log("error fetching expenses", error);
    }
  };

  const fetchGoogleContacts = async () => {
    if (contactsLoaded) return;
    try {
      const resp = await invitationService.getGoogleContacts();
      if (resp.success) {
        setGoogleContacts(resp.contacts);
      }
    } catch (error) {
      console.log("Could not load contacts:", error);
    } finally {
      setContactsLoaded(true);
    }
  };

  useEffect(() => {
    fetchBalances();
    fetchExpenses();
    fetchGoogleContacts();
  }, []);

  const handleAddExpense = async () => {
    try {
      await directExpenseService.create({
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
        owedByEmail: newExpense.owedByEmail,
        splitType: newExpense.splitType,
        category: newExpense.category,
        notes: newExpense.notes,
      });
      setSnackbar({ open: true, message: "Expense added!", success: true });
      setOpenAddDialog(false);
      setNewExpense({ description: "", amount: "", owedByEmail: "", splitType: "equal", category: "other", notes: "" });
      setSelectedContact(null);
      fetchBalances();
      fetchExpenses();
    } catch (error: any) {
      setSnackbar({ open: true, message: error?.message || "Failed to add", success: false });
    }
  };

  const handleOpenEdit = (expense: DirectExpense) => {
    setEditingExpense(expense);
    setEditExpense({
      description: expense.description,
      amount: expense.amount.toString(),
      splitType: expense.splitType,
      category: expense.category,
      notes: expense.notes || "",
    });
    setOpenEditDialog(true);
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense) return;
    try {
      await directExpenseService.update(editingExpense._id, {
        description: editExpense.description,
        amount: parseFloat(editExpense.amount),
        splitType: editExpense.splitType,
        category: editExpense.category,
        notes: editExpense.notes,
      });
      setSnackbar({ open: true, message: "Expense updated!", success: true });
      setOpenEditDialog(false);
      setEditingExpense(null);
      fetchBalances();
      fetchExpenses();
    } catch (error: any) {
      setSnackbar({ open: true, message: error?.message || "Failed to update", success: false });
    }
  };

  const handleSettle = async (userId: string, userName: string) => {
    try {
      await directExpenseService.settleUp(userId);
      setSnackbar({ open: true, message: `Settled up with ${userName}!`, success: true });
      fetchBalances();
      fetchExpenses();
    } catch (error: any) {
      setSnackbar({ open: true, message: error?.message || "Failed to settle", success: false });
    }
  };

  const handleDelete = async (expenseId: string) => {
    try {
      await directExpenseService.delete(expenseId);
      setSnackbar({ open: true, message: "Expense deleted", success: true });
      fetchBalances();
      fetchExpenses();
    } catch (error: any) {
      setSnackbar({ open: true, message: error?.message || "Failed to delete", success: false });
    }
  };

  const getCategoryEmoji = (category: string) => {
    return CATEGORIES.find((c) => c.value === category)?.label || "📋 Other";
  };

  // For visualization - max amount for bar scaling
  const maxBalance = Math.max(...balances.map((b) => Math.abs(b.amount)), 1);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Friends
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAddDialog(true)}>
          Add Expense
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <Card sx={{ bgcolor: "#e8f5e9" }}>
            <CardContent sx={{ textAlign: "center", py: 1.5, "&:last-child": { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">Owes you</Typography>
              <Typography variant="h6" fontWeight="bold" color="success.main">
                ₹{totalOwed.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card sx={{ bgcolor: "#ffebee" }}>
            <CardContent sx={{ textAlign: "center", py: 1.5, "&:last-child": { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">You owe</Typography>
              <Typography variant="h6" fontWeight="bold" color="error.main">
                ₹{totalOwe.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card sx={{ bgcolor: "#e3f2fd" }}>
            <CardContent sx={{ textAlign: "center", py: 1.5, "&:last-child": { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">Net</Typography>
              <Typography
                variant="h6"
                fontWeight="bold"
                color={(totalOwed - totalOwe) >= 0 ? "success.main" : "error.main"}
              >
                ₹{Math.abs(totalOwed - totalOwe).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
        <Tab label="Balances" />
        <Tab label="Contacts" />
        <Tab label="History" />
      </Tabs>

      {/* Balances Tab - Visual bars */}
      {tabValue === 0 && (
        <Box>
          {balances.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: "center", mt: 4 }}>
              No balances yet. Add an expense with a friend!
            </Typography>
          ) : (
            <Box>
              {balances
                .filter((b) => Math.abs(b.amount) > 0.01)
                .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
                .map((b) => (
                  <Card key={b.user._id} sx={{ mb: 1.5, overflow: "visible" }}>
                    <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                        <Avatar src={b.user.profileImage || undefined} sx={{ width: 36, height: 36 }}>
                          {b.user.name?.[0]?.toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={600}>{b.user.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{b.user.email}</Typography>
                        </Box>
                        <Typography
                          fontWeight="bold"
                          variant="body2"
                          color={b.amount > 0 ? "success.main" : "error.main"}
                        >
                          {b.amount > 0 ? `+₹${b.amount.toFixed(2)}` : `-₹${Math.abs(b.amount).toFixed(2)}`}
                        </Typography>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleSettle(b.user._id, b.user.name)}
                          title="Settle up"
                        >
                          <HandshakeIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      {/* Visual bar */}
                      <LinearProgress
                        variant="determinate"
                        value={(Math.abs(b.amount) / maxBalance) * 100}
                        color={b.amount > 0 ? "success" : "error"}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                        {b.amount > 0 ? "owes you" : "you owe"}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
            </Box>
          )}
        </Box>
      )}

      {/* Contacts Tab - Show Google Contacts */}
      {tabValue === 1 && (
        <Box>
          {googleContacts.length === 0 ? (
            <Box sx={{ textAlign: "center", mt: 4 }}>
              <Typography color="text.secondary">
                {contactsLoaded ? "No contacts found. Sign in with Google to sync your contacts." : "Loading contacts..."}
              </Typography>
            </Box>
          ) : (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {googleContacts.length} contacts from your Google account
              </Typography>
              <List sx={{ maxHeight: "60vh", overflow: "auto" }}>
                {googleContacts.map((contact, idx) => (
                  <ListItem
                    key={contact.email || `${contact.name}-${idx}`}
                    sx={{ border: "1px solid #f0f0f0", borderRadius: 1, mb: 0.5 }}
                    secondaryAction={
                      contact.email && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setSelectedContact(contact);
                            setNewExpense({ ...newExpense, owedByEmail: contact.email });
                            setOpenAddDialog(true);
                          }}
                        >
                          Split
                        </Button>
                      )
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: "#4687ff" }}>
                        {contact.name?.[0]?.toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={contact.name}
                      secondary={`${contact.email}${contact.phone ? ` • ${contact.phone}` : ""}`}
                      primaryTypographyProps={{ variant: "body2", fontWeight: 500 }}
                      secondaryTypographyProps={{ variant: "caption" }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Box>
      )}

      {/* History Tab */}
      {tabValue === 2 && (
        <Box>
          {expenses.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: "center", mt: 4 }}>
              No expenses yet.
            </Typography>
          ) : (
            <List>
              {expenses.map((exp) => (
                <ListItem
                  key={exp._id}
                  sx={{
                    border: "1px solid #eee",
                    borderRadius: 1,
                    mb: 1,
                    opacity: exp.settled ? 0.5 : 1,
                  }}
                  secondaryAction={
                    !exp.settled && (
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <IconButton size="small" onClick={() => handleOpenEdit(exp)} title="Edit">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(exp._id)} title="Delete">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "#4687ff", width: 32, height: 32, fontSize: 14 }}>
                      {exp.paidBy.name?.[0]?.toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2" fontWeight="500">{exp.description}</Typography>
                        <Chip label={getCategoryEmoji(exp.category)} size="small" variant="outlined" sx={{ height: 20, fontSize: 11 }} />
                        {exp.settled && <Chip label="Settled" size="small" color="success" sx={{ height: 20, fontSize: 11 }} />}
                      </Box>
                    }
                    secondary={`${exp.paidBy.name} paid ₹${exp.amount} → ${exp.owedBy.name} owes ₹${exp.owedAmount} • ${new Date(exp.createdAt).toLocaleDateString()}`}
                    secondaryTypographyProps={{ variant: "caption" }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      )}

      {/* Add Expense Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Split with a Friend</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Description"
            value={newExpense.description}
            onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
            placeholder="e.g. Dinner, Cab ride, Movie tickets"
            required
          />
          <TextField
            label="Total Amount (₹)"
            type="number"
            value={newExpense.amount}
            onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
            required
          />

          {/* Google Contacts Picker */}
          <Autocomplete
            options={googleContacts.filter((c) => c.email)}
            getOptionLabel={(option) => `${option.name} (${option.email})`}
            value={selectedContact}
            onChange={(_, value) => {
              setSelectedContact(value);
              setNewExpense({ ...newExpense, owedByEmail: value?.email || "" });
            }}
            onOpen={fetchGoogleContacts}
            filterOptions={(options, { inputValue }) => {
              const query = inputValue.toLowerCase();
              return options.filter(
                (opt) =>
                  opt.name.toLowerCase().includes(query) ||
                  opt.email.toLowerCase().includes(query)
              );
            }}
            renderOption={(props, option) => (
              <li {...props} key={option.email}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>
                    {option.name?.[0]?.toUpperCase()}
                  </Avatar>
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
                label="Select from your contacts"
                placeholder="Search contacts by name..."
                required
                helperText="Pick a person from your Google Contacts"
              />
            )}
          />

          <FormControl fullWidth>
            <InputLabel>Split Type</InputLabel>
            <Select
              value={newExpense.splitType}
              label="Split Type"
              onChange={(e) => setNewExpense({ ...newExpense, splitType: e.target.value as "equal" | "full" })}
            >
              <MenuItem value="equal">Split Equally (50/50)</MenuItem>
              <MenuItem value="full">They owe the full amount</MenuItem>
            </Select>
          </FormControl>
          {newExpense.amount && (
            <Typography variant="body2" color="text.secondary" sx={{ bgcolor: "#f5f5f5", p: 1.5, borderRadius: 1 }}>
              💡 {newExpense.splitType === "equal"
                ? `They'll owe you ₹${(parseFloat(newExpense.amount) / 2).toFixed(2)}`
                : `They'll owe you ₹${parseFloat(newExpense.amount || "0").toFixed(2)}`}
            </Typography>
          )}
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
          <TextField
            label="Notes (optional)"
            value={newExpense.notes}
            onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddExpense}
            disabled={!newExpense.description || !newExpense.amount || !newExpense.owedByEmail}
          >
            Add Expense
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Expense</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          {editingExpense && (
            <Typography variant="body2" color="text.secondary" sx={{ bgcolor: "#f0f0f0", p: 1, borderRadius: 1 }}>
              With: {editingExpense.owedBy.name} ({editingExpense.owedBy.email})
            </Typography>
          )}
          <TextField
            label="Description"
            value={editExpense.description}
            onChange={(e) => setEditExpense({ ...editExpense, description: e.target.value })}
            required
          />
          <TextField
            label="Total Amount (₹)"
            type="number"
            value={editExpense.amount}
            onChange={(e) => setEditExpense({ ...editExpense, amount: e.target.value })}
            required
          />
          <FormControl fullWidth>
            <InputLabel>Split Type</InputLabel>
            <Select
              value={editExpense.splitType}
              label="Split Type"
              onChange={(e) => setEditExpense({ ...editExpense, splitType: e.target.value as "equal" | "full" })}
            >
              <MenuItem value="equal">Split Equally (50/50)</MenuItem>
              <MenuItem value="full">They owe the full amount</MenuItem>
            </Select>
          </FormControl>
          {editExpense.amount && (
            <Typography variant="body2" color="text.secondary" sx={{ bgcolor: "#f5f5f5", p: 1.5, borderRadius: 1 }}>
              💡 {editExpense.splitType === "equal"
                ? `They'll owe ₹${(parseFloat(editExpense.amount) / 2).toFixed(2)}`
                : `They'll owe ₹${parseFloat(editExpense.amount || "0").toFixed(2)}`}
            </Typography>
          )}
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={editExpense.category}
              label="Category"
              onChange={(e) => setEditExpense({ ...editExpense, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Notes (optional)"
            value={editExpense.notes}
            onChange={(e) => setEditExpense({ ...editExpense, notes: e.target.value })}
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUpdateExpense}
            disabled={!editExpense.description || !editExpense.amount}
          >
            Save Changes
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
