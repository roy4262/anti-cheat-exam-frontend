import { useState } from 'react';
import { Box, Button, Typography, TextField, Paper, CircularProgress, Alert, Divider } from '@mui/material';
import { useSession, signIn, signOut } from 'next-auth/react';
import { loginUser, signupUser } from '../helpers/api/auth-api';
import { BASE_URL } from '../constants';
import Head from 'next/head';

export default function DebugAuthPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'student',
    studentId: ''
  });

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignupData(prev => ({ ...prev, [name]: value }));
  };

  const handleDirectLogin = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setApiResponse(null);
    
    try {
      const response = await loginUser({
        email: loginData.email,
        password: loginData.password
      });
      
      setSuccess('Direct API login successful');
      setApiResponse(response);
    } catch (e) {
      setError(`Direct API login failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleNextAuthLogin = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setApiResponse(null);
    
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: loginData.email,
        password: loginData.password
      });
      
      if (result?.error) {
        setError(`NextAuth login failed: ${result.error}`);
      } else {
        setSuccess('NextAuth login successful');
      }
    } catch (e) {
      setError(`NextAuth login error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setApiResponse(null);
    
    try {
      const response = await signupUser({
        email: signupData.email,
        password: signupData.password,
        firstName: signupData.firstName,
        lastName: signupData.lastName,
        role: signupData.role as 'student' | 'teacher',
        studentId: signupData.studentId
      });
      
      setSuccess('Signup successful');
      setApiResponse(response);
    } catch (e) {
      setError(`Signup failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    setSuccess('Signed out successfully');
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 4 }}>
      <Head>
        <title>Debug Authentication</title>
      </Head>
      
      <Typography variant="h4" component="h1" gutterBottom>
        Debug Authentication
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Current Configuration
        </Typography>
        <Typography>
          BASE_URL: {BASE_URL}
        </Typography>
        <Typography>
          Session Status: {status}
        </Typography>
        {session && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">Session Data:</Typography>
            <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
              {JSON.stringify(session, null, 2)}
            </pre>
            <Button 
              variant="outlined" 
              color="error" 
              onClick={handleSignOut}
              sx={{ mt: 2 }}
            >
              Sign Out
            </Button>
          </Box>
        )}
      </Paper>
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        <Paper sx={{ p: 3, mb: 3, flex: 1, minWidth: '300px' }}>
          <Typography variant="h6" gutterBottom>
            Test Login
          </Typography>
          
          <TextField
            label="Email"
            name="email"
            value={loginData.email}
            onChange={handleLoginChange}
            fullWidth
            margin="normal"
          />
          
          <TextField
            label="Password"
            name="password"
            type="password"
            value={loginData.password}
            onChange={handleLoginChange}
            fullWidth
            margin="normal"
          />
          
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              onClick={handleDirectLogin}
              disabled={loading || !loginData.email || !loginData.password}
            >
              Direct API Login
            </Button>
            
            <Button 
              variant="contained" 
              color="secondary"
              onClick={handleNextAuthLogin}
              disabled={loading || !loginData.email || !loginData.password}
            >
              NextAuth Login
            </Button>
          </Box>
        </Paper>
        
        <Paper sx={{ p: 3, mb: 3, flex: 1, minWidth: '300px' }}>
          <Typography variant="h6" gutterBottom>
            Test Signup
          </Typography>
          
          <TextField
            label="Email"
            name="email"
            value={signupData.email}
            onChange={handleSignupChange}
            fullWidth
            margin="normal"
          />
          
          <TextField
            label="Password"
            name="password"
            type="password"
            value={signupData.password}
            onChange={handleSignupChange}
            fullWidth
            margin="normal"
          />
          
          <TextField
            label="First Name"
            name="firstName"
            value={signupData.firstName}
            onChange={handleSignupChange}
            fullWidth
            margin="normal"
          />
          
          <TextField
            label="Last Name"
            name="lastName"
            value={signupData.lastName}
            onChange={handleSignupChange}
            fullWidth
            margin="normal"
          />
          
          <TextField
            label="Student ID"
            name="studentId"
            value={signupData.studentId}
            onChange={handleSignupChange}
            fullWidth
            margin="normal"
          />
          
          <Button 
            variant="contained" 
            onClick={handleSignup}
            disabled={loading || !signupData.email || !signupData.password || !signupData.firstName}
            sx={{ mt: 3 }}
            fullWidth
          >
            Test Signup
          </Button>
        </Paper>
      </Box>
      
      {apiResponse && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            API Response
          </Typography>
          <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </Paper>
      )}
    </Box>
  );
}