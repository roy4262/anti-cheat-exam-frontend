import { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Alert, TextField, Card, CardContent } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useAppSelector, useAppDispatch } from '../hooks';
import { getExam } from '../helpers/api/exam-api';
import { examActions } from '../store/exam-store';
import { Exam } from '../models/exam-models';

export default function DebugStorePage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [examId, setExamId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const dispatch = useAppDispatch();
  const activeExam = useAppSelector((state) => state.exam.activeExam);
  const storeState = useAppSelector((state) => state);

  const fetchAndSetExam = async () => {
    if (!session?.user?.token) {
      setError('No authentication token available');
      return;
    }

    if (!examId) {
      setError('Please enter an exam ID');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const exam = await getExam(examId, session.user.token);
      console.log('Fetched exam:', exam);
      
      if (!exam) {
        throw new Error('Failed to fetch exam data');
      }
      
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
      setSuccess(`Exam "${exam.name}" loaded into store with ${exam.questions.length} questions`);
    } catch (e) {
      setError(`Error fetching exam: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearExam = () => {
    dispatch(examActions.clearActiveExam());
    setSuccess('Active exam cleared from store');
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Redux Store Debug
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Authentication Status
        </Typography>
        <Typography>
          {session ? `Logged in as ${session.user.email}` : 'Not logged in'}
        </Typography>
        {session?.user?.token && (
          <Typography>
            Token available: {session.user.token.substring(0, 20)}...
          </Typography>
        )}
      </Paper>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Load Exam into Store
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="Exam ID"
            value={examId}
            onChange={(e) => setExamId(e.target.value)}
            fullWidth
            disabled={loading}
          />
          <Button 
            variant="contained" 
            onClick={fetchAndSetExam}
            disabled={loading || !session || !examId}
          >
            Load Exam
          </Button>
          <Button 
            variant="outlined" 
            color="error"
            onClick={clearExam}
            disabled={loading || !activeExam}
          >
            Clear Exam
          </Button>
        </Box>
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
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Active Exam State
        </Typography>
        {activeExam ? (
          <Box>
            <Typography variant="subtitle1">
              Exam: {activeExam.exam.name} (ID: {activeExam.exam._id})
            </Typography>
            <Typography>
              Current Question: {activeExam.currentQuestion + 1} of {activeExam.exam.questionCount}
            </Typography>
            <Typography>
              Questions Array Length: {activeExam.exam.questions ? activeExam.exam.questions.length : 0}
            </Typography>
            <Typography>
              Answer Keys: {activeExam.answerKeys.filter(a => a !== null).length} answered
            </Typography>
            
            {activeExam.exam.questions && activeExam.exam.questions.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Current Question Data:
                </Typography>
                <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
                  {JSON.stringify(activeExam.exam.questions[activeExam.currentQuestion], null, 2)}
                </pre>
              </Box>
            )}
          </Box>
        ) : (
          <Typography color="text.secondary">
            No active exam in store
          </Typography>
        )}
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Complete Redux Store State
        </Typography>
        <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto', maxHeight: '400px' }}>
          {JSON.stringify(storeState, null, 2)}
        </pre>
      </Paper>
    </Box>
  );
}