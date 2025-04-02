import { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import { BASE_URL } from '../constants';

export default function TestApiPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState<string>('');

  useEffect(() => {
    setBaseUrl(BASE_URL);
  }, []);

  const testDirectApi = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch(`${BASE_URL}/hello`);
      const textResponse = await response.text();
      
      try {
        const jsonData = JSON.parse(textResponse);
        setResult({
          status: response.status,
          data: jsonData
        });
      } catch (e: unknown) {
        setError(`Invalid JSON response: ${textResponse.substring(0, 100)}...`);
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      setError(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const testProxyApi = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/test-backend');
      const data = await response.json();
      setResult({
        status: response.status,
        data
      });
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      setError(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        API Connection Test
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Current API Configuration
        </Typography>
        <Typography>
          BASE_URL: {baseUrl}
        </Typography>
      </Paper>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button 
          variant="contained" 
          onClick={testDirectApi}
          disabled={loading}
        >
          Test Direct API Connection
        </Button>
        
        <Button 
          variant="contained" 
          onClick={testProxyApi}
          disabled={loading}
        >
          Test Proxy API Connection
        </Button>
      </Box>
      
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
      
      {result && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            API Response (Status: {result.status})
          </Typography>
          <Box component="pre" sx={{ 
            p: 2, 
            bgcolor: '#f5f5f5', 
            borderRadius: 1,
            overflow: 'auto',
            maxHeight: 400
          }}>
            {JSON.stringify(result.data, null, 2)}
          </Box>
        </Paper>
      )}
    </Box>
  );
}