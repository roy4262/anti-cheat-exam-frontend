import { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Alert, TextField, Card, CardContent } from '@mui/material';
import { useSession } from 'next-auth/react';
import { getUserAssignedExams, getExam } from '../helpers/api/exam-api';
import { BASE_URL } from '../constants';

export default function TestExamFetchPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [assignedExams, setAssignedExams] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [examId, setExamId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState<string>('');

  useEffect(() => {
    setBaseUrl(BASE_URL);
  }, []);

  const fetchAssignedExams = async () => {
    if (!session?.user?.token) {
      setError('No authentication token available');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const exams = await getUserAssignedExams(session.user.token);
      setAssignedExams(exams);
      console.log('Assigned exams:', exams);
    } catch (e) {
      setError(`Error fetching assigned exams: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchExamById = async () => {
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
    setSelectedExam(null);
    
    try {
      const exam = await getExam(examId, session.user.token);
      setSelectedExam(exam);
      console.log('Fetched exam:', exam);
    } catch (e) {
      setError(`Error fetching exam: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testDirectBackendCall = async () => {
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
    setSelectedExam(null);
    
    try {
      // Make a direct call to the backend
      const response = await fetch(`${BASE_URL}/exam/${examId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.user.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      // Get the response as text first
      const textResponse = await response.text();
      console.log('Raw response:', textResponse);

      // Try to parse as JSON
      try {
        const data = JSON.parse(textResponse);
        setSelectedExam(data.exam || data);
      } catch (e) {
        setError(`Invalid JSON response: ${textResponse.substring(0, 100)}...`);
      }
    } catch (e) {
      setError(`Error making direct backend call: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Exam Fetch Test
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Current API Configuration
        </Typography>
        <Typography>
          BASE_URL: {baseUrl}
        </Typography>
        <Typography>
          Authentication: {session ? 'Logged in' : 'Not logged in'}
        </Typography>
        {session?.user && (
          <Typography>
            User: {session.user.email} (Token: {session.user.token ? 'Available' : 'Not available'})
          </Typography>
        )}
      </Paper>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Fetch Assigned Exams
        </Typography>
        <Button 
          variant="contained" 
          onClick={fetchAssignedExams}
          disabled={loading || !session}
          sx={{ mb: 2 }}
        >
          Fetch My Assigned Exams
        </Button>

        {assignedExams.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              {assignedExams.length} Assigned Exams:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {assignedExams.map((exam) => (
                <Card key={exam._id} sx={{ width: 200, cursor: 'pointer' }} onClick={() => setExamId(exam._id)}>
                  <CardContent>
                    <Typography variant="h6" noWrap title={exam.name}>
                      {exam.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ID: {exam._id}
                    </Typography>
                    <Typography variant="body2">
                      Questions: {exam.questionCount || 'N/A'}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        )}
      </Box>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Fetch Exam by ID
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
            onClick={fetchExamById}
            disabled={loading || !session || !examId}
          >
            Fetch Exam
          </Button>
        </Box>
        <Button 
          variant="outlined" 
          onClick={testDirectBackendCall}
          disabled={loading || !session || !examId}
          sx={{ mb: 2 }}
        >
          Test Direct Backend Call
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
      
      {selectedExam && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Exam Details
          </Typography>
          <Typography>
            <strong>Name:</strong> {selectedExam.name}
          </Typography>
          <Typography>
            <strong>ID:</strong> {selectedExam._id}
          </Typography>
          <Typography>
            <strong>Description:</strong> {selectedExam.description || 'N/A'}
          </Typography>
          <Typography>
            <strong>Duration:</strong> {selectedExam.duration} minutes
          </Typography>
          <Typography>
            <strong>Questions:</strong> {selectedExam.questions ? selectedExam.questions.length : 0}
          </Typography>
          
          {selectedExam.questions && selectedExam.questions.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                First Question:
              </Typography>
              <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                <Typography variant="body1" gutterBottom>
                  {selectedExam.questions[0].text}
                </Typography>
                <Typography variant="subtitle2" gutterBottom>
                  Options:
                </Typography>
                <ul>
                  {selectedExam.questions[0].options.map((option: string, index: number) => (
                    <li key={index}>{option}</li>
                  ))}
                </ul>
              </Paper>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
}