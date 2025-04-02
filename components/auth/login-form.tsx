import {
  Avatar,
  Button,
  CssBaseline,
  TextField,
  Typography,
} from "@mui/material";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";
import React, { useState } from "react";
import classes from "./login-form.module.scss";
import { toast } from "react-toastify";
import { Box, Container } from "@mui/system";
import Image from "next/image";
import { LoadingBarRef } from "react-top-loading-bar";

interface LoginFormProps {
  loadingBarRef: React.RefObject<LoadingBarRef>;
}

const LoginForm: React.FC<LoginFormProps> = ({ loadingBarRef }) => {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ emailError: "", passwordError: "" });
  const [loading, setLoading] = useState(false);

  const { email, password } = formData;
  const { emailError, passwordError } = errors;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setErrors((prev) => ({ ...prev, emailError: "Invalid email address" }));
    } else if (name === "password" && value.length < 6) {
      setErrors((prev) => ({ ...prev, passwordError: "Password too short" }));
    } else {
      setErrors((prev) => ({ ...prev, [`${name}Error`]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading || emailError || passwordError) return;

    setLoading(true);
    loadingBarRef?.current?.continuousStart(50);

    try {
      console.log("Attempting login with email:", email);

      console.log("Attempting to sign in with credentials");

      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      console.log("Login Result:", result);

      if (result?.error) {
        console.error("Login error:", result.error);
        throw new Error(result.error);
      }

      if (result?.ok) {
        console.log("Login successful, redirecting to dashboard");
        toast.success("Login successful!");

        // Add a small delay before redirecting
        setTimeout(() => {
          router.push("/dashboard");
        }, 500);
      } else {
        console.error("Login failed with unknown error");
        throw new Error("Login failed with unknown error");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error(`Login failed: ${error.message || "Please try again."}`);
    } finally {
      setLoading(false);
      loadingBarRef?.current?.complete();
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "2rem",
          border: "1px solid #ccc",
          borderRadius: "8px",
        }}
      >
        <Avatar sx={{ height: 80, width: 80, mb: 2 }}>
          <Image src="/images/logo.png" alt="Logo" width={80} height={80} />
        </Avatar>
        <Typography component="h1" variant="h5">
          Anti-Cheat Exam App
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            label="Email Address"
            name="email"
            id="email"
            value={email}
            onChange={handleInputChange}
            required
            fullWidth
            margin="normal"
            error={!!emailError}
            helperText={emailError}
            autoComplete="email"
            inputProps={{
              "aria-label": "Email Address"
            }}
          />
          <TextField
            label="Password"
            name="password"
            id="password"
            value={password}
            onChange={handleInputChange}
            type="password"
            required
            fullWidth
            margin="normal"
            error={!!passwordError}
            helperText={passwordError}
            autoComplete="current-password"
            inputProps={{
              "aria-label": "Password"
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 2 }}
            disabled={loading || !!emailError || !!passwordError}
          >
            Sign In
          </Button>
          <Link href="/auth/signup" passHref>
            <Button fullWidth variant="text" sx={{ mt: 1 }}>
              Don't have an account? Sign Up
            </Button>
          </Link>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginForm;
