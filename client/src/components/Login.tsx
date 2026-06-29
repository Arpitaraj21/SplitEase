import { Paper, TextField, Box, Button, Typography, Divider } from "@mui/material";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, FormProvider } from "react-hook-form";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { userService } from "../services/user";
import { invitationService } from "../services/invitation";
import PositionedSnackbar from "../utils/snackbar";
import { HOST_API } from "../config-global";

export interface LoginForm {
  identifier: string;
  password: string;
}

export default function Login() {
  const [snackbar, setSnackbar] = useState({ open: false, message: "", success: false });
  const navigate = useNavigate();

  const LoginSchema = Yup.object({
    identifier: Yup.string()
      .required("Email or username is required")
      .test("is-valid-identifier", "Enter a valid email or username", (value) => {
        if (!value) return false;
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        if (value.includes("@")) return isEmail;
        return value.length >= 3;
      }),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  });

  const methods = useForm<LoginForm>({
    resolver: yupResolver(LoginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const { handleSubmit, register } = methods;

  const handleFormSubmit = async (data: LoginForm) => {
    try {
      const response = await userService.loginservice(data);
      localStorage.setItem("accessToken", "true");
      setSnackbar({ open: true, message: response.message, success: true });

      // Check for pending invitation
      const pendingInvite = localStorage.getItem("pendingInvite");
      if (pendingInvite) {
        localStorage.removeItem("pendingInvite");
        try {
          const resp = await invitationService.acceptInvitation(pendingInvite);
          setTimeout(() => navigate(`/groups/${resp.groupId}`), 1000);
          return;
        } catch {
          // ignore - just go to dashboard
        }
      }

      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (error: any) {
      setSnackbar({ open: true, message: error?.message || "Login failed!", success: false });
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${HOST_API}/auth/google`;
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
              marginTop: "10%",
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
              }}
            >
              <Typography
                sx={{
                  textAlign: "center",
                  fontSize: "25px",
                  color: "black",
                  fontWeight: "bold",
                  zIndex: 2,
                }}
              >
                Login
              </Typography>

              <TextField
                label="Email or Username"
                {...register("identifier")}
                error={!!methods.formState.errors.identifier}
                helperText={methods.formState.errors.identifier?.message}
              />

              <TextField
                label="Password"
                type="password"
                {...register("password")}
                error={!!methods.formState.errors.password}
                helperText={methods.formState.errors.password?.message}
              />

              <Button variant="contained" sx={{ mt: 2 }} type="submit">
                Login
              </Button>

              <Divider sx={{ my: 1 }}>OR</Divider>

              <Button
                variant="outlined"
                onClick={handleGoogleLogin}
                sx={{ textTransform: "none" }}
              >
                🔑 Continue with Google
              </Button>

              <Typography sx={{ textAlign: "center", fontSize: "15px", fontWeight: "500", zIndex: 2 }}>
                Don't have an account?{" "}
                <a href="/signup" style={{ color: "#1464db" }}>
                  Sign up
                </a>
              </Typography>
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
