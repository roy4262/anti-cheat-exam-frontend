import { NextApiRequest, NextApiResponse } from 'next';
import { BASE_URL } from '../../../../constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Authorization header missing' });
    }

    const { sessionId } = req.query;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }

    console.log(`Proxying admin exam session request to: ${BASE_URL}/admin/exam-session/${sessionId}`);
    
    const backendResponse = await fetch(`${BASE_URL}/admin/exam-session/${sessionId}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const data = await backendResponse.text();
    console.log('Backend response status:', backendResponse.status);
    console.log('Response length:', data.length);

    // Try to parse as JSON
    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      console.error('Raw response:', data.substring(0, 200) + '...');
      return res.status(500).json({ 
        success: false, 
        message: 'Invalid JSON response from backend',
        error: e.message,
        rawResponse: data.length > 100 ? data.substring(0, 100) + '...' : data
      });
    }

    // Return the response from the backend
    return res.status(backendResponse.status).json(jsonData);
  } catch (error) {
    console.error('Error in admin/exam-session/[sessionId] API route:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error processing request',
      error: error.message 
    });
  }
}