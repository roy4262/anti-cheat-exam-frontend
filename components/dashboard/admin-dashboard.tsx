import React from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Chip,
  Button,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { LoadingBarRef } from "react-top-loading-bar";
import { format } from 'date-fns';
import { toast } from 'react-toastify';

interface AdminDashboardProps {
  loadingBarRef: React.RefObject<LoadingBarRef>;
}

interface ExamSession {
  _id: string;
  examId: {
    _id: string;
    name: string;
  };
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  startTime: string;
  endTime: string;
  status: string;
  score: number;
  answers: Array<{
    questionIndex: number;
    answer: string;
  }>;
  tabSwitchCount: number;
  faceDetectionViolations: number;
  resultsReleased?: boolean;
  faceDetectionStats?: {
    totalViolations: number;
    violationTypes: {
      lookingLeft: number;
      lookingRight: number;
      faceNotDetected: number;
      multipleFaces: number;
    };
  };
  proctorLogs?: Array<{
    timestamp: string;
    eventType: string;
    duration: number;
  }>;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ loadingBarRef }) => {
  const [examSessions, setExamSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  
  const session = useSession();

  useEffect(() => {
    const fetchExamSessions = async () => {
      try {
        loadingBarRef.current?.continuousStart(50);
        
        const response = await fetch('/api/admin/exam-sessions', {
          headers: {
            'Authorization': `Bearer ${session.data?.user.token}`
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          setExamSessions(data.sessions || []);
        } else {
          setError(data.message || 'Failed to fetch exam sessions');
        }
      } catch (err) {
        console.error('Error fetching exam sessions:', err);
        setError('Error fetching exam sessions. Please try again.');
      } finally {
        setLoading(false);
        loadingBarRef.current?.complete();
      }
    };

    if (session.status === 'authenticated') {
      fetchExamSessions();
    }
  }, [session, loadingBarRef]);

  const handleAccordionChange = (sessionId: string) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  const handleReleaseResults = async (sessionId: string) => {
    try {
      loadingBarRef.current?.continuousStart(50);

      const response = await fetch(`/api/admin/release-results/${sessionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.data?.user.token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        // Update the local state to reflect the change
        setExamSessions(prevSessions =>
          prevSessions.map(session =>
            session._id === sessionId
              ? { ...session, resultsReleased: true }
              : session
          )
        );

        // Show success message
        toast.success('Exam results released successfully');
      } else {
        toast.error(data.message || 'Failed to release results');
      }
    } catch (err) {
      console.error('Error releasing results:', err);
      toast.error('Error releasing results. Please try again.');
    } finally {
      loadingBarRef.current?.complete();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in-progress':
        return 'info';
      case 'abandoned':
        return 'error';
      default:
        return 'default';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getCheatingLevel = (violations: number, tabSwitches: number) => {
    const total = violations + tabSwitches;
    if (total >= 10) return { level: 'High', color: 'error' as const };
    if (total >= 5) return { level: 'Medium', color: 'warning' as const };
    return { level: 'Low', color: 'success' as const };
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>Loading exam results...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, bgcolor: '#fff9f9', border: '1px solid #ffcccc' }}>
          <Typography variant="h6" color="error">Error</Typography>
          <Typography>{error}</Typography>
          <Button 
            variant="contained" 
            sx={{ mt: 2 }}
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Paper>
      </Container>
    );
  }

  if (examSessions.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>No Exam Results Available</Typography>
          <Typography variant="body1" color="text.secondary">
            There are no completed exams to display at this time.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" gutterBottom>
        Exam Results Dashboard
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Summary</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Exams
                </Typography>
                <Typography variant="h4">
                  {examSessions.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Completed Exams
                </Typography>
                <Typography variant="h4">
                  {examSessions.filter(session => session.status === 'completed').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Average Score
                </Typography>
                <Typography variant="h4">
                  {Math.round(examSessions.reduce((acc, session) => acc + (session.score || 0), 0) / examSessions.length)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell><strong>Student</strong></TableCell>
              <TableCell><strong>Exam</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Score</strong></TableCell>
              <TableCell><strong>Cheating Attempts</strong></TableCell>
              <TableCell><strong>Details</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {examSessions.map((session) => (
              <React.Fragment key={session._id}>
                <TableRow hover>
                  <TableCell>
                    {session.userId?.firstName} {session.userId?.lastName}
                    <Typography variant="caption" display="block" color="text.secondary">
                      {session.userId?.email}
                    </Typography>
                  </TableCell>
                  <TableCell>{session.examId?.name || 'Unknown Exam'}</TableCell>
                  <TableCell>
                    {session.startTime ? format(new Date(session.startTime), 'MMM d, yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={session.status} 
                      color={getStatusColor(session.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={`${session.score || 0}%`} 
                      color={getScoreColor(session.score || 0)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {session.faceDetectionViolations || session.tabSwitchCount ? (
                      (() => {
                        const cheatingInfo = getCheatingLevel(
                          session.faceDetectionViolations || 0,
                          session.tabSwitchCount || 0
                        );
                        return (
                          <Chip
                            label={cheatingInfo.level}
                            color={cheatingInfo.color}
                            size="small"
                          />
                        );
                      })()
                    ) : (
                      <Chip label="None" color="success" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        onClick={() => handleAccordionChange(session._id)}
                        endIcon={<ExpandMoreIcon />}
                      >
                        View
                      </Button>
                      {session.status === 'completed' && !session.resultsReleased && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          onClick={() => handleReleaseResults(session._id)}
                        >
                          Release Results
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={7} sx={{ p: 0, borderBottom: 'none' }}>
                    <Accordion 
                      expanded={expandedSession === session._id}
                      onChange={() => handleAccordionChange(session._id)}
                      sx={{ boxShadow: 'none' }}
                    >
                      <AccordionSummary sx={{ display: 'none' }} />
                      <AccordionDetails>
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
                            <Card variant="outlined">
                              <CardContent>
                                <Typography variant="h6" gutterBottom>
                                  Exam Details
                                </Typography>
                                <Typography><strong>Start Time:</strong> {session.startTime ? format(new Date(session.startTime), 'PPpp') : 'N/A'}</Typography>
                                <Typography><strong>End Time:</strong> {session.endTime ? format(new Date(session.endTime), 'PPpp') : 'N/A'}</Typography>
                                <Typography><strong>Duration:</strong> {
                                  session.startTime && session.endTime ? 
                                  `${Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000)} minutes` : 
                                  'N/A'
                                }</Typography>
                                <Typography><strong>Score:</strong> {session.score || 0}%</Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Card variant="outlined">
                              <CardContent>
                                <Typography variant="h6" gutterBottom>
                                  Cheating Detection
                                </Typography>
                                <Typography><strong>Face Detection Violations:</strong> {session.faceDetectionViolations || 0}</Typography>
                                <Typography><strong>Tab Switch Count:</strong> {session.tabSwitchCount || 0}</Typography>
                                {session.faceDetectionStats && (
                                  <>
                                    <Typography sx={{ mt: 1 }}><strong>Violation Types:</strong></Typography>
                                    <Typography>Looking Left: {session.faceDetectionStats.violationTypes.lookingLeft || 0}</Typography>
                                    <Typography>Looking Right: {session.faceDetectionStats.violationTypes.lookingRight || 0}</Typography>
                                    <Typography>Face Not Detected: {session.faceDetectionStats.violationTypes.faceNotDetected || 0}</Typography>
                                    <Typography>Multiple Faces: {session.faceDetectionStats.violationTypes.multipleFaces || 0}</Typography>
                                  </>
                                )}
                              </CardContent>
                            </Card>
                          </Grid>
                          {session.answers && session.answers.length > 0 && (
                            <Grid item xs={12}>
                              <Card variant="outlined">
                                <CardContent>
                                  <Typography variant="h6" gutterBottom>
                                    Answers
                                  </Typography>
                                  <TableContainer>
                                    <Table size="small">
                                      <TableHead>
                                        <TableRow>
                                          <TableCell><strong>Question</strong></TableCell>
                                          <TableCell><strong>Answer</strong></TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {session.answers.map((answer, index) => (
                                          <TableRow key={index}>
                                            <TableCell>Question {answer.questionIndex + 1}</TableCell>
                                            <TableCell>{answer.answer}</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </TableContainer>
                                </CardContent>
                              </Card>
                            </Grid>
                          )}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default AdminDashboard;