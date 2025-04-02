import { NextApiRequest, NextApiResponse } from 'next';
import { BASE_URL } from '../../../../constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'DELETE') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Authorization header missing' });
    }

    const { sessionId } = req.query;
    if (!sessionId || Array.isArray(sessionId)) {
      return res.status(400).json({ success: false, message: 'Invalid session ID' });
    }

    // Log the request details
    const url = `${BASE_URL}/exam-session/${sessionId}`;
    console.log(`Proxying delete request to: ${url}`);
    console.log(`Authorization header: ${authHeader.substring(0, 15)}...`);

    try {
      // Make the request to the backend
      const backendResponse = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Backend response status:', backendResponse.status);

      // For successful responses (2xx), return a success message even if we can't parse the response
      if (backendResponse.ok) {
        try {
          // Try to get and parse the response
          const textResponse = await backendResponse.text();
          console.log('Raw response:', textResponse);

          // If we have a non-empty response, try to parse it
          if (textResponse && textResponse.trim() !== '') {
            try {
              const data = JSON.parse(textResponse);
              return res.status(200).json(data);
            } catch (jsonError) {
              console.error('Error parsing JSON response, but status was OK:', jsonError);
              // If we can't parse it but the status was OK, return a success message
              return res.status(200).json({
                success: true,
                message: "Exam session deleted successfully"
              });
            }
          } else {
            // Empty response but status was OK
            console.log('Empty response from backend, but status was OK');
            return res.status(200).json({
              success: true,
              message: "Exam session deleted successfully"
            });
          }
        } catch (textError) {
          // Error getting the response text, but status was OK
          console.error('Error getting response text, but status was OK:', textError);
          return res.status(200).json({
            success: true,
            message: "Exam session deleted successfully"
          });
        }
      } else {
        // For error responses, try to get the error message
        try {
          const textResponse = await backendResponse.text();
          console.log('Error response:', textResponse);

          try {
            const errorData = JSON.parse(textResponse);
            return res.status(backendResponse.status).json(errorData);
          } catch (jsonError) {
            console.error('Error parsing JSON error response:', jsonError);
            return res.status(backendResponse.status).json({
              success: false,
              message: textResponse || `Server error: ${backendResponse.status}`
            });
          }
        } catch (textError) {
          console.error('Error getting error response text:', textError);
          return res.status(backendResponse.status).json({
            success: false,
            message: `Server error: ${backendResponse.status}`
          });
        }
      }
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      const errorMessage = fetchError instanceof Error
        ? fetchError.message
        : 'Unknown fetch error occurred';

      return res.status(500).json({
        success: false,
        message: 'Error connecting to backend server',
        error: errorMessage
      });
    }
  } catch (error) {
    console.error('Error in exam-session/delete/[sessionId] API route:', error);
    const errorMessage = error instanceof Error
      ? error.message
      : 'Unknown error occurred';

    return res.status(500).json({
      success: false,
      message: 'Error processing request',
      error: errorMessage
    });
  }
}