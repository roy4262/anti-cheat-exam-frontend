import { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Alert, Card, CardContent, CardActions, Grid } from '@mui/material';
import { useSession } from 'next-auth/react';
import { getUserAssignedExams } from '../helpers/api/exam-api';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function SimpleDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [assignedExams, setAssignedExams] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.token) {
      fetchAssignedExams();
    }
  }, [session]);

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
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
      setError(`Error fetching assigned exams: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const startExam = (examId: string) => {
    router.push(`/exam/${examId}`);
  };

  if (!session) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Please Log In
        </Typography>
        <Typography paragraph>
          You need to be logged in to view your assigned exams.
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
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 4 }}>
      <Head>
        <title>Simple Dashboard - Anti-Cheat Exam</title>
      </Head>
      
      <Typography variant="h4" component="h1" gutterBottom>
        My Assigned Exams
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Typography paragraph>
          Welcome, {session.user.email}! Here are the exams assigned to you.
        </Typography>
        <Button 
          variant="outlined" 
          onClick={fetchAssignedExams}
          disabled={loading}
          sx={{ mr: 2 }}
        >
          Refresh Exams
        </Button>
        <Button 
          variant="outlined" 
          color="secondary"
          onClick={() => router.push('/debug-store')}
        >
          Debug Store
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
      
      {!loading && assignedExams.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You don't have any assigned exams at the moment.
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {assignedExams.map((exam) => (
          <Grid item xs={12} sm={6} md={4} key={exam._id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h5" component="h2" gutterBottom>
                  {exam.name}
                </Typography>
                <Typography color="text.secondary" gutterBottom>
                  ID: {exam._id}
                </Typography>
                {exam.description && (
                  <Typography variant="body2" paragraph>
                    {exam.description}
                  </Typography>
                )}
                <Typography variant="body2">
                  Duration: {exam.duration} minutes
                </Typography>
                <Typography variant="body2">
                  Questions: {exam.questionCount || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  Status: {exam.status || 'Available'}
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  variant="contained"
                  onClick={() => startExam(exam._id)}
                  fullWidth
                >
                  Start Exam
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}