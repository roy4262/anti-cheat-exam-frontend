import React, { useEffect, useState } from "react";
import {
  Container,
  Grid,
  Typography,
  Paper,
  Tabs,
  Tab,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import { useAppSelector, useAppDispatch } from "../../hooks";
import ExamCard from "./exam-card";
import StudentDashboard from "./student-dashboard";
import FaceDetectionDisplay from "./face-detection-display";
import classes from "./dashboard.module.scss";
import { useSession } from "next-auth/react";
import { LoadingBarRef } from "react-top-loading-bar";
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { examActions } from "../../store/exam-store";
import { deleteExamSession } from "../../helpers/api/exam-session-api";

interface DashboardProps {
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
  resultsReleased: boolean;
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
}

const Dashboard: React.FC<DashboardProps> = ({ loadingBarRef }) => {
  const assignedExams = useAppSelector((state) => state.exam.assignedExams);
  const dispatch = useAppDispatch();
  const session = useSession();
  const [tabValue, setTabValue] = useState(0);
  const [examSessions, setExamSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isTeacher = session.data?.user?.role === 'teacher';

  // Fetch exam sessions for teachers
  useEffect(() => {
    const fetchExamSessions = async () => {
      if (!isTeacher || tabValue !== 1) return;

      try {
        setLoading(true);
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

    if (session.status === 'authenticated' && isTeacher) {
      fetchExamSessions();

      // Set up an interval to refresh the data every 30 seconds
      const intervalId = setInterval(fetchExamSessions, 30000);

      // Clean up the interval when the component unmounts
      return () => clearInterval(intervalId);
    }
  }, [session, loadingBarRef, isTeacher, tabValue]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAccordionChange = (sessionId: string) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  const handleReleaseResults = async (sessionId: string) => {
    try {
      if (loadingBarRef.current) {
        loadingBarRef.current.continuousStart(50);
      }

      setLoading(true);

      const response = await fetch(`/api/teacher/release-results/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data?.user.token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to release results');
      }

      // Update the session in the state
      const updatedSessions = examSessions.map(s =>
        s._id === sessionId ? { ...s, resultsReleased: true } : s
      );

      setExamSessions(updatedSessions);

      toast.success('Exam results released successfully');
    } catch (error) {
      console.error('Error releasing results:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to release results: ${errorMessage}`);
    } finally {
      setLoading(false);
      if (loadingBarRef.current) {
        loadingBarRef.current.complete();
      }
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

  const getCheatingLevel = (session: ExamSession) => {
    // Get face detection violations
    const faceViolations = session.faceDetectionViolations || 0;

    // Get tab switch count
    const tabSwitches = session.tabSwitchCount || 0;

    // Get total violations from faceDetectionStats if available
    const statsViolations = session.faceDetectionStats?.totalViolations || 0;

    // Use the highest value available
    const violations = Math.max(faceViolations, statsViolations);

    // Calculate total cheating attempts
    const total = violations + tabSwitches;

    // Determine cheating level with properly typed color values
    if (total >= 10) return { level: 'High', color: 'error' as const };
    if (total >= 5) return { level: 'Medium', color: 'warning' as const };
    return { level: 'Low', color: 'success' as const };
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete || !session.data?.user?.token) {
      setDeleteDialogOpen(false);
      return;
    }

    try {
      setDeleteLoading(true);
      if (loadingBarRef.current) {
        loadingBarRef.current.continuousStart(50);
      }

      await deleteExamSession(sessionToDelete, session.data.user.token);

      // Remove the deleted session from the state
      setExamSessions(prevSessions =>
        prevSessions.filter(s => s._id !== sessionToDelete)
      );

      toast.success("Exam session deleted successfully");
    } catch (error) {
      console.error("Error deleting exam session:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete exam session");
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
      if (loadingBarRef.current) {
        loadingBarRef.current.complete();
      }
    }
  };

  return (
    <Container maxWidth={isTeacher ? "lg" : "md"} className={classes.container}>
      <h1 className={classes.title}>Welcome {session.data?.user?.firstName || session.data?.user?.email}!</h1>

      <Paper elevation={1} sx={{ padding: 3, marginBottom: 4, backgroundColor: '#f8f9fa' }}>
        <Typography variant="body1">
          <strong>Email:</strong> {session.data?.user?.email}
        </Typography>
        <Typography variant="body1">
          <strong>Role:</strong> {session.data?.user?.role || 'Student'}
        </Typography>
      </Paper>

      {isTeacher && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
                <Tab label="Assigned Exams" />
                <Tab label="Exam Results" />
              </Tabs>
            </Box>
            <Button
              variant="contained"
              color="primary"
              href="/exam/create"
              startIcon={<AddIcon />}
            >
              Create New Exam
            </Button>
          </Box>
        </>
      )}

      {/* Student Dashboard */}
      {!isTeacher && (
        <StudentDashboard loadingBarRef={loadingBarRef} />
      )}

      {/* Teacher's Assigned Exams Tab */}
      {(isTeacher && tabValue === 0) && (
        <>
          <Typography variant="h5" gutterBottom sx={{ marginTop: 4, marginBottom: 2 }}>
            Your Assigned Exams ({assignedExams.length})
          </Typography>

          {assignedExams.length > 0 ? (
            <Grid container direction="column" spacing={4}>
              {assignedExams.map((exam) => (
                <Grid key={exam._id} item>
                  <ExamCard
                    exam={exam}
                    loadingBarRef={loadingBarRef}
                    isTeacher={isTeacher}
                    onDelete={(examId) => {
                      try {
                        // Remove the deleted exam from the state
                        const updatedExams = assignedExams.filter(e => e._id !== examId);
                        dispatch(examActions.setAssignedExams(updatedExams));
                      } catch (error) {
                        console.error('Error updating exam list:', error);
                        toast.error('Failed to update exam list. Please refresh the page.');
                      }
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper elevation={2} sx={{ padding: 4, textAlign: 'center', marginTop: 2 }}>
              <Typography variant="h6" gutterBottom>
                No Exams Available
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                You don't have any exams assigned to you at the moment.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                If you believe this is an error, please contact your administrator or try refreshing the page.
              </Typography>
            </Paper>
          )}
        </>
      )}

      {/* Teacher's Exam Results Tab */}
      {isTeacher && tabValue === 1 && (
        <>
          <Typography variant="h5" gutterBottom sx={{ marginTop: 4, marginBottom: 2 }}>
            Exam Results
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
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
          ) : examSessions.length === 0 ? (
            <Paper elevation={2} sx={{ padding: 4, textAlign: 'center', marginTop: 2 }}>
              <Typography variant="h6" gutterBottom>
                No Exam Results Available
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                There are no completed exams to display at this time.
              </Typography>
            </Paper>
          ) : (
            <>
              <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>Summary</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={3}>
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
                  <Grid item xs={12} sm={3}>
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
                  <Grid item xs={12} sm={3}>
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
                  <Grid item xs={12} sm={3}>
                    <Card>
                      <CardContent>
                        <Typography color="text.secondary" gutterBottom>
                          Cheating Detected
                        </Typography>
                        <Typography variant="h4">
                          {examSessions.filter(session =>
                            session.faceDetectionViolations > 0 ||
                            session.tabSwitchCount > 0 ||
                            (session.faceDetectionStats && session.faceDetectionStats.totalViolations > 0)
                          ).length}
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
                      <TableCell><strong>Actions</strong></TableCell>
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

                            {(
                              session.faceDetectionViolations > 0 ||
                              session.tabSwitchCount > 0 ||
                              (session.faceDetectionStats && session.faceDetectionStats.totalViolations > 0)
                            ) ? (
                              <Chip
                                label={getCheatingLevel(session).level}
                                color={getCheatingLevel(session).color}
                                size="small"
                              />
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

                              {session.status === 'completed' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color={session.resultsReleased ? "success" : "primary"}
                                  onClick={() => handleReleaseResults(session._id)}
                                  disabled={session.resultsReleased}
                                >
                                  {session.resultsReleased ? "Released" : "Release Results"}
                                </Button>
                              )}

                              {session.resultsReleased && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={() => handleDeleteSession(session._id)}
                                >
                                  Delete
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
                                        <Typography><strong>Cheating Level:</strong> {getCheatingLevel(session).level}</Typography>
                                        <Typography><strong>Tab Switch Count:</strong> {session.tabSwitchCount || 0}</Typography>

                                        <FaceDetectionDisplay
                                          faceDetectionViolations={session.faceDetectionViolations}
                                          faceDetectionStats={session.faceDetectionStats}
                                        />

                                        {session.proctorLogs && session.proctorLogs.length > 0 && (
                                          <>
                                            <Typography sx={{ mt: 2 }}><strong>Proctor Logs:</strong></Typography>
                                            <Typography>Total Events: {session.proctorLogs.length}</Typography>
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
            </>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Exam Session
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this exam session? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            color="primary"
            disabled={deleteLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteSession}
            color="error"
            variant="contained"
            disabled={deleteLoading}
            autoFocus
          >
            {deleteLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;
