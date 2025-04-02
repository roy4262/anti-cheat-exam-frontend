import { useEffect, useState, useRef, useCallback } from "react";
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
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from "@mui/material";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { LoadingBarRef } from "react-top-loading-bar";
import { getUserAssignedExams } from "../../helpers/api/exam-api";
import { deleteExamSession } from "../../helpers/api/exam-session-api";
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import ExamResultDetails from "./exam-result-details";

interface StudentExamResult {
  examId: string;
  examTitle: string;
  score: number;
  submissionDate: string;
  cheatingDetected?: boolean;
  sessionId: string;
  resultsReleased?: boolean;
}

interface AssignedExam {
  _id: string;
  name: string;
  description: string;
  duration: number;
  startDate?: string;
  endDate?: string;
  questionCount: number;
}

interface StudentDashboardProps {
  loadingBarRef?: React.RefObject<LoadingBarRef>;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ loadingBarRef }) => {
  const [examResults, setExamResults] = useState<StudentExamResult[]>([]);
  const [assignedExams, setAssignedExams] = useState<AssignedExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const session = useSession();
  const router = useRouter();
  const localLoadingBarRef = useRef<LoadingBarRef>(null);
  const effectiveLoadingBarRef = loadingBarRef || localLoadingBarRef;

  // Function to fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (effectiveLoadingBarRef && effectiveLoadingBarRef.current) {
        effectiveLoadingBarRef.current.continuousStart(50);
      }

      // Fetch assigned exams
      if (session.data?.user?.token) {
        try {
          console.log('Fetching assigned exams...');
          console.log('User token available:', !!session.data.user.token);

          // Add a small delay to ensure the token is properly set
          await new Promise(resolve => setTimeout(resolve, 500));

          const exams = await getUserAssignedExams(session.data.user.token);
          console.log('Assigned exams received:', exams ? exams.length : 0);
          setAssignedExams(exams || []);
        } catch (examError) {
          console.error('Error fetching assigned exams:', examError);
          toast.error('Failed to fetch assigned exams. Please try refreshing the page.');
          // Set empty array to prevent undefined errors
          setAssignedExams([]);
        }

          // Fetch exam results directly from the dedicated endpoint
          try {
            console.log('Fetching exam results...');

            // Add a small delay to ensure the token is properly set
            await new Promise(resolve => setTimeout(resolve, 500));

            const response = await fetch('/api/user/exam-results', {
              headers: {
                'Authorization': `Bearer ${session.data.user.token}`
              }
            });

            // Get response as text first for debugging
            const responseText = await response.text();
            console.log('Exam results response length:', responseText.length);

            let data;
            try {
              data = JSON.parse(responseText);
            } catch (e) {
              console.error('Failed to parse exam results response:', e);
              console.error('Raw response:', responseText.substring(0, 200) + '...');
              throw new Error('Invalid response format from server');
            }

            console.log('Exam results data structure:', Object.keys(data));
            if (data.data) console.log('Data structure:', Object.keys(data.data));

            // Check different possible locations for exam results
            let results = null;

            if (data.success && data.data && data.data.examResults) {
              results = data.data.examResults;
              console.log('Found results in data.data.examResults');
            } else if (data.data && Array.isArray(data.data)) {
              results = data.data;
              console.log('Found results in data.data array');
            } else if (data.examResults) {
              results = data.examResults;
              console.log('Found results in data.examResults');
            }

            if (results && Array.isArray(results)) {
              console.log('Fetched exam results:', results);
              setExamResults(results);
            } else {
              console.log('No exam results found in response:', data);
              setExamResults([]);
            }
          } catch (error) {
            console.error('Error fetching exam results:', error);
            toast.error('Failed to fetch exam results');
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error("Failed to fetch dashboard data");
      } finally {
        setLoading(false);
        if (effectiveLoadingBarRef && effectiveLoadingBarRef.current) {
          effectiveLoadingBarRef.current.complete();
        }
      }
    }, [session.data?.user?.token, effectiveLoadingBarRef]);

  useEffect(() => {
    if (session.status === 'authenticated') {
      // Add a small delay before the first fetch to ensure everything is initialized
      const initialFetchTimeout = setTimeout(() => {
        console.log('Initial data fetch');
        fetchData();
      }, 1000);

      // Set up an interval to refresh the data every 30 seconds
      const intervalId = setInterval(() => {
        console.log('Interval data refresh');
        fetchData();
      }, 30000);

      // Clean up the interval and timeout when the component unmounts
      return () => {
        clearTimeout(initialFetchTimeout);
        clearInterval(intervalId);
      };
    }
  }, [session.status, fetchData]);

  const handleStartExam = (examId: string) => {
    if (effectiveLoadingBarRef && effectiveLoadingBarRef.current) {
      effectiveLoadingBarRef.current.continuousStart(50);
    }
    router.push(`/exam/${examId}`);
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  const handleViewDetails = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setDetailsDialogOpen(true);
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete || !session.data?.user?.token) {
      setDeleteDialogOpen(false);
      return;
    }

    try {
      setDeleteLoading(true);
      if (effectiveLoadingBarRef && effectiveLoadingBarRef.current) {
        effectiveLoadingBarRef.current.continuousStart(50);
      }

      await deleteExamSession(sessionToDelete, session.data.user.token);

      // Remove the deleted session from the state
      setExamResults(prevResults =>
        prevResults.filter(result => result.sessionId !== sessionToDelete)
      );

      toast.success("Exam session deleted successfully");
    } catch (error) {
      console.error("Error deleting exam session:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete exam session");
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
      if (effectiveLoadingBarRef && effectiveLoadingBarRef.current) {
        effectiveLoadingBarRef.current.complete();
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Student Dashboard
      </Typography>

      {/* Assigned Exams Section */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Your Assigned Exams
      </Typography>

      {loading ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography>Loading assigned exams...</Typography>
        </Box>
      ) : assignedExams.length > 0 ? (
        <Grid container spacing={3}>
          {assignedExams.map((exam) => (
            <Grid item xs={12} md={6} lg={4} key={exam._id}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {exam.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {exam.description || 'No description provided'}
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" component="span" sx={{ mr: 1 }}>
                      <strong>Duration:</strong> {exam.duration} minutes
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" component="span" sx={{ mr: 1 }}>
                      <strong>Questions:</strong> {exam.questionCount}
                    </Typography>
                  </Box>
                  {exam.startDate && (
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" component="span">
                        <strong>Available from:</strong> {format(new Date(exam.startDate), 'MMM d, yyyy')}
                      </Typography>
                    </Box>
                  )}
                  {exam.endDate && (
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" component="span">
                        <strong>Available until:</strong> {format(new Date(exam.endDate), 'MMM d, yyyy')}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    onClick={() => handleStartExam(exam._id)}
                  >
                    Start Exam
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>No exams have been assigned to you yet.</Typography>
        </Paper>
      )}

      {/* Exam Results Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
          Your Exam Results
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            toast.info("Refreshing results...");
            fetchData();
          }}
          disabled={loading}
        >
          Refresh Results
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography>Loading exam results...</Typography>
        </Box>
      ) : examResults.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Exam Title</TableCell>
                <TableCell align="right">Score</TableCell>
                <TableCell>Submission Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {examResults.map((result) => (
                <TableRow key={result.sessionId || `${result.examTitle}-${result.submissionDate}`}>
                  <TableCell>{result.examTitle}</TableCell>
                  <TableCell align="right">
                    {result.resultsReleased === true ? `${result.score}%` : 'Pending'}
                  </TableCell>
                  <TableCell>
                    {typeof result.submissionDate === 'string'
                      ? (result.submissionDate.includes('T')
                          ? format(new Date(result.submissionDate), 'MMM d, yyyy')
                          : result.submissionDate)
                      : format(new Date(result.submissionDate), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {result.resultsReleased === true ? (
                        <>
                          <Chip
                            label={result.score >= 60 ? "Passed" : "Failed"}
                            color={result.score >= 60 ? "success" : "error"}
                            size="small"
                          />
                          {result.cheatingDetected && (
                            <Chip
                              label="Cheating Detected"
                              color="warning"
                              size="small"
                            />
                          )}
                        </>
                      ) : (
                        <Chip
                          label="Awaiting Results"
                          color="info"
                          size="small"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {result.sessionId && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          onClick={() => handleViewDetails(result.sessionId)}
                        >
                          Details
                        </Button>
                      )}
                      {result.resultsReleased === true && result.sessionId && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleDeleteSession(result.sessionId)}
                        >
                          Delete
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>You haven't completed any exams yet.</Typography>
        </Paper>
      )}

      {/* Loading indicators are now shown in each section */}

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

      {/* Exam Result Details Dialog */}
      <ExamResultDetails
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        sessionId={selectedSessionId}
      />
    </Container>
  );
};

export default StudentDashboard;