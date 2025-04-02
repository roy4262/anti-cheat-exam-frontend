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
import classes from "./exam-camera.module.scss";

interface ExamCameraProps {}

const ExamCamera: React.FC<ExamCameraProps> = () => {
  const [img_, setImg_] = useState<string>();
  const webcamRef: React.LegacyRef<Webcam> = useRef();
  const faceDetectionRef = useRef<FaceDetection>(null);
  const realtimeDetection = true;

  const frameRefresh = 30;
  let currentFrame = useRef(0);

  const [cheatingStatus, setCheatingStatus] = useState("");
  const [violationCount, setViolationCount] = useState(0);
  const [faceStats, setFaceStats] = useState({
    totalViolations: 0,
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
  const VIOLATION_THROTTLE_MS = 1500; // Minimum time between violations (reduced from 2000ms to 1500ms)
  const CONSECUTIVE_VIOLATIONS_THRESHOLD = 2; // Reduced from 3 to 2 to make detection more sensitive

  // Get the exam ID from the URL
  const [examId, setExamId] = useState<string | null>(null);

  useEffect(() => {
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
          setFaceStats(JSON.parse(storedStats));
        }
      } catch (e) {
        console.error('Error loading violation data from localStorage:', e);
      }
    }
  }, []);

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

      // Check for looking left/right
      const [lookingLeft, lookingRight] = detectCheating(
        faceCoordinates,
        true // Enable detailed logging
      );

      console.log(`Face detection result: lookingLeft=${lookingLeft}, lookingRight=${lookingRight}`);

      if (lookingLeft) {
        newViolation = true;
        violationType = 'lookingLeft';
        console.log('VIOLATION DETECTED: Looking left');
      } else if (lookingRight) {
        newViolation = true;
        violationType = 'lookingRight';
        console.log('VIOLATION DETECTED: Looking right');
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
            totalViolations: faceStats.totalViolations + 1,
            violationTypes: {
              lookingLeft: faceStats.violationTypes.lookingLeft + (violationType === 'lookingLeft' ? 1 : 0),
              lookingRight: faceStats.violationTypes.lookingRight + (violationType === 'lookingRight' ? 1 : 0),
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

          // Log the violation for debugging
          console.log(`Face detection violation recorded: ${violationType}, total: ${newCount}`);

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
    faceDetectionRef.current = faceDetection;

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

    await faceDetectionRef?.current?.send({ image: webcamRef.current.video });
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
