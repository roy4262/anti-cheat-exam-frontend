import { BASE_URL } from "../../constants";

/**
 * Get all exam sessions
 * @param token - Authentication token
 * @param status - Optional filter by status
 * @param page - Optional page number for pagination
 * @param limit - Optional limit for pagination
 * @returns Promise with exam sessions data
 */
export const getExamSessions = async (
  token: string,
  status?: string,
  page?: number,
  limit?: number
) => {
  try {
    if (!token) {
      console.error('No token provided for getExamSessions');
      throw new Error('Authentication token is missing');
    }

    // Use the backend URL directly for server-side calls
    // We need to use an absolute URL for server-side rendering
    const isServer = typeof window === 'undefined';
    
    // Build query string
    let queryString = '';
    if (status || page || limit) {
      queryString = '?';
      if (status) queryString += `status=${status}&`;
      if (page) queryString += `page=${page}&`;
      if (limit) queryString += `limit=${limit}&`;
      // Remove trailing & if present
      queryString = queryString.endsWith('&') 
        ? queryString.slice(0, -1) 
        : queryString;
    }
    
    const apiUrl = isServer
      ? `${BASE_URL}/admin/exam-sessions${queryString}`
      : `/api/admin/exam-sessions${queryString}`;

    console.log(`Fetching exam sessions from: ${apiUrl} (${isServer ? 'server' : 'client'})`);
    console.log('Using token:', token.substring(0, 10) + '...');

    const res = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
    });

    console.log('Response status:', res.status, res.statusText);

    // First try to get the response as text
    const textResponse = await res.text();
    console.log('Raw response length:', textResponse.length);

    if (textResponse.length === 0) {
      console.error('Empty response received from server');
      return { sessions: [] };
    }

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(textResponse);
      console.log('Response parsed successfully:', data ? 'Data received' : 'No data');
    } catch (jsonError) {
      console.error('Response is not valid JSON:', jsonError);
      console.error('Raw response:', textResponse);
      throw new Error('Invalid JSON response from server');
    }

    if (!res.ok) {
      console.error('Server returned error status:', res.status);
      throw new Error(data?.message || data?.error || `Server error: ${res.status}`);
    }

    // Check if sessions property exists in data or data.data
    let sessions = [];
    if (data.sessions) {
      // Direct sessions property
      sessions = data.sessions;
      console.log('Found sessions directly in response');
    } else if (data.data && data.data.sessions) {
      // Sessions inside data property (from handleSuccess)
      sessions = data.data.sessions;
      console.log('Found sessions inside data.data.sessions');
    } else if (data.success) {
      console.warn('Response has success=true but no sessions property found');
      // Check if the entire data object might be the sessions array
      if (data.data && Array.isArray(data.data)) {
        console.log('Found array in data.data, using as sessions');
        sessions = data.data;
      }
    }

    console.log('Sessions received:', sessions.length);

    return { sessions, totalCount: data.totalCount || sessions.length };
  } catch (e) {
    console.error('Error fetching exam sessions:', e);
    throw e;
  }
};

/**
 * Get a specific exam session by ID
 * @param sessionId - The ID of the exam session to fetch
 * @param token - Authentication token
 * @returns Promise with the exam session data
 */
export const getExamSessionById = async (sessionId: string, token: string) => {
  try {
    if (!token) {
      console.error('No token provided for getExamSessionById');
      throw new Error('Authentication token is missing');
    }

    if (!sessionId) {
      console.error('No session ID provided for getExamSessionById');
      throw new Error('Session ID is missing');
    }

    // Use the backend URL directly for server-side calls
    // We need to use an absolute URL for server-side rendering
    const isServer = typeof window === 'undefined';
    const apiUrl = isServer
      ? `${BASE_URL}/admin/exam-session/${sessionId}`
      : `/api/admin/exam-session/${sessionId}`;

    console.log(`Fetching exam session from: ${apiUrl} (${isServer ? 'server' : 'client'})`);
    console.log('Using token:', token.substring(0, 10) + '...');

    const res = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
    });

    console.log('Response status:', res.status, res.statusText);

    // First try to get the response as text
    const textResponse = await res.text();
    console.log('Raw response length:', textResponse.length);

    if (textResponse.length === 0) {
      console.error('Empty response received from server');
      throw new Error('Empty response received from server');
    }

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(textResponse);
      console.log('Response parsed successfully:', data ? 'Data received' : 'No data');
    } catch (jsonError) {
      console.error('Response is not valid JSON:', jsonError);
      console.error('Raw response:', textResponse);
      throw new Error('Invalid JSON response from server');
    }

    if (!res.ok) {
      console.error('Server returned error status:', res.status);
      throw new Error(data?.message || data?.error || `Server error: ${res.status}`);
    }

    // Check if session property exists in data or data.data
    let session = null;
    if (data.session) {
      // Direct session property
      session = data.session;
      console.log('Found session directly in response');
    } else if (data.data && data.data.session) {
      // Session inside data property (from handleSuccess)
      session = data.data.session;
      console.log('Found session inside data.data.session');
    }

    if (!session) {
      throw new Error('No session data found in response');
    }

    return session;
  } catch (e) {
    console.error('Error fetching exam session:', e);
    throw e;
  }
};

/**
 * Release exam results to students
 * @param sessionId - The ID of the exam session to release results for
 * @param token - Authentication token
 * @returns Promise with the result of the operation
 */
export const releaseExamResults = async (sessionId: string, token: string) => {
  try {
    if (!token) {
      console.error('No token provided for releaseExamResults');
      throw new Error('Authentication token is missing');
    }

    if (!sessionId) {
      console.error('No session ID provided for releaseExamResults');
      throw new Error('Session ID is missing');
    }

    // Use the backend URL directly for server-side calls
    // We need to use an absolute URL for server-side rendering
    const isServer = typeof window === 'undefined';
    const apiUrl = isServer
      ? `${BASE_URL}/exam-session/${sessionId}/release-results`
      : `/api/admin/release-results/${sessionId}`;

    console.log(`Releasing exam results: ${apiUrl} (${isServer ? 'server' : 'client'})`);
    console.log('Using token:', token.substring(0, 10) + '...');

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
    });

    console.log('Response status:', res.status, res.statusText);

    // First try to get the response as text
    const textResponse = await res.text();
    console.log('Raw response length:', textResponse.length);

    if (textResponse.length === 0) {
      console.error('Empty response received from server');
      throw new Error('Empty response received from server');
    }

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(textResponse);
      console.log('Response parsed successfully:', data ? 'Data received' : 'No data');
    } catch (jsonError) {
      console.error('Response is not valid JSON:', jsonError);
      console.error('Raw response:', textResponse);
      throw new Error('Invalid JSON response from server');
    }

    if (!res.ok) {
      console.error('Server returned error status:', res.status);
      throw new Error(data?.message || data?.error || `Server error: ${res.status}`);
    }

    return data;
  } catch (e) {
    console.error('Error releasing exam results:', e);
    throw e;
  }
};