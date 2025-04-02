import { useState } from 'react';
import { Box, Button, Typography, TextField, Paper, CircularProgress, Alert } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function DirectExamPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [examId, setExamId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartExam = () => {
    if (!examId.trim()) {
      setError('Please enter an exam ID');
      return;
    }

    setLoading(true);
    setError(null);
    
    // Navigate to the start-exam page with the provided ID
    router.push(`/start-exam/${examId.trim()}`);
  };

  if (!session) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', p: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Please log in to start an exam
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => router.push('/auth/login')}
        >
          Go to Login
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 4 }}>
      <Head>
        <title>Start Exam Directly</title>
      </Head>
      
      <Typography variant="h4" component="h1" gutterBottom>
        Start Exam Directly
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography paragraph>
          Enter the ID of the exam you want to take.
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <TextField
            label="Exam ID"
            value={examId}
            onChange={(e) => setExamId(e.target.value)}
            fullWidth
            disabled={loading}
            sx={{ mb: 2 }}
          />
          
          <Button 
            variant="contained" 
            onClick={handleStartExam}
            disabled={loading || !examId.trim()}
            fullWidth
          >
            {loading ? <CircularProgress size={24} /> : 'Start Exam'}
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error">
            {error}
          </Alert>
        )}
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button 
          variant="outlined" 
          onClick={() => router.push('/simple-dashboard')}
        >
          Go to Dashboard
        </Button>
        
        <Button 
          variant="outlined" 
          color="secondary"
          onClick={() => router.push('/debug-store')}
        >
          Debug Store
        </Button>
      </Box>
    </Box>
  );
}