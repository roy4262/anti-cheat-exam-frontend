import { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Alert, TextField, Card, CardContent, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel } from '@mui/material';
import { useSession } from 'next-auth/react';
import { getUserAssignedExams, getExam } from '../helpers/api/exam-api';
import { submitExam } from '../helpers/api/user-api';
import { BASE_URL } from '../constants';

export default function TestExamTakingPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [assignedExams, setAssignedExams] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [examId, setExamId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
    } catch (e: any) {
      setError(`Error fetching assigned exams: ${e?.message || 'Unknown error'}`);
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
    setAnswers([]);
    setCurrentQuestion(0);
    setSubmitted(false);
    
    try {
      const exam = await getExam(examId, session.user.token);
      setSelectedExam(exam);
      console.log('Fetched exam:', exam);
      
      // Initialize answers array
      if (exam.questions && exam.questions.length > 0) {
        setAnswers(new Array(exam.questions.length).fill(null));
      }
    } catch (e: any) {
      setError(`Error fetching exam: ${e?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = value;
    setAnswers(newAnswers);
  };

  const goToNextQuestion = () => {
    if (selectedExam && currentQuestion < selectedExam.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmitExam = async () => {
    if (!session?.user?.token || !session?.user?.id || !selectedExam) {
      setError('Missing required data for submission');
      return;
    }

    setSubmitting(true);
    setError(null);
    
    try {
      const result = await submitExam(
        session.user.id,
        selectedExam._id,
        answers,
        session.user.token
      );
      
      console.log('Exam submitted successfully:', result);
      setSubmitted(true);
    } catch (e: any) {
      setError(`Error submitting exam: ${e?.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getCurrentQuestion = () => {
    if (!selectedExam || !selectedExam.questions || selectedExam.questions.length === 0) {
      return null;
    }
    
    return selectedExam.questions[currentQuestion];
  };

  const question = getCurrentQuestion();

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Exam Taking Test
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
          Start Exam
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
            Start Exam
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
      
      {submitted && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Exam submitted successfully!
        </Alert>
      )}
      
      {selectedExam && !submitted && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            {selectedExam.name}
          </Typography>
          
          {question && (
            <Box sx={{ my: 3 }}>
              <Typography variant="h6" gutterBottom>
                Question {currentQuestion + 1} of {selectedExam.questions.length}
              </Typography>
              
              <Typography variant="body1" sx={{ mb: 2 }}>
                {question.text || question.question || question.title || `Question ${currentQuestion + 1}`}
              </Typography>
              
              {question.options && Array.isArray(question.options) && question.options.length > 0 && (
                <FormControl component="fieldset" sx={{ width: '100%' }}>
                  <FormLabel component="legend">Select an answer:</FormLabel>
                  <RadioGroup
                    value={answers[currentQuestion] || ''}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                  >
                    {question.options.map((option: string, index:number) => (
                      <FormControlLabel
                        key={index}
                        value={index.toString()}
                        control={<Radio />}
                        label={option}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={goToPreviousQuestion}
                  disabled={currentQuestion === 0}
                >
                  Previous
                </Button>
                
                {currentQuestion < selectedExam.questions.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={goToNextQuestion}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmitExam}
                    disabled={submitting}
                  >
                    {submitting ? <CircularProgress size={24} /> : 'Submit Exam'}
                  </Button>
                )}
              </Box>
            </Box>
          )}
          
          <Box sx={{ mt: 4 }}>
            <Typography variant="subtitle1" gutterBottom>
              Answer Progress:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {answers.map((answer, index) => (
                <Box
                  key={index}
                  sx={{
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: answer !== null ? 'success.main' : 'error.main',
                    color: 'white',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    border: currentQuestion === index ? '2px solid black' : 'none',
                  }}
                  onClick={() => setCurrentQuestion(index)}
                >
                  {index + 1}
                </Box>
              ))}
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
}