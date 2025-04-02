import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { BASE_URL } from '../../../../constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Get the session token
    const token = await getToken({ req });
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    // Get the session ID from the URL
    const { sessionId } = req.query;
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid session ID' });
    }

    console.log(`Fetching stats for exam session ${sessionId}`);

    // Forward the request to the backend
    const response = await fetch(`${BASE_URL}/exam-session/stats/${sessionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Get the response as text first for debugging
    const responseText = await response.text();
    console.log(`Response from backend (${response.status}):`, responseText.length > 100 ? `${responseText.substring(0, 100)}...` : responseText);

    // Parse the response
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response:', e);
      return res.status(500).json({ success: false, message: 'Invalid response from server' });
    }

    // Check if the request was successful
    if (!response.ok) {
      const errorMessage = data?.message || `Server error: ${response.status}`;
      console.error('Error from backend:', errorMessage);
      return res.status(response.status).json({ success: false, message: errorMessage });
    }

    // Return the data
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in exam session stats API route:', error);
    return res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'An unexpected error occurred' 
    });
  }
}