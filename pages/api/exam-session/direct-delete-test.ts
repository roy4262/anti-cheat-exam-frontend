import { NextApiRequest, NextApiResponse } from 'next';
import { BASE_URL } from '../../../constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // This is a test endpoint that directly calls the backend without any error handling
    // It's useful for debugging connection issues
    const sessionId = req.query.sessionId as string;
    const token = req.query.token as string;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Missing sessionId parameter' });
    }

    if (!token) {
      return res.status(400).json({ success: false, message: 'Missing token parameter' });
    }

    console.log(`Testing direct delete to backend: ${BASE_URL}/exam-session/${sessionId}`);

    const backendResponse = await fetch(`${BASE_URL}/exam-session/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('Backend response status:', backendResponse.status);
    
    // Return the raw response
    const textResponse = await backendResponse.text();
    
    return res.status(200).json({
      success: true,
      backendStatus: backendResponse.status,
      backendResponse: textResponse,
      message: 'Direct delete test completed'
    });
  } catch (error) {
    console.error('Error in direct-delete-test API route:', error);
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