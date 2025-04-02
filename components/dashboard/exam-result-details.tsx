import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Paper,
  Grid,
  LinearProgress,
  Chip
} from '@mui/material';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';

interface ExamResultDetailsProps {
  open: boolean;
  onClose: () => void;
  sessionId: string | null;
}

interface SessionStats {
  sessionId: string;
  examId: string;
  examName: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  startTime: string;
  endTime: string;
  status: string;
  score: number | null;
  tabSwitchCount: number;
  faceDetectionViolations: number;
  faceDetectionStats: {
    totalViolations: number;
    totalWarnings?: number;
    violationTypes: {
      lookingLeft: number;
      lookingRight: number;
      faceNotDetected: number;
      multipleFaces: number;
    };
  };
  resultsReleased: boolean;
}

const ExamResultDetails: React.FC<ExamResultDetailsProps> = ({ open, onClose, sessionId }) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    if (open && sessionId && session?.user?.token) {
      fetchSessionStats(sessionId, session.user.token);
    }
  }, [open, sessionId, session]);

  const fetchSessionStats = async (id: string, token: string) => {
    setLoading(true);
    try {
      console.log(`Fetching stats for session ${id}`);
      const response = await fetch(`/api/exam-session/stats/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch session stats: ${response.status} ${response.statusText}`);
      }

      // Get response as text first for debugging
      const responseText = await response.text();
      console.log('Session stats response length:', responseText.length);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse session stats response:', e);
        console.error('Raw response:', responseText.substring(0, 200) + '...');
        throw new Error('Invalid response format from server');
      }

      console.log('Session stats data:', data);

      if (data.success && data.data) {
        setStats(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch session stats');
      }
    } catch (error) {
      console.error('Error fetching session stats:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch session details');
    } finally {
      setLoading(false);
    }
  };

  const getCheatingLevel = () => {
    if (!stats) return 'Unknown';

    // Count both tab switches and face detection violations
    const totalViolations = stats.faceDetectionViolations + stats.tabSwitchCount;

    // Make the thresholds more sensitive
    if (totalViolations === 0) return 'None';
    if (totalViolations < 3) return 'Low';     // Changed from 5 to 3
    if (totalViolations < 7) return 'Medium';  // Changed from 10 to 7
    return 'High';
  };

  const getCheatingLevelColor = () => {
    const level = getCheatingLevel();
    switch (level) {
      case 'None': return 'success.main';
      case 'Low': return 'info.main';
      case 'Medium': return 'warning.main';
      case 'High': return 'error.main';
      default: return 'text.primary';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Typography variant="h5" component="div">
          Exam Result Details
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box sx={{ width: '100%', my: 4 }}>
            <LinearProgress />
            <Typography sx={{ mt: 2, textAlign: 'center' }}>
              Loading exam details...
            </Typography>
          </Box>
        ) : !stats ? (
          <Typography color="error" sx={{ textAlign: 'center', my: 4 }}>
            Failed to load exam details. Please try again.
          </Typography>
        ) : (
          <Box>
            {/* Exam Info */}
            <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
              <Typography variant="h6" gutterBottom>
                {stats.examName}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Status:</strong> {stats.status.charAt(0).toUpperCase() + stats.status.slice(1)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Score:</strong> {stats.score !== null ? `${stats.score}%` : 'Not available'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Started:</strong> {new Date(stats.startTime).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Completed:</strong> {stats.endTime ? new Date(stats.endTime).toLocaleString() : 'In progress'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Cheating Detection */}
            <Typography variant="h6" gutterBottom>
              Cheating Detection
            </Typography>
            <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Cheating Level: <span style={{ color: getCheatingLevelColor() }}>{getCheatingLevel()}</span>
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Tab Switch Count:</strong> {stats.tabSwitchCount}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Face Detection Violations:</strong> {stats.faceDetectionViolations}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" gutterBottom>
                Detailed Violations:
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Total Violations:</strong> {stats.faceDetectionStats?.totalViolations || 0}
                </Typography>
                {stats.faceDetectionStats?.totalWarnings > 0 && (
                  <Typography variant="body2" gutterBottom>
                    <strong>Total Warnings:</strong> {stats.faceDetectionStats?.totalWarnings || 0}
                  </Typography>
                )}
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                  Violation Types:
                </Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    • <strong>Looking Left:</strong> {stats.faceDetectionStats?.violationTypes?.lookingLeft || 0}
                    {stats.faceDetectionStats?.violationTypes?.lookingLeft > 0 && (
                      <Chip size="small" label="Detected" color="warning" sx={{ ml: 1 }} />
                    )}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    • <strong>Looking Right:</strong> {stats.faceDetectionStats?.violationTypes?.lookingRight || 0}
                    {stats.faceDetectionStats?.violationTypes?.lookingRight > 0 && (
                      <Chip size="small" label="Detected" color="warning" sx={{ ml: 1 }} />
                    )}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    • <strong>Face Not Detected:</strong> {stats.faceDetectionStats?.violationTypes?.faceNotDetected || 0}
                    {stats.faceDetectionStats?.violationTypes?.faceNotDetected > 0 && (
                      <Chip size="small" label="Detected" color="error" sx={{ ml: 1 }} />
                    )}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    • <strong>Multiple Faces:</strong> {stats.faceDetectionStats?.violationTypes?.multipleFaces || 0}
                    {stats.faceDetectionStats?.violationTypes?.multipleFaces > 0 && (
                      <Chip size="small" label="Detected" color="error" sx={{ ml: 1 }} />
                    )}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExamResultDetails;