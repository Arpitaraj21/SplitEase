import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  AvatarGroup,
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
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { groupService } from "../services/group";
import { invitationService } from "../services/invitation";
import PositionedSnackbar from "../utils/snackbar";
import type { Group } from "../types/User";
import CloseIcon from "@mui/icons-material/Close";

const GROUP_CATEGORIES = [
  { value: "home", label: "🏠 Home" },
  { value: "trip", label: "✈️ Trip" },
  { value: "couple", label: "💑 Couple" },
  { value: "friends", label: "👫 Friends" },
  { value: "work", label: "💼 Work" },
  { value: "other", label: "📋 Other" },
];

interface ContactOption {
  name: string;
  email: string;
  phone: string;
}

export default function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: "", description: "", category: "other" });
  const [selectedMembers, setSelectedMembers] = useState<ContactOption[]>([]);
  const [googleContacts, setGoogleContacts] = useState<ContactOption[]>([]);
  const [contactsLoaded, setContactsLoaded] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", success: false });
  const navigate = useNavigate();

  const fetchGroups = async () => {
    try {
      const resp = await groupService.getGroups();
      setGroups(resp.groups);
    } catch (error) {
      console.log("error fetching groups", error);
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
      console.log("Could not load Google contacts:", error);
    } finally {
      setContactsLoaded(true);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async () => {
    try {
      const memberEmails = selectedMembers
        .map((m) => m.email)
        .filter((e) => e.length > 0);

      await groupService.createGroup({
        name: newGroup.name,
        description: newGroup.description,
        category: newGroup.category,
        memberEmails,
      });

      setSnackbar({ open: true, message: "Group created!", success: true });
      setOpenDialog(false);
      setNewGroup({ name: "", description: "", category: "other" });
      setSelectedMembers([]);
      fetchGroups();
    } catch (error: any) {
      setSnackbar({ open: true, message: error?.message || "Failed to create group", success: false });
    }
  };

  const handleRemoveMember = (email: string) => {
    setSelectedMembers(selectedMembers.filter((m) => m.email !== email));
  };

  const getCategoryEmoji = (category: string) => {
    return GROUP_CATEGORIES.find((c) => c.value === category)?.label || "📋";
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          My Groups
        </Typography>
        <Button variant="contained" onClick={() => setOpenDialog(true)}>
          + Create Group
        </Button>
      </Box>

      {groups.length === 0 ? (
        <Box sx={{ textAlign: "center", mt: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No groups yet
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Create a group and start splitting expenses with friends
          </Typography>
          <Button variant="outlined" onClick={() => setOpenDialog(true)}>
            Create your first group
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 2 }}>
          {groups.map((group) => (
            <Card
              key={group._id}
              sx={{ cursor: "pointer", "&:hover": { boxShadow: 4 }, transition: "box-shadow 0.2s" }}
              onClick={() => navigate(`/groups/${group._id}`)}
            >
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Typography variant="h6">
                    {getCategoryEmoji(group.category)} {group.name}
                  </Typography>
                  <Chip label={group.category} size="small" variant="outlined" />
                </Box>
                {group.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {group.description}
                  </Typography>
                )}
                <Box sx={{ display: "flex", alignItems: "center", mt: 2, gap: 1 }}>
                  <AvatarGroup max={4}>
                    {group.members.map((member) => (
                      <Avatar key={member._id} sx={{ width: 28, height: 28, fontSize: 12 }}>
                        {member.name?.[0]?.toUpperCase()}
                      </Avatar>
                    ))}
                  </AvatarGroup>
                  <Typography variant="caption" color="text.secondary">
                    {group.members.length} member{group.members.length > 1 ? "s" : ""}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Create Group Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Group</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Group Name"
            value={newGroup.name}
            onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
            required
            fullWidth
          />
          <TextField
            label="Description (optional)"
            value={newGroup.description}
            onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={newGroup.category}
              label="Category"
              onChange={(e) => setNewGroup({ ...newGroup, category: e.target.value })}
            >
              {GROUP_CATEGORIES.map((cat) => (
                <MenuItem key={cat.value} value={cat.value}>
                  {cat.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Google Contacts Picker */}
          <Autocomplete
            multiple
            options={googleContacts.filter(
              (c) => c.email && !selectedMembers.some((m) => m.email === c.email)
            )}
            getOptionLabel={(option) => `${option.name} (${option.email})`}
            value={selectedMembers}
            onChange={(_, value) => setSelectedMembers(value)}
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
            renderTags={() => null}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Add members from contacts"
                placeholder="Search your contacts..."
                helperText="Select people from your Google Contacts to add to the group"
              />
            )}
          />

          {/* Selected Members List */}
          {selectedMembers.length > 0 && (
            <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 1, p: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
                {selectedMembers.length} member{selectedMembers.length > 1 ? "s" : ""} selected
              </Typography>
              <List dense>
                {selectedMembers.map((member) => (
                  <ListItem
                    key={member.email}
                    secondaryAction={
                      <IconButton edge="end" size="small" onClick={() => handleRemoveMember(member.email)}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>
                        {member.name?.[0]?.toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={member.name}
                      secondary={member.email}
                      primaryTypographyProps={{ variant: "body2" }}
                      secondaryTypographyProps={{ variant: "caption" }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateGroup} disabled={!newGroup.name.trim()}>
            Create
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
