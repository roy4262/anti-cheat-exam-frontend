import { GetServerSideProps } from 'next';
import { getSession, signIn, signOut, useSession } from 'next-auth/react';
import { useState } from 'react';
import { Button, Container, TextField, Typography, Box, Paper, Divider } from '@mui/material';
import { BASE_URL } from '../constants';

// Define the interface for test results
interface TestResult {
  action: string;
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
  statusText?: string;
}

interface TestPageProps {
  backendUrl: string;
  session: any;
}

export default function TestPage({ backendUrl }: TestPageProps) {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result) {
        setTestResult({
          action: 'Login',
          success: !result.error,
          data: result,
        });
      }
    } catch (error: any) {
      setTestResult({
        action: 'Login',
        success: false,
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut({ redirect: false });
      setTestResult({
        action: 'Logout',
        success: true,
      });
    } catch (error: any) {
      setTestResult({
        action: 'Logout',
        success: false,
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const testBackendConnection = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/test-connection');
      const data = await res.json();
      setTestResult({
        action: 'Backend Connection Test',
        success: data.success,
        data,
      });
    } catch (error: any) {
      setTestResult({
        action: 'Backend Connection Test',
        success: false,
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const testDashboardAccess = async () => {
    setLoading(true);
    try {
      const res = await fetch('/dashboard');
      setTestResult({
        action: 'Dashboard Access Test',
        success: res.ok,
        status: res.status,
        statusText: res.statusText,
      });
    } catch (error: any) {
      setTestResult({
        action: 'Dashboard Access Test',
        success: false,
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        System Test Page
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          System Information
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1">
            <strong>Authentication Status:</strong> {status}
          </Typography>
          <Typography variant="body1">
            <strong>Backend URL:</strong> {backendUrl}
          </Typography>
        </Box>
        
        <Typography variant="h6" gutterBottom>
          Session Data
        </Typography>
        <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, overflow: 'auto' }}>
          <pre>{JSON.stringify(session, null, 2)}</pre>
        </Box>
      </Paper>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={testBackendConnection}
          disabled={loading}
        >
          Test Backend Connection
        </Button>
        
        <Button 
          variant="contained" 
          color="secondary" 
          onClick={testDashboardAccess}
          disabled={loading}
        >
          Test Dashboard Access
        </Button>
        
        {session ? (
          <Button 
            variant="outlined" 
            color="error" 
            onClick={handleLogout}
            disabled={loading}
          >
            Sign Out
          </Button>
        ) : null}
      </Box>
      
      {!session && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Test Login
          </Typography>
          <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
            />
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={loading}
            >
              Sign In
            </Button>
          </Box>
        </Paper>
      )}
      
      {testResult && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Test Result: {testResult.action}
          </Typography>
          <Typography variant="body1" color={testResult.success ? 'success.main' : 'error.main'} gutterBottom>
            Status: {testResult.success ? 'Success' : 'Failed'}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, overflow: 'auto' }}>
            <pre>{JSON.stringify(testResult, null, 2)}</pre>
          </Box>
        </Paper>
      )}
    </Container>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  
  return {
    props: {
      session,
      backendUrl: BASE_URL,
    },
  };
};