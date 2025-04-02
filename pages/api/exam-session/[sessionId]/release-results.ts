import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { BASE_URL } from '../../../../constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Get the session using getSession instead of getToken
    const session = await getSession({ req });

    if (!session || !session.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    // Get the token from the session
    const token = session.user.token;

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token found in session' });
    }

    // Check if the user is a teacher
    if (session.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Not authorized. Only teachers can release results.' });
    }

    const { sessionId } = req.query;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }

    console.log(`Releasing results for session: ${sessionId} by teacher: ${session.user.email}`);

    // Forward the request to the backend
    const response = await fetch(`${BASE_URL}/exam-session/${sessionId}/release-results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    // Get the response as text first for debugging
    const textResponse = await response.text();
    console.log('Backend response:', textResponse);

    // Try to parse the response as JSON
    let data;
    try {
      data = JSON.parse(textResponse);
    } catch (error) {
      console.error('Error parsing response:', error);
      return res.status(500).json({
        success: false,
        message: 'Invalid response from server',
        rawResponse: textResponse
      });
    }

    if (!response.ok) {
      console.error('Error from backend:', data);
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error releasing exam results:', error);

    // Handle the unknown error type properly
    const errorMessage = error instanceof Error
      ? error.message
      : 'Unknown error occurred';

    return res.status(500).json({
      success: false,
      message: 'Error releasing exam results',
      error: errorMessage
    });
  }
}