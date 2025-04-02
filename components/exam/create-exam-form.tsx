import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Divider,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import { BASE_URL } from '../../constants';

interface Question {
  text: string;
  options: string[];
  correctAnswer: string;
}

interface ExamFormData {
  name: string;
  description: string;
  duration: number;
  questions: Question[];
  studentEmails: string; // Comma-separated list of student emails
}

const CreateExamForm: React.FC = () => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ExamFormData>({
    name: '',
    description: '',
    duration: 60,
    studentEmails: '',
    questions: [
      {
        text: '',
        options: ['', '', '', ''],
        correctAnswer: '0'
      }
    ]
  });

  const handleExamDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleQuestionChange = (index: number, field: string, value: string) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      questions: updatedQuestions
    }));
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...formData.questions];
    const updatedOptions = [...updatedQuestions[questionIndex].options];
    updatedOptions[optionIndex] = value;
    
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      options: updatedOptions
    };
    
    setFormData(prev => ({
      ...prev,
      questions: updatedQuestions
    }));
  };

  const handleCorrectAnswerChange = (questionIndex: number, value: string) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      correctAnswer: value
    };
    
    setFormData(prev => ({
      ...prev,
      questions: updatedQuestions
    }));
  };

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          text: '',
          options: ['', '', '', ''],
          correctAnswer: '0'
        }
      ]
    }));
  };

  const removeQuestion = (index: number) => {
    if (formData.questions.length <= 1) {
      setError("Exam must have at least one question");
      return;
    }
    
    const updatedQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      questions: updatedQuestions
    }));
  };

  const validateForm = (): boolean => {
    // Check exam details
    if (!formData.name.trim()) {
      setError("Exam name is required");
      return false;
    }

    if (formData.duration <= 0) {
      setError("Duration must be greater than 0");
      return false;
    }

    // Validate student emails if provided
    if (formData.studentEmails.trim()) {
      const emails = formData.studentEmails.split(',').map(email => email.trim());

      // Check if all emails are valid
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const email of emails) {
        if (!emailRegex.test(email)) {
          setError(`Invalid email format: ${email}`);
          return false;
        }
      }
    }

    // Check questions
    for (let i = 0; i < formData.questions.length; i++) {
      const question = formData.questions[i];

      if (!question.text.trim()) {
        setError(`Question ${i + 1} text is required`);
        return false;
      }

      // Check options
      for (let j = 0; j < question.options.length; j++) {
        if (!question.options[j].trim()) {
          setError(`Option ${j + 1} for Question ${i + 1} is required`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Prepare data for API
      const examData = {
        ...formData,
        // Convert questions to the format expected by the backend
        questions: formData.questions.map(q => ({
          text: q.text,
          options: q.options
        })),
        // Create answer keys array
        answerKeys: formData.questions.map(q => q.correctAnswer)
      };
      
      console.log('Sending exam data to API:', examData);
      console.log('Using token:', session?.user.token ? 'Token available' : 'No token');

      // Use our Next.js API route as a proxy
      const response = await fetch(`/api/exam/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user.token}`
        },
        body: JSON.stringify(examData)
      });

      console.log('Response status:', response.status);
      
      // First try to get the response as text
      const textResponse = await response.text();
      console.log('Raw response:', textResponse);

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(textResponse);
        console.log('Response parsed successfully:', data);
      } catch (jsonError) {
        console.error('Response is not valid JSON:', jsonError);

        // Check if the response is HTML (error page)
        if (textResponse.trim().startsWith('<!DOCTYPE html>') || textResponse.trim().startsWith('<html')) {
          console.error('HTML response received instead of JSON');
          throw new Error(`Backend returned HTML instead of JSON. The endpoint may not exist or may be incorrectly configured.`);
        } else {
          throw new Error(`Invalid JSON response from server: ${textResponse.substring(0, 100)}...`);
        }
      }

      if (!response.ok) {
        console.error('Server returned error status:', response.status);
        throw new Error(data.message || data.error || `Server error: ${response.status}`);
      }
      
      // If we have student emails, assign the exam to them
      if (formData.studentEmails.trim()) {
        const emails = formData.studentEmails.split(',').map(email => email.trim());

        // Extract exam ID from the response
        let examId;
        if (data.exam && data.exam._id) {
          examId = data.exam._id;
        } else if (data.data && data.data.exam && data.data.exam._id) {
          examId = data.data.exam._id;
        } else if (data.data && data.data._id) {
          examId = data.data._id;
        }

        if (!examId) {
          console.error('Could not find exam ID in response:', data);
          setSuccess(true);
          setError('Exam created but could not assign to students: Missing exam ID in response');
          return;
        }

        console.log(`Assigning exam ${examId} to ${emails.length} students:`, emails);

        try {
          // Process emails in batches to avoid overwhelming the server
          const batchSize = 5;
          const failedAssignments = [];
          const successfulAssignments = [];

          // Process emails in batches
          for (let i = 0; i < emails.length; i += batchSize) {
            const batch = emails.slice(i, i + batchSize);
            console.log(`Processing batch ${i/batchSize + 1}:`, batch);

            // Process each email in the current batch
            const batchPromises = batch.map(async (email) => {
              try {
                console.log(`Assigning exam to: ${email}`);
                const assignResponse = await fetch(`/api/user/assignExam`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.user.token}`
                  },
                  body: JSON.stringify({
                    email,
                    examId
                  })
                });

                // Get response as text first for debugging
                const responseText = await assignResponse.text();
                console.log(`Response for ${email}:`, responseText);

                // Parse the response
                let assignData;
                try {
                  assignData = JSON.parse(responseText);
                } catch (e) {
                  console.error(`Invalid JSON response for ${email}:`, responseText);
                  return { email, success: false, message: 'Invalid server response' };
                }

                if (!assignResponse.ok) {
                  console.error(`Failed to assign exam to ${email}:`, assignData);
                  return { email, success: false, message: assignData.message || 'Assignment failed' };
                }

                console.log(`Successfully assigned exam to ${email}`);
                return { email, success: true };
              } catch (error) {
                console.error(`Error assigning exam to ${email}:`, error);
                return { email, success: false, message: error.message || 'Assignment failed' };
              }
            });

            // Wait for all assignments in this batch to complete
            const batchResults = await Promise.all(batchPromises);

            // Add results to our tracking arrays
            batchResults.forEach(result => {
              if (result.success) {
                successfulAssignments.push(result);
              } else {
                failedAssignments.push(result);
              }
            });

            // Small delay between batches to avoid overwhelming the server
            if (i + batchSize < emails.length) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }

          // Show appropriate message based on results
          if (failedAssignments.length > 0) {
            console.warn('Some exam assignments failed:', failedAssignments);
            if (successfulAssignments.length > 0) {
              setSuccess(true);
              setError(`Exam created and assigned to ${successfulAssignments.length} students, but failed to assign to ${failedAssignments.length} students`);
            } else {
              setSuccess(true);
              setError(`Exam created but failed to assign to any students`);
            }
          } else {
            console.log('All exam assignments successful');
            setSuccess(true);
            toast.success(`Exam created and assigned to ${successfulAssignments.length} students`);
          }
        } catch (assignError) {
          console.error('Error in assignment process:', assignError);
          setSuccess(true);
          setError('Exam created but failed to assign to students: ' + assignError.message);
        }
      } else {
        // No students to assign, just mark as success
        setSuccess(true);
        toast.success('Exam created successfully');
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        duration: 60,
        studentEmails: '',
        questions: [
          {
            text: '',
            options: ['', '', '', ''],
            correctAnswer: '0'
          }
        ]
      });
      
    } catch (err) {
      console.error('Error creating exam:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
    setError(null);
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 1000, mx: 'auto', mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Create New Exam
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={3}>
          {/* Exam Details */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Exam Details
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              required
              fullWidth
              label="Exam Name"
              name="name"
              id="exam-name"
              value={formData.name}
              onChange={handleExamDataChange}
              autoComplete="off"
              inputProps={{
                "aria-label": "Exam Name"
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              required
              fullWidth
              label="Duration (minutes)"
              name="duration"
              id="exam-duration"
              type="number"
              value={formData.duration}
              onChange={handleExamDataChange}
              inputProps={{
                min: 1,
                "aria-label": "Exam Duration in Minutes"
              }}
              autoComplete="off"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              id="exam-description"
              value={formData.description}
              onChange={handleExamDataChange}
              multiline
              rows={3}
              inputProps={{
                "aria-label": "Exam Description"
              }}
              autoComplete="off"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Student Emails (comma-separated)"
              name="studentEmails"
              id="student-emails"
              value={formData.studentEmails}
              onChange={handleExamDataChange}
              placeholder="student1@example.com, student2@example.com"
              helperText="Enter email addresses of students to assign this exam to"
              inputProps={{
                "aria-label": "Student Emails"
              }}
              autoComplete="off"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Questions ({formData.questions.length})
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={addQuestion}
              >
                Add Question
              </Button>
            </Box>
          </Grid>
          
          {/* Questions */}
          {formData.questions.map((question, qIndex) => (
            <Grid item xs={12} key={qIndex}>
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Question {qIndex + 1}
                    </Typography>
                    <IconButton 
                      color="error" 
                      onClick={() => removeQuestion(qIndex)}
                      aria-label="delete question"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  
                  <TextField
                    required
                    fullWidth
                    label="Question Text"
                    name={`question-${qIndex}-text`}
                    id={`question-${qIndex}-text`}
                    value={question.text}
                    onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                    sx={{ mb: 3 }}
                    multiline
                    rows={2}
                    inputProps={{
                      "aria-label": `Question ${qIndex + 1} Text`
                    }}
                    autoComplete="off"
                  />

                  <Typography variant="subtitle1" gutterBottom>
                    Options
                  </Typography>

                  <Grid container spacing={2}>
                    {question.options.map((option, oIndex) => (
                      <Grid item xs={12} sm={6} key={oIndex}>
                        <TextField
                          required
                          fullWidth
                          label={`Option ${oIndex + 1}`}
                          name={`question-${qIndex}-option-${oIndex}`}
                          id={`question-${qIndex}-option-${oIndex}`}
                          value={option}
                          onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                          inputProps={{
                            "aria-label": `Question ${qIndex + 1} Option ${oIndex + 1}`
                          }}
                          autoComplete="off"
                        />
                      </Grid>
                    ))}
                  </Grid>

                  <FormControl fullWidth sx={{ mt: 3 }}>
                    <InputLabel id={`correct-answer-label-${qIndex}`} htmlFor={`correct-answer-${qIndex}`}>Correct Answer</InputLabel>
                    <Select
                      labelId={`correct-answer-label-${qIndex}`}
                      id={`correct-answer-${qIndex}`}
                      name={`correct-answer-${qIndex}`}
                      value={question.correctAnswer}
                      label="Correct Answer"
                      onChange={(e) => handleCorrectAnswerChange(qIndex, e.target.value)}
                      inputProps={{
                        "aria-label": `Correct Answer for Question ${qIndex + 1}`
                      }}
                    >
                      {question.options.map((_, index) => (
                        <MenuItem key={index} value={index.toString()}>
                          Option {index + 1}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>
          ))}
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={loading}
                sx={{ minWidth: 200 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Create Exam'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
      
      {/* Success/Error Messages */}
      <Snackbar open={success} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success">
          Exam created successfully!
        </Alert>
      </Snackbar>
      
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default CreateExamForm;