import { BASE_URL } from "../../constants";

const getUser = async (email: string, password: string) => {
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    if (!res.ok || data.err) {
      throw new Error(data.err || "Failed to sign in user!");
    }

    return {
      id: data?.id,
      fname: data?.fname,
      lname: data?.lname,
      token: data?.token,
    };
  } catch (error) {
    throw new Error((error as Error).message || "Failed to sign in user!");
  }
};

const submitExam = async (
  userId: string,
  examId: string,
  answers: string[],
  token: string,
  tabSwitchCount: number = 0,
  faceDetectionViolations: number = 0,
  faceDetectionStats: any = null
) => {
  try {
    console.log(`Submitting exam ${examId} with ${answers.length} answers`);
    console.log(`Tab switch count: ${tabSwitchCount}, Face detection violations: ${faceDetectionViolations}`);

    // Filter out null answers and ensure we have a valid array
    const validAnswers = Array.isArray(answers)
      ? answers.filter(answer => answer !== null && answer !== undefined)
      : [];

    console.log(`Valid answers: ${validAnswers.length}`);

    // Use the backend URL directly for server-side calls
    // We need to use an absolute URL for server-side rendering
    const isServer = typeof window === 'undefined';
    const endpoint = isServer
      ? `${BASE_URL}/exam/${examId}/submit`
      : `/api/exam/${examId}/submit`;

    console.log(`Submitting to endpoint: ${endpoint} (${isServer ? 'server' : 'client'})`);

    // Ensure the cheating data is properly formatted
    let parsedTabSwitchCount = 0;
    let parsedFaceViolations = 0;

    // Handle tab switch count
    if (typeof tabSwitchCount === 'number') {
      parsedTabSwitchCount = tabSwitchCount;
    } else if (tabSwitchCount) {
      try {
        const parsed = parseInt(String(tabSwitchCount));
        parsedTabSwitchCount = isNaN(parsed) ? 0 : parsed;
      } catch (e) {
        console.error('Error parsing tab switch count:', e);
      }
    }

    // Handle face detection violations
    if (typeof faceDetectionViolations === 'number') {
      parsedFaceViolations = faceDetectionViolations;
    } else if (faceDetectionViolations) {
      try {
        const parsed = parseInt(String(faceDetectionViolations));
        parsedFaceViolations = isNaN(parsed) ? 0 : parsed;
      } catch (e) {
        console.error('Error parsing face detection violations:', e);
      }
    }

    // Prepare face detection stats
    let validatedStats = {
      totalViolations: parsedFaceViolations,
      violationTypes: {
        lookingLeft: 0,
        lookingRight: 0,
        faceNotDetected: 0,
        multipleFaces: 0
      }
    };

    // If stats are provided, validate them
    if (faceDetectionStats) {
      try {
        validatedStats = {
          totalViolations: typeof faceDetectionStats.totalViolations === 'number'
            ? faceDetectionStats.totalViolations
            : (faceDetectionStats.totalViolations ? parseInt(String(faceDetectionStats.totalViolations)) : parsedFaceViolations),
          violationTypes: {
            lookingLeft: typeof faceDetectionStats.violationTypes?.lookingLeft === 'number'
              ? faceDetectionStats.violationTypes.lookingLeft
              : (faceDetectionStats.violationTypes?.lookingLeft ? parseInt(String(faceDetectionStats.violationTypes.lookingLeft)) : 0),
            lookingRight: typeof faceDetectionStats.violationTypes?.lookingRight === 'number'
              ? faceDetectionStats.violationTypes.lookingRight
              : (faceDetectionStats.violationTypes?.lookingRight ? parseInt(String(faceDetectionStats.violationTypes.lookingRight)) : 0),
            faceNotDetected: typeof faceDetectionStats.violationTypes?.faceNotDetected === 'number'
              ? faceDetectionStats.violationTypes.faceNotDetected
              : (faceDetectionStats.violationTypes?.faceNotDetected ? parseInt(String(faceDetectionStats.violationTypes.faceNotDetected)) : 0),
            multipleFaces: typeof faceDetectionStats.violationTypes?.multipleFaces === 'number'
              ? faceDetectionStats.violationTypes.multipleFaces
              : (faceDetectionStats.violationTypes?.multipleFaces ? parseInt(String(faceDetectionStats.violationTypes.multipleFaces)) : 0)
          }
        };

        // Handle NaN values
        if (isNaN(validatedStats.totalViolations)) validatedStats.totalViolations = parsedFaceViolations;
        if (isNaN(validatedStats.violationTypes.lookingLeft)) validatedStats.violationTypes.lookingLeft = 0;
        if (isNaN(validatedStats.violationTypes.lookingRight)) validatedStats.violationTypes.lookingRight = 0;
        if (isNaN(validatedStats.violationTypes.faceNotDetected)) validatedStats.violationTypes.faceNotDetected = 0;
        if (isNaN(validatedStats.violationTypes.multipleFaces)) validatedStats.violationTypes.multipleFaces = 0;
      } catch (e) {
        console.error('Error validating face detection stats:', e);
      }
    } else {
      // If no stats provided but we have violations count, create a default distribution
      if (parsedFaceViolations > 0) {
        // Create a reasonable distribution of violations
        const faceNotDetected = Math.floor(parsedFaceViolations * 0.4); // 40% face not detected
        const lookingLeft = Math.floor(parsedFaceViolations * 0.3);    // 30% looking left
        const lookingRight = Math.floor(parsedFaceViolations * 0.2);   // 20% looking right
        const multipleFaces = parsedFaceViolations - faceNotDetected - lookingLeft - lookingRight; // Remainder

        validatedStats = {
          totalViolations: parsedFaceViolations,
          violationTypes: {
            lookingLeft,
            lookingRight,
            faceNotDetected,
            multipleFaces
          }
        };
      }
    }

    // Ensure the total violations matches the sum of individual violations
    const sumOfViolations =
      validatedStats.violationTypes.lookingLeft +
      validatedStats.violationTypes.lookingRight +
      validatedStats.violationTypes.faceNotDetected +
      validatedStats.violationTypes.multipleFaces;

    if (validatedStats.totalViolations !== sumOfViolations) {
      console.log(`Correcting total violations from ${validatedStats.totalViolations} to ${sumOfViolations}`);
      validatedStats.totalViolations = sumOfViolations;
      parsedFaceViolations = sumOfViolations;
    }

    const requestData = {
      answers: validAnswers,
      tabSwitchCount: parsedTabSwitchCount,
      faceDetectionViolations: parsedFaceViolations,
      faceDetectionStats: validatedStats
    };

    console.log('PREPARING EXAM SUBMISSION:');
    console.log(`- Exam ID: ${examId}`);
    console.log(`- Valid answers: ${validAnswers.length}`);
    console.log(`- Tab switch count: ${requestData.tabSwitchCount} (type: ${typeof requestData.tabSwitchCount})`);
    console.log(`- Face detection violations: ${requestData.faceDetectionViolations} (type: ${typeof requestData.faceDetectionViolations})`);
    console.log(`- Face detection stats: ${JSON.stringify(requestData.faceDetectionStats)}`);

    const requestBody = JSON.stringify(requestData);
    console.log('Request body:', requestBody);

    const res = await fetch(endpoint, {
      method: "POST",
      body: requestBody,
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    console.log('Response status:', res.status, res.statusText);

    // First try to get the response as text
    const textResponse = await res.text();
    console.log('Raw response length:', textResponse.length);

    if (textResponse.length === 0) {
      throw new Error('Empty response received from server');
    }

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(textResponse);
      console.log('Response parsed successfully');
    } catch (jsonError) {
      console.error('Response is not valid JSON:', jsonError);
      console.error('Raw response:', textResponse.substring(0, 200) + '...');
      throw new Error('Invalid JSON response from server');
    }

    if (!res.ok) {
      throw new Error(data?.error?.message || data?.message || `Server error: ${res.status}`);
    }

    return data;
  } catch (error) {
    console.error('Error submitting exam:', error);
    throw new Error((error as Error).message || "Failed to submit exam!");
  }
};

export { getUser, submitExam };
