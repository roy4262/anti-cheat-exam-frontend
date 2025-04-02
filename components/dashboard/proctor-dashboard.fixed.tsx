import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { format } from 'date-fns';

interface ProctorDashboardProps {
  sessionId: string;
}

interface ExamSession {
  sessionId: string;
  examId: string;
  studentId: string;
  startTime: string;
  endTime: string;
  status: string;
  tabSwitchCount?: number; // Added to track tab switches
  faceDetectionViolations?: number; // Added to track total face violations
  faceDetectionStats: {
    totalViolations: number;
    violationTypes: {
      lookingLeft: number;
      lookingRight: number;
      faceNotDetected: number;
      multipleFaces: number;
    };
    totalWarnings?: number; // Added to handle this field
  };
  proctorLogs: Array<{
    timestamp: string;
    eventType: string;
    duration: number;
    details?: any;
  }>;
  browserEvents: Array<{
    timestamp: string;
    eventType: string;
    duration: number;
  }>;
}

const ProctorDashboard: React.FC<ProctorDashboardProps> = ({ sessionId }) => {
  const [sessionData, setSessionData] = useState<ExamSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const response = await fetch(`/api/exam-session/stats/${sessionId}`);
        const data = await response.json();
        if (data.success) {
          // Log the data to help with debugging
          console.log('Session data received:', data.data);

          // Ensure face detection stats are properly structured
          if (data.data && data.data.faceDetectionStats) {
            console.log('Face detection stats:', data.data.faceDetectionStats);
            console.log('Looking Left:', data.data.faceDetectionStats.violationTypes?.lookingLeft);
            console.log('Looking Right:', data.data.faceDetectionStats.violationTypes?.lookingRight);
            console.log('Face Not Detected:', data.data.faceDetectionStats.violationTypes?.faceNotDetected);
            console.log('Multiple Faces:', data.data.faceDetectionStats.violationTypes?.multipleFaces);
          }

          // Log tab switch count
          console.log('Tab switch count:', data.data.tabSwitchCount || 'Not available');

          // Ensure the data has all required fields
          const processedData = {
            ...data.data,
            // Ensure tabSwitchCount exists
            tabSwitchCount: data.data.tabSwitchCount || 0,
            // Ensure faceDetectionViolations exists
            faceDetectionViolations: data.data.faceDetectionViolations || 0,
            // Ensure faceDetectionStats exists with all required fields
            faceDetectionStats: {
              totalViolations: data.data.faceDetectionStats?.totalViolations || 0,
              totalWarnings: data.data.faceDetectionStats?.totalWarnings || 0,
              violationTypes: {
                lookingLeft: data.data.faceDetectionStats?.violationTypes?.lookingLeft || 0,
                lookingRight: data.data.faceDetectionStats?.violationTypes?.lookingRight || 0,
                faceNotDetected: data.data.faceDetectionStats?.violationTypes?.faceNotDetected || 0,
                multipleFaces: data.data.faceDetectionStats?.violationTypes?.multipleFaces || 0
              }
            }
          };

          setSessionData(processedData);
        } else {
          setError(data.message || 'Failed to fetch session data');
        }
      } catch (err) {
        setError('Error fetching session data');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId]);

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!sessionData) return <Typography>No session data available</Typography>;

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'face_not_detected':
        return 'error';
      case 'looking_left':
      case 'looking_right':
        return 'warning';
      case 'multiple_faces':
        return 'error';
      case 'tab_switch':
      case 'window_blur':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Exam Session Details
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Session Overview
              </Typography>
              <Typography>Status: {sessionData.status}</Typography>
              <Typography>
                Start Time: {format(new Date(sessionData.startTime), 'PPpp')}
              </Typography>
              {sessionData.endTime && (
                <Typography>
                  End Time: {format(new Date(sessionData.endTime), 'PPpp')}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Violation Statistics
              </Typography>

              {/* Tab Switch Count */}
              <Typography sx={{ fontWeight: 'bold', mt: 2, mb: 1 }}>
                Tab Switching:
              </Typography>
              <Typography>
                Tab Switches: {sessionData.tabSwitchCount || 0}
              </Typography>

              {/* Face Detection Stats */}
              <Typography sx={{ fontWeight: 'bold', mt: 2, mb: 1 }}>
                Face Detection:
              </Typography>
              <Typography>
                Total Violations: {sessionData.faceDetectionStats.totalViolations}
              </Typography>
              {sessionData.faceDetectionStats.totalWarnings !== undefined && (
                <Typography>
                  Total Warnings: {sessionData.faceDetectionStats.totalWarnings}
                </Typography>
              )}
              <Typography>
                Looking Left: {sessionData.faceDetectionStats.violationTypes.lookingLeft}
              </Typography>
              <Typography>
                Looking Right: {sessionData.faceDetectionStats.violationTypes.lookingRight}
              </Typography>
              <Typography>
                Face Not Detected: {sessionData.faceDetectionStats.violationTypes.faceNotDetected}
              </Typography>
              <Typography>
                Multiple Faces: {sessionData.faceDetectionStats.violationTypes.multipleFaces}
              </Typography>

              {/* Debug info */}
              <Typography sx={{ mt: 2, color: 'text.secondary', fontSize: '0.8rem' }}>
                Raw violation types: {JSON.stringify(sessionData.faceDetectionStats.violationTypes)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Proctor Events Log
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Time</TableCell>
                      <TableCell>Event Type</TableCell>
                      <TableCell>Duration (ms)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sessionData.proctorLogs.map((log, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {format(new Date(log.timestamp), 'PPpp')}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.eventType.replace(/_/g, ' ')}
                            color={getEventColor(log.eventType)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{log.duration}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Browser Events
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Time</TableCell>
                      <TableCell>Event Type</TableCell>
                      <TableCell>Duration (ms)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sessionData.browserEvents.map((event, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {format(new Date(event.timestamp), 'PPpp')}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={event.eventType.replace(/_/g, ' ')}
                            color={getEventColor(event.eventType)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{event.duration}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProctorDashboard;