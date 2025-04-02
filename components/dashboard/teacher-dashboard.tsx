import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Button,
  Grid,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from "@mui/material";
import FaceDetectionDisplay from "./face-detection-display";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { format } from 'date-fns';
import { LoadingBarRef } from "react-top-loading-bar";

interface TeacherDashboardProps {
  loadingBarRef?: React.RefObject<LoadingBarRef>;
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
  resultsReleased?: boolean;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ loadingBarRef }) => {
  const [examSessions, setExamSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const session = useSession();
  const localLoadingBarRef = useRef(null);
  const effectiveLoadingBarRef = loadingBarRef || localLoadingBarRef;

  useEffect(() => {
    const fetchExamSessions = async () => {
      try {
        effectiveLoadingBarRef.current?.continuousStart(50);

        const response = await fetch('/api/teacher/exam-sessions', {
          headers: {
            'Authorization': `Bearer ${session.data?.user.token}`
          }
        });

        const data = await response.json();

        if (data.success) {
          console.log('FETCHED EXAM SESSIONS:');
          console.log(`- Number of sessions: ${data.sessions ? data.sessions.length : 0}`);

          if (data.sessions && data.sessions.length > 0) {
            data.sessions.forEach((session: ExamSession, index: number ) => {
              console.log(`\nSession ${index + 1}:`);
              console.log(`- ID: ${session._id}`);
              console.log(`- Status: ${session.status}`);
              console.log(`- Tab Switch Count: ${session.tabSwitchCount}`);
              console.log(`- Face Detection Violations: ${session.faceDetectionViolations}`);

              if (session.faceDetectionStats) {
                console.log(`- Face Detection Stats:`);
                console.log(`  - Total Violations: ${session.faceDetectionStats.totalViolations}`);
                if (session.faceDetectionStats.violationTypes) {
                  console.log(`  - Looking Left: ${session.faceDetectionStats.violationTypes.lookingLeft}`);
                  console.log(`  - Looking Right: ${session.faceDetectionStats.violationTypes.lookingRight}`);
                  console.log(`  - Face Not Detected: ${session.faceDetectionStats.violationTypes.faceNotDetected}`);
                  console.log(`  - Multiple Faces: ${session.faceDetectionStats.violationTypes.multipleFaces}`);
                }
              }
            });
          }

          setExamSessions(data.sessions || []);
        } else {
          setError(data.message || 'Failed to fetch exam sessions');
        }
      } catch (err) {
        console.error('Error fetching exam sessions:', err);
        setError('Error fetching exam sessions. Please try again.');
      } finally {
        setLoading(false);
        effectiveLoadingBarRef.current?.complete();
      }
    };

    if (session.status === 'authenticated') {
      fetchExamSessions();
    }
  }, [session, effectiveLoadingBarRef]);

  const handleAccordionChange = (sessionId: string) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  const handleReleaseResults = async (sessionId: string) => {
    try {
      effectiveLoadingBarRef.current?.continuousStart(50);

      const response = await fetch(`/api/teacher/release-results/${sessionId}`, {
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
      effectiveLoadingBarRef.current?.complete();
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

  const getCheatingLevel = (violations: any, tabSwitches: any) => {
    // Convert to numbers if they're strings or other types
    let safeViolations = 0;
    let safeTabSwitches = 0;

    // Handle violations
    if (typeof violations === 'number') {
      safeViolations = violations;
    } else if (violations) {
      try {
        const parsed = parseInt(String(violations));
        safeViolations = isNaN(parsed) ? 0 : parsed;
      } catch (e) {
        console.error('Error parsing violations:', e);
      }
    }

    // Handle tab switches
    if (typeof tabSwitches === 'number') {
      safeTabSwitches = tabSwitches;
    } else if (tabSwitches) {
      try {
        const parsed = parseInt(String(tabSwitches));
        safeTabSwitches = isNaN(parsed) ? 0 : parsed;
      } catch (e) {
        console.error('Error parsing tab switches:', e);
      }
    }

    const total = safeViolations + safeTabSwitches;
    console.log(`Calculating cheating level: violations=${safeViolations}, tabSwitches=${safeTabSwitches}, total=${total}`);

    if (total >= 10) return { level: 'High', color: 'error' as 'error' };
    if (total >= 5) return { level: 'Medium', color: 'warning' as 'warning' };
    return { level: 'Low', color: 'success' as 'success' };
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
        Teacher Dashboard
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

      <Typography variant="h6" gutterBottom>
        Student Performance Overview
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell><strong>Student</strong></TableCell>
              <TableCell><strong>Exam</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Score</strong></TableCell>
              <TableCell><strong>Cheating Status</strong></TableCell>
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
                    {session.score !== undefined ? (
                      <Chip
                        label={`${Math.round(session.score)}%`}
                        color={getScoreColor(session.score)}
                        size="small"
                      />
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      // Log the values for debugging
                      console.log(`Cheating data for session ${session._id}:`);
                      console.log(`- tabSwitchCount: ${session.tabSwitchCount} (type: ${typeof session.tabSwitchCount})`);
                      console.log(`- faceDetectionViolations: ${session.faceDetectionViolations} (type: ${typeof session.faceDetectionViolations})`);

                      // Get the cheating level using our improved function
                      const cheatingLevel = getCheatingLevel(session.faceDetectionViolations, session.tabSwitchCount);

                      // Calculate total violations for display
                      let totalViolations = 0;

                      // Handle tab switches
                      if (typeof session.tabSwitchCount === 'number') {
                        totalViolations += session.tabSwitchCount;
                      } else if (session.tabSwitchCount) {
                        try {
                          const parsed = parseInt(String(session.tabSwitchCount));
                          if (!isNaN(parsed)) totalViolations += parsed;
                        } catch (e) {
                          console.error('Error parsing tab switches:', e);
                        }
                      }

                      // Handle face violations
                      if (typeof session.faceDetectionViolations === 'number') {
                        totalViolations += session.faceDetectionViolations;
                      } else if (session.faceDetectionViolations) {
                        try {
                          const parsed = parseInt(String(session.faceDetectionViolations));
                          if (!isNaN(parsed)) totalViolations += parsed;
                        } catch (e) {
                          console.error('Error parsing face violations:', e);
                        }
                      }

                      console.log(`- Total violations calculated: ${totalViolations}`);

                      return (
                        <Chip
                          label={`${totalViolations} attempts (${cheatingLevel.level})`}
                          color={cheatingLevel.color}
                          size="small"
                        />
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      onClick={() => handleAccordionChange(session._id)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
                {expandedSession === session._id && (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ p: 0 }}>
                      <Box sx={{ p: 2, backgroundColor: '#f9f9f9' }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Cheating Detection Details
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2 }}>
                              <Typography variant="subtitle2">Tab Switching</Typography>
                              <Typography>
                                Count: <strong>{(() => {
                                  if (typeof session.tabSwitchCount === 'number') {
                                    return session.tabSwitchCount;
                                  } else if (session.tabSwitchCount) {
                                    try {
                                      const parsed = parseInt(String(session.tabSwitchCount));
                                      return isNaN(parsed) ? 0 : parsed;
                                    } catch (e) {
                                      console.error('Error parsing tab switches:', e);
                                      return 0;
                                    }
                                  } else {
                                    return 0;
                                  }
                                })()}</strong>
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2 }}>
                              <Typography variant="subtitle2">Face Detection Violations</Typography>
                              <FaceDetectionDisplay
                                faceDetectionViolations={typeof session.faceDetectionViolations === 'number' ?
                                  session.faceDetectionViolations :
                                  parseInt(String(session.faceDetectionViolations || 0)) || 0}
                                faceDetectionStats={session.faceDetectionStats}
                              />

                            </Paper>
                          </Grid>
                        </Grid>

                        {!session.resultsReleased && (
                          <Button
                            variant="contained"
                            color="primary"
                            sx={{ mt: 2 }}
                            onClick={() => handleReleaseResults(session._id)}
                          >
                            Release Results to Student
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default TeacherDashboard;