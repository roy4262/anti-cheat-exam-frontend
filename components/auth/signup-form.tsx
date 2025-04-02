import { Avatar, Button, CssBaseline, TextField, Typography, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { Box, Container } from "@mui/system";
import { LoadingBarRef } from "react-top-loading-bar";
import { signupUser } from "../../helpers/api/auth-api";
import { SignupCredentials } from "../../models/auth-models";

interface SignupFormProps {
  loadingBarRef: React.RefObject<LoadingBarRef>;
}

const SignupForm: React.FC<SignupFormProps> = ({ loadingBarRef }) => {
  const router = useRouter();

  const [formData, setData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    firstName: "",
    lastName: "",
    studentId: "",
    teacherId: "",
  });

  const [errors, setErrors] = useState({
    emailError: "",
    passwordError: "",
    confirmPasswordError: "",
    firstNameError: "",
    idError: "",
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: value,
    }));
    validateInput(name, value);
  };

  const validateInput = (name: string, value: string) => {
    const newErrors = { ...errors };

    switch (name) {
      case "email":
        newErrors.emailError = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ? ""
          : "Please enter a valid email";
        break;
      case "password":
        newErrors.passwordError =
          value.length >= 6 ? "" : "Password must be at least 6 characters";
        break;
      case "confirmPassword":
        newErrors.confirmPasswordError =
          value === formData.password ? "" : "Passwords do not match";
        break;
      case "firstName":
        newErrors.firstNameError = value ? "" : "First name is required";
        break;
      case "studentId":
        if (formData.role === "student") {
          newErrors.idError = value ? "" : "Student ID is required";
        }
        break;
      case "teacherId":
        if (formData.role === "teacher") {
          newErrors.idError = value ? "" : "Teacher ID is required";
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    // Validate all fields
    Object.keys(formData).forEach((key) =>
      validateInput(key, formData[key as keyof typeof formData])
    );

    // Check for errors
    if (Object.values(errors).some((error) => error !== "")) {
      toast.error("Please fix all errors before submitting");
      return;
    }

    setLoading(true);
    loadingBarRef.current?.continuousStart();

    try {
      const credentials: SignupCredentials = {
        email: formData.email,
        password: formData.password,
        role: formData.role as "student" | "teacher",
        firstName: formData.firstName,
        lastName: formData.lastName,
        studentId: formData.role === "student" ? formData.studentId : undefined,
        teacherId: formData.role === "teacher" ? formData.teacherId : undefined,
      };

      const response = await signupUser(credentials);
      toast.success("Signup successful! Please login.");
      router.push("/auth/login");
    } catch (error: any) {
      toast.error(error.message || 'Signup failed, please try again!');
    } finally {
      setLoading(false);
      loadingBarRef.current?.complete();
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
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: "primary.main" }} />
        <Typography component="h1" variant="h5">
          Sign Up
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleInputChange}
            error={!!errors.emailError}
            helperText={errors.emailError}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            value={formData.password}
            onChange={handleInputChange}
            error={!!errors.passwordError}
            helperText={errors.passwordError}
            autoComplete="new-password"
            inputProps={{
              "aria-label": "Password"
            }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            error={!!errors.confirmPasswordError}
            helperText={errors.confirmPasswordError}
            autoComplete="new-password"
            inputProps={{
              "aria-label": "Confirm Password"
            }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="role-label" htmlFor="role">Role</InputLabel>
            <Select
              labelId="role-label"
              id="role"
              name="role"
              value={formData.role}
              label="Role"
              onChange={handleInputChange}
              inputProps={{
                "aria-label": "User Role"
              }}
            >
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="teacher">Teacher</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="normal"
            required
            fullWidth
            name="firstName"
            label="First Name"
            id="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            error={!!errors.firstNameError}
            helperText={errors.firstNameError}
            autoComplete="given-name"
            inputProps={{
              "aria-label": "First Name"
            }}
          />
          <TextField
            margin="normal"
            fullWidth
            name="lastName"
            label="Last Name"
            id="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            autoComplete="family-name"
            inputProps={{
              "aria-label": "Last Name"
            }}
          />
          {formData.role === "student" && (
            <TextField
              margin="normal"
              required
              fullWidth
              name="studentId"
              label="Student ID"
              id="studentId"
              value={formData.studentId}
              onChange={handleInputChange}
              error={!!errors.idError}
              helperText={errors.idError}
              autoComplete="off"
              inputProps={{
                "aria-label": "Student ID"
              }}
            />
          )}
          {formData.role === "teacher" && (
            <TextField
              margin="normal"
              required
              fullWidth
              name="teacherId"
              label="Teacher ID"
              id="teacherId"
              value={formData.teacherId}
              onChange={handleInputChange}
              error={!!errors.idError}
              helperText={errors.idError}
              autoComplete="off"
              inputProps={{
                "aria-label": "Teacher ID"
              }}
            />
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default SignupForm;