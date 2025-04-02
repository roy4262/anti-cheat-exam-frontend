import { NextApiRequest, NextApiResponse } from 'next';
import { BASE_URL } from '../../../constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header missing' });
    }

    console.log('Proxying exam results request to:', `${BASE_URL}/user/exam-results`);
    
    const backendResponse = await fetch(`${BASE_URL}/user/exam-results`, {
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
      return res.status(500).json({ error: 'Invalid JSON response from backend' });
    }

    // Return the response from the backend
    return res.status(backendResponse.status).json(jsonData);
  } catch (error) {
    console.error('Error in exam-results API route:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return res.status(500).json({ error: errorMessage });
  }
}