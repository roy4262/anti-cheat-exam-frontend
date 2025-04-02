import { Results } from "@mediapipe/face_detection";

export interface FaceCoordinates {
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
  leftEar: { x: number; y: number };
  rightEar: { x: number; y: number };
  nose: { x: number; y: number };
  mouth: { x: number; y: number };
}

export const extractFaceCoordinates = (result: Results): FaceCoordinates | undefined => {
  if (result.detections.length < 1) {
    return undefined;
  }

  try {
    // result.detections[0].landmarks[i]
    // i ---> landmark
    // 0 ---> Left Eye
    // 1 ---> Right Eye
    // 2 ---> Mouth
    // 3 ---> Nose/Chin
    // 4 ---> Left Ear
    // 5 ---> Right Ear

    const landmarks = result.detections[0].landmarks;

    // Check if we have all the landmarks we need
    if (landmarks.length < 6) {
      console.warn('Incomplete landmarks detected:', landmarks);
      return undefined;
    }

    const [leftEye, rightEye, mouth, nose, leftEar, rightEar] = landmarks;

    // Log the landmarks for debugging
    console.log('Landmarks detected:', {
      leftEye: { x: leftEye.x, y: leftEye.y },
      rightEye: { x: rightEye.x, y: rightEye.y },
      mouth: { x: mouth.x, y: mouth.y },
      nose: { x: nose.x, y: nose.y },
      leftEar: { x: leftEar.x, y: leftEar.y },
      rightEar: { x: rightEar.x, y: rightEar.y }
    });

    return {
      leftEye: { x: leftEye.x, y: leftEye.y },
      rightEye: { x: rightEye.x, y: rightEye.y },
      mouth: { x: mouth.x, y: mouth.y },
      nose: { x: nose.x, y: nose.y },
      leftEar: { x: leftEar.x, y: leftEar.y },
      rightEar: { x: rightEar.x, y: rightEar.y }
    };
  } catch (error) {
    console.error('Error extracting face coordinates:', error);
    return undefined;
  }
};

export const printLandmarks = (result: Results) => {
  if (result.detections.length < 1) {
    return;
  }

  const coordinates = extractFaceCoordinates(result);
  if (!coordinates) {
    return;
  }

  const { leftEar, leftEye, rightEar, rightEye, nose, mouth } = coordinates;

  console.log("----------------------");
  console.log(`LEFT EAR: x=${leftEar.x.toFixed(4)}, y=${leftEar.y.toFixed(4)}`);
  console.log(`LEFT EYE: x=${leftEye.x.toFixed(4)}, y=${leftEye.y.toFixed(4)}`);
  console.log(`MOUTH: x=${mouth.x.toFixed(4)}, y=${mouth.y.toFixed(4)}`);
  console.log(`NOSE: x=${nose.x.toFixed(4)}, y=${nose.y.toFixed(4)}`);
  console.log(`RIGHT EYE: x=${rightEye.x.toFixed(4)}, y=${rightEye.y.toFixed(4)}`);
  console.log(`RIGHT EAR: x=${rightEar.x.toFixed(4)}, y=${rightEar.y.toFixed(4)}`);
  console.log("----------------------");
};

export const detectCheating = (
  faceCoordinates: FaceCoordinates,
  printResults: boolean = false
) => {
  // Safety check for undefined coordinates
  if (!faceCoordinates) {
    console.warn('Face coordinates are undefined');
    return [false, false];
  }

  const { leftEar, leftEye, rightEar, rightEye } = faceCoordinates;

  // Validate all coordinates are present and are numbers
  if (typeof leftEar?.x !== 'number' || typeof leftEye?.x !== 'number' ||
      typeof rightEar?.x !== 'number' || typeof rightEye?.x !== 'number') {
    console.warn('Invalid face coordinates detected:', faceCoordinates);
    return [false, false];
  }

  // Calculate the distances
  const leftCoordDistance = leftEye.x - leftEar.x;
  const rightCoordDistance = rightEar.x - rightEye.x;

  // Adjust thresholds to be more sensitive
  // Increase the threshold to detect more subtle head movements
  const lookingLeftThreshold = 0.05;  // Increased from 0.025
  const lookingRightThreshold = 0.05; // Increased from 0.025

  // For looking left, the distance between left eye and left ear decreases
  // For looking right, the distance between right ear and right eye decreases
  const lookingLeft = leftCoordDistance <= lookingLeftThreshold;
  const lookingRight = rightCoordDistance <= lookingRightThreshold;

  // Always log the results for debugging
  console.log("----------------------");
  console.log(`Left Distance: ${leftCoordDistance.toFixed(4)}, Threshold: ${lookingLeftThreshold}`);
  console.log(`Right Distance: ${rightCoordDistance.toFixed(4)}, Threshold: ${lookingRightThreshold}`);
  console.log(`LOOKING LEFT: ${lookingLeft}`);
  console.log(`LOOKING RIGHT: ${lookingRight}`);
  console.log("----------------------");

  return [lookingLeft, lookingRight];
};

export const getCheatingStatus = (
  lookingLeft: boolean,
  lookingRight: boolean
): string => {
  if (lookingLeft) {
    console.log("Cheating status: Looking left");
    return "Cheating Detected: You're looking left";
  } else if (lookingRight) {
    console.log("Cheating status: Looking right");
    return "Cheating Detected: You're looking right";
  } else {
    console.log("Cheating status: Everything okay");
    return "Everything okay!";
  }
};

export const b64toBlob = async (base64: string) =>
  fetch(base64).then((res) => res.blob());
