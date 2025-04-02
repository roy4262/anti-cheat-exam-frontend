import { BASE_URL } from "../../constants";

/**
 * Log a proctor event to the backend
 * @param sessionId - The ID of the exam session
 * @param eventType - The type of proctor event (e.g., 'looking_left', 'looking_right', 'face_not_detected', 'multiple_faces')
 * @param duration - The duration of the event in milliseconds
 * @param details - Optional additional details about the event
 * @param token - Authentication token
 * @returns Promise with the result of the operation
 */
export const logProctorEvent = async (
  sessionId: string,
  eventType: string,
  duration: number = 0,
  details: any = null,
  token: string
) => {
  try {
    if (!sessionId) {
      console.error('No session ID provided for logProctorEvent');
      throw new Error('Session ID is missing');
    }

    if (!token) {
      console.error('No token provided for logProctorEvent');
      throw new Error('Authentication token is missing');
    }

    if (!eventType) {
      console.error('No event type provided for logProctorEvent');
      throw new Error('Event type is missing');
    }

    // Use the backend URL directly for server-side calls
    // We need to use an absolute URL for server-side rendering
    const isServer = typeof window === 'undefined';
    const apiUrl = isServer
      ? `${BASE_URL}/exam-session/proctor/${sessionId}`
      : `/api/exam-session/proctor/${sessionId}`;

    console.log(`Logging proctor event to: ${apiUrl}`);
    console.log(`Event type: ${eventType}, Duration: ${duration}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        eventType,
        duration,
        details
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || data?.error || `Server error: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Error logging proctor event:', error);
    throw error;
  }
};

/**
 * Log a browser event to the backend
 * @param sessionId - The ID of the exam session
 * @param eventType - The type of browser event (e.g., 'tab_switch', 'window_blur')
 * @param duration - The duration of the event in milliseconds
 * @param token - Authentication token
 * @returns Promise with the result of the operation
 */
export const logBrowserEvent = async (
  sessionId: string,
  eventType: string,
  duration: number = 0,
  token: string
) => {
  try {
    if (!sessionId) {
      console.error('No session ID provided for logBrowserEvent');
      throw new Error('Session ID is missing');
    }

    if (!token) {
      console.error('No token provided for logBrowserEvent');
      throw new Error('Authentication token is missing');
    }

    if (!eventType) {
      console.error('No event type provided for logBrowserEvent');
      throw new Error('Event type is missing');
    }

    // Use the backend URL directly for server-side calls
    // We need to use an absolute URL for server-side rendering
    const isServer = typeof window === 'undefined';
    const apiUrl = isServer
      ? `${BASE_URL}/exam-session/browser/${sessionId}`
      : `/api/exam-session/browser/${sessionId}`;

    console.log(`Logging browser event to: ${apiUrl}`);
    console.log(`Event type: ${eventType}, Duration: ${duration}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        eventType,
        duration
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || data?.error || `Server error: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Error logging browser event:', error);
    throw error;
  }
};