import { Paper, TextField, Box, Button, Typography, Divider } from "@mui/material";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, FormProvider } from "react-hook-form";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { userService } from "../services/user";
import PositionedSnackbar from "../utils/snackbar";
import { HOST_API } from "../config-global";

export interface SignupForm {
  name: string;
  username: string;
  email: string;
  password: string;
}

export default function Signup() {
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = useState({ open: false, message: "", success: false });

  const UserValidationSchema = Yup.object().shape({
    name: Yup.string().required("Name is required").min(2, "Name must be at least 2 characters"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    username: Yup.string()
      .required("Username is required")
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username too long"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  });

  const methods = useForm<SignupForm>({
    resolver: yupResolver(UserValidationSchema),
    defaultValues: { name: "", email: "", username: "", password: "" },
  });

  const { handleSubmit, register } = methods;

  const handleFormSubmit = async (data: SignupForm) => {
    try {
      await userService.signupservice(data);
      setSnackbar({ open: true, message: "Account created! Redirecting...", success: true });
      localStorage.setItem("accessToken", "true");
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (error: any) {
      setSnackbar({ open: true, message: error?.message || "Signup failed", success: false });
    }
  };

  const handleGoogleSignup = () => {
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
                Sign Up
              </Typography>
              <TextField
                label="Name"
                {...register("name")}
                error={!!methods.formState.errors.name}
                helperText={methods.formState.errors.name?.message}
              />
              <TextField
                label="Email"
                {...register("email")}
                error={!!methods.formState.errors.email}
                helperText={methods.formState.errors.email?.message}
              />
              <TextField
                label="Username"
                {...register("username")}
                error={!!methods.formState.errors.username}
                helperText={methods.formState.errors.username?.message}
              />
              <TextField
                label="Password"
                type="password"
                {...register("password")}
                error={!!methods.formState.errors.password}
                helperText={methods.formState.errors.password?.message}
              />
              <Button variant="contained" sx={{ mt: 2 }} type="submit">
                Sign Up
              </Button>

              <Divider sx={{ my: 1 }}>OR</Divider>

              <Button variant="outlined" onClick={handleGoogleSignup} sx={{ textTransform: "none" }}>
                🔑 Sign up with Google
              </Button>

              <Typography sx={{ textAlign: "center", fontSize: "15px", fontWeight: "500", zIndex: 2 }}>
                Already have an account?{" "}
                <a href="/login" style={{ color: "#1464db" }}>
                  Login
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
