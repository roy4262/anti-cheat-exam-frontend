import { Camera } from "@mediapipe/camera_utils";
import { FaceDetection, Results } from "@mediapipe/face_detection";
import { Button } from "@mui/material";
import NextImage from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import Webcam from "react-webcam";
import {
  b64toBlob,
  detectCheating,
  extractFaceCoordinates,
  getCheatingStatus,
  printLandmarks,
} from "../../helpers/face-detection/face-detection-helper";
import { logProctorEvent } from "../../helpers/api/proctor-api";
import classes from "./exam-camera.module.scss";

interface ExamCameraProps {
  sessionId?: string;
  token?: string;
}

const ExamCamera: React.FC<ExamCameraProps> = ({ sessionId: propSessionId, token }) => {
  const [img_, setImg_] = useState<string>();
  const webcamRef: React.LegacyRef<Webcam> = useRef();
  const faceDetectionRef = useRef<FaceDetection | null>(null);
  const realtimeDetection = true;

  const frameRefresh = 30;
  let currentFrame = useRef(0);

  const [cheatingStatus, setCheatingStatus] = useState("");
  const [violationCount, setViolationCount] = useState(0);
  const [faceStats, setFaceStats] = useState({
    totalViolations: 0,
    totalWarnings: 0, // Added to track warnings separately
    violationTypes: {
      lookingLeft: 0,
      lookingRight: 0,
      faceNotDetected: 0,
      multipleFaces: 0
    }
  });

  // Add throttling to prevent too many violations in a short time
  const lastViolationTimeRef = useRef<number>(0);
  const consecutiveViolationsRef = useRef<number>(0);
  const violationTypeRef = useRef<string>('');
  const VIOLATION_THROTTLE_MS = 2000; // Minimum time between violations (2 seconds)
  const CONSECUTIVE_VIOLATIONS_THRESHOLD = 3; // Number of consecutive violations needed to count

  // Get the exam ID from the URL or props
  const [examId, setExamId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Set session ID from props if available
    if (propSessionId) {
      setSessionId(propSessionId);
    }

    // Extract exam ID from URL
    const path = window.location.pathname;
    const matches = path.match(/\/exam\/([^\/]+)/);
    if (matches && matches[1]) {
      setExamId(matches[1]);

      // Load existing violation data if available
      try {
        const storedViolations = localStorage.getItem(`exam_${matches[1]}_violations`);
        if (storedViolations) {
          setViolationCount(parseInt(storedViolations, 10));
        }

        const storedStats = localStorage.getItem(`exam_${matches[1]}_stats`);
        if (storedStats) {
          const parsedStats = JSON.parse(storedStats);
          // Ensure totalWarnings exists
          if (!parsedStats.totalWarnings) {
            parsedStats.totalWarnings = 0;
          }
          setFaceStats(parsedStats);
        }
      } catch (e) {
        console.error('Error loading violation data from localStorage:', e);
      }
    }
  }, [propSessionId]);

  useEffect(() => {
    const faceDetection: FaceDetection = new FaceDetection({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
      },
    });

    faceDetection.setOptions({
      minDetectionConfidence: 0.5,
      model: "short",
    });

    function onResult(result: Results) {
      let newViolation = false;
      let violationType = '';
      let isWarning = false; // Flag to track if this is a warning or violation

      // Check for face detection issues
      if (result.detections.length < 1) {
        // Face not detected
        newViolation = true;
        violationType = 'faceNotDetected';
        setCheatingStatus("Cheating Detected: Face not visible");
        return;
      } else if (result.detections.length > 1) {
        // Multiple faces detected
        newViolation = true;
        violationType = 'multipleFaces';
        setCheatingStatus("Cheating Detected: Multiple faces detected");
        return;
      }

      const faceCoordinates = extractFaceCoordinates(result);

      // Check for looking left/right - only if face coordinates are available
      if (!faceCoordinates) {
        // Handle case where face coordinates couldn't be extracted
        setCheatingStatus("Warning: Face detected but coordinates not clear");
        console.log('Face coordinates could not be extracted from result:', result);
        return;
      }

      // Log face coordinates for debugging
      console.log('Face coordinates:', {
        leftEye: faceCoordinates.leftEye,
        rightEye: faceCoordinates.rightEye,
        nose: faceCoordinates.nose,
        mouth: faceCoordinates.mouth
      });

      const [lookingLeft, lookingRight] = detectCheating(
        faceCoordinates,
        false
      );

      if (lookingLeft) {
        newViolation = true;
        violationType = 'lookingLeft';
        // Determine if this is a warning or violation based on severity
        isWarning = faceCoordinates.rightEye.x > 0.3; // Example threshold
        console.log(`Looking left detected - rightEye.x: ${faceCoordinates.rightEye.x}, isWarning: ${isWarning}`);

        // Print landmarks for debugging
        printLandmarks(result);
      } else if (lookingRight) {
        newViolation = true;
        violationType = 'lookingRight';
        // Determine if this is a warning or violation based on severity
        isWarning = faceCoordinates.leftEye.x < 0.7; // Example threshold
        console.log(`Looking right detected - leftEye.x: ${faceCoordinates.leftEye.x}, isWarning: ${isWarning}`);

        // Print landmarks for debugging
        printLandmarks(result);
      }

      const cheatingStatus = getCheatingStatus(lookingLeft, lookingRight);
      setCheatingStatus(cheatingStatus);

      // If a violation was detected, process it with throttling
      if (newViolation && examId) {
        const now = Date.now();

        // Check if this is the same type of violation as the previous one
        if (violationType === violationTypeRef.current) {
          // Increment consecutive violations counter
          consecutiveViolationsRef.current++;
          console.log(`Same violation type (${violationType}), consecutive count: ${consecutiveViolationsRef.current}`);
        } else {
          // Reset consecutive violations counter for new violation type
          consecutiveViolationsRef.current = 1;
          violationTypeRef.current = violationType;
          console.log(`New violation type: ${violationType}, reset consecutive count to 1`);
        }

        // Only count the violation if:
        // 1. It's been at least VIOLATION_THROTTLE_MS since the last counted violation, AND
        // 2. We've seen the same violation type consecutively for CONSECUTIVE_VIOLATIONS_THRESHOLD times
        const shouldCountViolation =
          (now - lastViolationTimeRef.current >= VIOLATION_THROTTLE_MS) &&
          (consecutiveViolationsRef.current >= CONSECUTIVE_VIOLATIONS_THRESHOLD);

        if (shouldCountViolation) {
          console.log(`Counting violation after ${consecutiveViolationsRef.current} consecutive detections`);

          // Update the last violation time
          lastViolationTimeRef.current = now;

          // Update violation count
          const newCount = violationCount + 1;
          setViolationCount(newCount);

          // Create a deep copy of the stats to avoid mutation issues
          const newStats = {
            totalViolations: isWarning ? faceStats.totalViolations : faceStats.totalViolations + 1,
            totalWarnings: isWarning ? faceStats.totalWarnings + 1 : faceStats.totalWarnings,
            violationTypes: {
              lookingLeft: faceStats.violationTypes.lookingLeft + (violationType === 'lookingLeft' && !isWarning ? 1 : 0),
              lookingRight: faceStats.violationTypes.lookingRight + (violationType === 'lookingRight' && !isWarning ? 1 : 0),
              faceNotDetected: faceStats.violationTypes.faceNotDetected + (violationType === 'faceNotDetected' ? 1 : 0),
              multipleFaces: faceStats.violationTypes.multipleFaces + (violationType === 'multipleFaces' ? 1 : 0)
            }
          };

          setFaceStats(newStats);

          // Store in localStorage with proper error handling
          try {
            // First verify we can access localStorage
            if (typeof localStorage !== 'undefined') {
              // Store the violation count
              localStorage.setItem(`exam_${examId}_violations`, newCount.toString());

              // Store the detailed stats as JSON
              const statsJson = JSON.stringify(newStats);
              localStorage.setItem(`exam_${examId}_stats`, statsJson);

              // Log the stored data for debugging
              console.log('CHEATING DATA STORED:');
              console.log(`- Exam ID: ${examId}`);
              console.log(`- Violation count: ${newCount}`);
              console.log(`- Stats: ${statsJson}`);

              // Verify the data was stored correctly
              const verifyViolations = localStorage.getItem(`exam_${examId}_violations`);
              const verifyStats = localStorage.getItem(`exam_${examId}_stats`);
              console.log('VERIFICATION:');
              console.log(`- Stored violations: ${verifyViolations}`);
              console.log(`- Stored stats: ${verifyStats ? 'Present' : 'Missing'}`);

              // If verification fails, try again
              if (!verifyViolations || !verifyStats) {
                console.warn('Verification failed, trying again...');
                localStorage.setItem(`exam_${examId}_violations`, newCount.toString());
                localStorage.setItem(`exam_${examId}_stats`, statsJson);
              }
            } else {
              console.error('localStorage is not available');
            }
          } catch (e) {
            console.error('Error storing violation data in localStorage:', e);
          }

          // Send the violation to the backend if session ID and token are available
          if (sessionId && token) {
            try {
              // Map the violation type to the backend format
              let backendEventType = '';
              switch (violationType) {
                case 'lookingLeft':
                  backendEventType = 'looking_left';
                  console.log('Mapped lookingLeft to looking_left');
                  break;
                case 'lookingRight':
                  backendEventType = 'looking_right';
                  console.log('Mapped lookingRight to looking_right');
                  break;
                case 'faceNotDetected':
                  backendEventType = 'face_not_detected';
                  console.log('Mapped faceNotDetected to face_not_detected');
                  break;
                case 'multipleFaces':
                  backendEventType = 'multiple_faces';
                  console.log('Mapped multipleFaces to multiple_faces');
                  break;
                default:
                  backendEventType = violationType;
                  console.log(`Using original violation type: ${violationType}`);
              }

              // Only send actual violations to the backend, not warnings
              if (!isWarning) {
                logProctorEvent(
                  sessionId,
                  backendEventType,
                  0, // Duration (not applicable for face detection)
                  { isWarning: false }, // Additional details
                  token
                ).then(response => {
                  console.log('Proctor event logged successfully:', response);
                }).catch(error => {
                  console.error('Error logging proctor event:', error);
                });
              } else {
                console.log('Warning detected, not sending to backend');
              }
            } catch (e) {
              console.error('Error sending violation to backend:', e);
            }
          } else {
            console.log('Session ID or token not available, skipping backend update');
          }

          // Log the violation for debugging
          console.log(`Face detection ${isWarning ? 'warning' : 'violation'} recorded: ${violationType}, total: ${newCount}`);

          // Reset consecutive counter after counting a violation
          consecutiveViolationsRef.current = 0;
        } else {
          console.log(`Violation detected but not counted yet. Need ${CONSECUTIVE_VIOLATIONS_THRESHOLD - consecutiveViolationsRef.current} more consecutive detections.`);
        }
      } else {
        // Reset consecutive violations counter if no violation detected
        if (consecutiveViolationsRef.current > 0) {
          console.log('No violation detected, resetting consecutive counter');
          consecutiveViolationsRef.current = 0;
          violationTypeRef.current = '';
        }
      }
    }

    faceDetection.onResults(onResult);
    // Using type assertion to fix the TypeScript error
    (faceDetectionRef as React.MutableRefObject<FaceDetection>).current = faceDetection;

    try {
      if (webcamRef.current && webcamRef.current.video) {
        const camera = new Camera(webcamRef.current.video, {
          onFrame: async () => {
            try {
              // Proceed frames only if real time detection is on
              if (!realtimeDetection) {
                return;
              }

              currentFrame.current += 1;

              if (currentFrame.current >= frameRefresh) {
                currentFrame.current = 0;
                if (webcamRef.current && webcamRef.current.video) {
                  await faceDetection.send({ image: webcamRef.current.video });
                }
              }
            } catch (e) {
              console.error('Error in camera onFrame:', e);
              // Don't throw to prevent breaking the camera loop
            }
          },
          width: 1280,
          height: 720,
        });

        camera.start().catch(e => {
          console.error('Error starting camera:', e);
          setCheatingStatus("Error: Camera could not be started");
        });
      } else {
        console.error('Webcam reference or video element is not available');
        setCheatingStatus("Error: Camera is not available");
      }
    } catch (e) {
      console.error('Error setting up camera:', e);
      setCheatingStatus("Error: Camera setup failed");
    }

    return () => {
      try {
        if (faceDetection) {
          faceDetection.close();
        }
      } catch (e) {
        console.error('Error closing face detection:', e);
      }
    };
  }, [webcamRef, realtimeDetection]);

  const onResultClick = async () => {
    // const imgSrc = webcamRef.current.getScreenshot();
    // const blob = await b64toBlob(imgSrc);
    // const img = new Image(600, 400);
    // const src = URL.createObjectURL(blob);
    // img.src = src;
    // setImg_(src);

    if (webcamRef.current && webcamRef.current.video) {
      console.log('Manually sending image to face detection');
      await faceDetectionRef?.current?.send({ image: webcamRef.current.video });
    }
  };

  return (
    <div className={classes.cameraContainer}>
      <div className={classes.statusContainer}>
        <p className={`${classes.cheatingStatus} ${cheatingStatus.includes('Cheating') ? classes.cheatingDetected : ''}`}>
          {cheatingStatus || "Face detection active"}
        </p>
        {violationCount > 0 && (
          <p className={classes.violationCount}>
            Violations: <strong>{violationCount}</strong>
          </p>
        )}
        <Button
          variant="contained"
          color="primary"
          onClick={onResultClick}
          style={{ marginTop: '10px', display: 'none' }} // Hidden in production
        >
          Test Face Detection
        </Button>
      </div>

      <Webcam
        className={classes.camera}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        mirrored={false}
        audio={false}
        videoConstraints={{
          width: 1280,
          height: 720,
          facingMode: "user"
        }}
        onUserMediaError={(error) => {
          console.error('Webcam error:', error);
          setCheatingStatus("Error: Cannot access camera");
        }}
      />

      {img_ && <NextImage src={img_} alt="Profile" className={classes.capturedImage} />}
    </div>
  );
};

export default ExamCamera;