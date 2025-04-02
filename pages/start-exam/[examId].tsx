import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import { getExam } from '../../helpers/api/exam-api';
import { useAppDispatch } from '../../hooks';
import { examActions } from '../../store/exam-store';
import Head from 'next/head';

export default function StartExamPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const { examId } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [examName, setExamName] = useState<string>('');

  useEffect(() => {
    // Only run this effect when we have both the session and examId
    if (session && examId && typeof examId === 'string') {
      fetchAndPrepareExam(examId);
    } else if (!session) {
      // If no session, redirect to login
      router.push('/auth/login');
    }
  }, [session, examId]);

  const fetchAndPrepareExam = async (id: string) => {
    if (!session?.user?.token) {
      setError('No authentication token available');
      setLoading(false);
      return;
    }

    try {
      console.log(`Fetching exam ${id}`);
      const exam = await getExam(id, session.user.token);
      
      if (!exam) {
        throw new Error('Failed to fetch exam data');
      }
      
      setExamName(exam.name);
      
      // Ensure the exam has a questions array
      if (!exam.questions) {
        console.warn('Exam has no questions array, adding empty array');
        exam.questions = [];
      }
      
      // Ensure questionCount is accurate
      if (exam.questionCount !== exam.questions.length) {
        console.warn(`Fixing questionCount: ${exam.questionCount} -> ${exam.questions.length}`);
        exam.questionCount = exam.questions.length;
      }
      
      // Set the exam in the Redux store
      dispatch(examActions.setActiveExam(exam));
      
      // Short delay to ensure the store is updated
      setTimeout(() => {
        // Navigate to the exam page
        router.push(`/exam/${id}`);
      }, 1000);
      
    } catch (e) {
      console.error('Error fetching exam:', e);
      setError(`Error fetching exam: ${e.message}`);
      setLoading(false);
    }
  };

  const goToDashboard = () => {
    router.push('/simple-dashboard');
  };

  const retryLoading = () => {
    if (typeof examId === 'string') {
      setLoading(true);
      setError(null);
      fetchAndPrepareExam(examId);
    }
  };

  if (!session) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', p: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Please log in to start the exam
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
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 4, textAlign: 'center' }}>
      <Head>
        <title>{examName ? `Starting: ${examName}` : 'Starting Exam'}</title>
      </Head>
      
      <Typography variant="h4" gutterBottom>
        {examName ? examName : 'Preparing Your Exam'}
      </Typography>
      
      {loading && (
        <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography>
            Loading exam content...
          </Typography>
        </Box>
      )}
      
      {error && (
        <Box sx={{ my: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button 
            variant="contained" 
            onClick={retryLoading}
            sx={{ mr: 2 }}
          >
            Try Again
          </Button>
          <Button 
            variant="outlined" 
            onClick={goToDashboard}
          >
            Go to Dashboard
          </Button>
        </Box>
      )}
    </Box>
  );
}