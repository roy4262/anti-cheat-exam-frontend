import { BASE_URL } from "../../constants";

/**
 * Delete an exam session
 * @param sessionId - The ID of the exam session to delete
 * @param token - Authentication token
 * @returns Promise with the result of the operation
 */
export const deleteExamSession = async (
  sessionId: string,
  token: string
): Promise<{ success: boolean; message: string }> => {
  try {
    if (!sessionId) {
      console.error('No session ID provided for deleteExamSession');
      throw new Error('Session ID is missing');
    }

    if (!token) {
      console.error('No token provided for deleteExamSession');
      throw new Error('Authentication token is missing');
    }

    console.log(`Deleting exam session: ${sessionId}`);

    // First try the regular delete endpoint
    try {
      console.log(`Making DELETE request to /api/exam-session/delete/${sessionId}`);

      const response = await fetch(`/api/exam-session/delete/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log(`Response status: ${response.status}`);

      // If the response is OK, try to parse it
      if (response.ok) {
        try {
          const textResponse = await response.text();
          console.log(`Raw response: ${textResponse.substring(0, 100)}${textResponse.length > 100 ? '...' : ''}`);

          // Check if the response is empty
          if (!textResponse || textResponse.trim() === '') {
            console.log('Empty response from server, but status was OK');
            return {
              success: true,
              message: "Exam session deleted successfully"
            };
          }

          try {
            const data = JSON.parse(textResponse);
            return data;
          } catch (jsonError) {
            console.error('Error parsing JSON response, but status was OK:', jsonError);
            return {
              success: true,
              message: "Exam session deleted successfully"
            };
          }
        } catch (textError) {
          console.error('Error getting response text, but status was OK:', textError);
          return {
            success: true,
            message: "Exam session deleted successfully"
          };
        }
      } else {
        // If the response is not OK, try to get the error message
        try {
          const textResponse = await response.text();
          console.log(`Error response: ${textResponse.substring(0, 100)}${textResponse.length > 100 ? '...' : ''}`);

          try {
            const errorData = JSON.parse(textResponse);
            throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
          } catch (jsonError) {
            console.error('Error parsing JSON error response:', jsonError);
            throw new Error(textResponse || `Server error: ${response.status}`);
          }
        } catch (textError) {
          console.error('Error getting error response text:', textError);
          throw new Error(`Server error: ${response.status}`);
        }
      }
    } catch (mainError) {
      console.error('Error with main delete endpoint, trying simple delete:', mainError);

      // If the regular delete endpoint fails, try the simple delete endpoint
      console.log(`Making DELETE request to /api/exam-session/simple-delete/${sessionId}`);

      const simpleResponse = await fetch(`/api/exam-session/simple-delete/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log(`Simple delete response status: ${simpleResponse.status}`);

      if (simpleResponse.ok) {
        return {
          success: true,
          message: "Exam session deleted successfully (fallback)"
        };
      } else {
        throw mainError; // Re-throw the original error
      }
    }
  } catch (error) {
    console.error('Error deleting exam session:', error);
    throw error;
  }
};

export const startExamSession = async (examId: string, token: string) => {
  try {
    const res = await fetch(`/api/exam-session/start/${examId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to start exam session');
    }

    return data.sessionId;
  } catch (error) {
    console.error('Error starting exam session:', error);
    throw error;
  }
};