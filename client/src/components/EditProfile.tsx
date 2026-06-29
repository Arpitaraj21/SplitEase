import { Paper, TextField, Box, Button, Typography, Avatar, IconButton } from "@mui/material";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, FormProvider } from "react-hook-form";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PositionedSnackbar from "../utils/snackbar";
import { userService } from "../services/user";
import CameraAltIcon from "@mui/icons-material/CameraAlt";

interface EditUserForm {
  name: string;
  username: string;
  password: string;
}

export default function EditUserProfile() {
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = useState({ open: false, message: "", success: false });
  const [profileImage, setProfileImage] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const UserValidationSchema = Yup.object().shape({
    name: Yup.string().required("Name is required"),
    username: Yup.string().required("Username is required"),
    password: Yup.string().min(6, "Password must be at least 6 characters"),
  });

  const methods = useForm<EditUserForm>({
    resolver: yupResolver(UserValidationSchema),
  });

  const { handleSubmit, register, reset } = methods;

  const getProfileDetails = async () => {
    try {
      const resp = await userService.getProfileservice();
      const user = resp.user;
      reset({
        name: user.name,
        username: user.username,
        password: "",
      });
      if (user.profileImage) {
        setProfileImage(user.profileImage);
      }
    } catch (error) {
      console.log("error fetching profile", error);
    }
  };

  useEffect(() => {
    getProfileDetails();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSnackbar({ open: true, message: "Image must be less than 5MB", success: false });
      return;
    }

    setUploading(true);
    try {
      const resp = await userService.uploadProfileImage(file);
      setProfileImage(resp.profileImage);
      setSnackbar({ open: true, message: "Photo uploaded!", success: true });
    } catch (error: any) {
      setSnackbar({ open: true, message: error?.message || "Upload failed", success: false });
    } finally {
      setUploading(false);
    }
  };

  const handleFormSubmit = async (data: EditUserForm) => {
    try {
      const updateData: Record<string, string> = {
        name: data.name,
        username: data.username,
      };
      if (data.password) {
        updateData.password = data.password;
      }

      await userService.editProfileservice(updateData);
      setSnackbar({ open: true, message: "Profile updated", success: true });
      setTimeout(() => navigate("/account"), 1500);
    } catch (error: any) {
      setSnackbar({ open: true, message: error?.message || "Update failed", success: false });
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <FormProvider {...methods}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "100%",
              width: "100%",
              marginTop: "5%",
            }}
          >
            <Paper
              sx={{
                width: "30vw",
                minWidth: 320,
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: 2,
                alignItems: "center",
              }}
            >
              <Typography
                sx={{
                  textAlign: "center",
                  fontSize: "25px",
                  color: "black",
                  fontWeight: "bold",
                }}
              >
                Edit Profile
              </Typography>

              {/* Profile Photo Upload */}
              <Box sx={{ position: "relative", mb: 1 }}>
                <Avatar
                  src={profileImage || undefined}
                  sx={{ width: 100, height: 100, fontSize: 40 }}
                >
                  {!profileImage && "?"}
                </Avatar>
                <IconButton
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    bgcolor: "primary.main",
                    color: "white",
                    width: 32,
                    height: 32,
                    "&:hover": { bgcolor: "primary.dark" },
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <CameraAltIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  hidden
                  onChange={handleImageUpload}
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {uploading ? "Uploading..." : "Click the camera icon to change photo"}
              </Typography>

              <TextField
                label="Name"
                fullWidth
                {...register("name")}
                error={!!methods.formState.errors.name}
                helperText={methods.formState.errors.name?.message}
              />
              <TextField
                label="Username"
                fullWidth
                {...register("username")}
                error={!!methods.formState.errors.username}
                helperText={methods.formState.errors.username?.message}
              />
              <TextField
                label="New Password (leave blank to keep current)"
                type="password"
                fullWidth
                {...register("password")}
                error={!!methods.formState.errors.password}
                helperText={methods.formState.errors.password?.message}
              />
              <Button variant="contained" sx={{ mt: 2 }} type="submit" fullWidth>
                Save Changes
              </Button>
              <Button variant="text" onClick={() => navigate("/account")} fullWidth>
                Cancel
              </Button>
            </Paper>
          </Box>
        </FormProvider>
      </form>

      <PositionedSnackbar
        open={snackbar.open}
        message={snackbar.message}
        success={snackbar.success}
        onClose={() => setSnackbar({ open: false, message: "", success: false })}
      />
    </>
  );
}
