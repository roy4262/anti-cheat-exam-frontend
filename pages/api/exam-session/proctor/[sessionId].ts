import type { NextApiRequest, NextApiResponse } from 'next';
import { BASE_URL } from '../../../../constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
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
    console.log(`Proxying proctor event to: ${BASE_URL}/exam-session/proctor/${sessionId}`);
    console.log('Request body:', JSON.stringify(req.body));

    try {
      const backendResponse = await fetch(`${BASE_URL}/exam-session/proctor/${sessionId}`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(req.body || {})
      });

      console.log('Backend response status:', backendResponse.status);
      
      // Get the response data
      const data = await backendResponse.json();
      
      // Return the response from the backend
      return res.status(backendResponse.status).json(data);
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
    console.error('Error in exam-session/proctor/[sessionId] API route:', error);
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