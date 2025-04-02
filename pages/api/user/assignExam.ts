import { NextApiRequest, NextApiResponse } from 'next';
import { BASE_URL } from '../../../constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Authorization header missing' });
    }

    console.log(`Proxying assign exam request to: ${BASE_URL}/user/assignExam`);
    console.log('Request body:', JSON.stringify(req.body));
    
    const backendResponse = await fetch(`${BASE_URL}/user/assignExam`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(req.body)
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
      const errorMessage = e instanceof Error ? e.message : 'Unknown parsing error';
      return res.status(500).json({
        success: false,
        message: 'Invalid JSON response from backend',
        error: errorMessage,
        rawResponse: data.length > 100 ? data.substring(0, 100) + '...' : data
      });
    }

    // Return the response from the backend
    return res.status(backendResponse.status).json(jsonData);
  } catch (error) {
    console.error('Error in user/assignExam API route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      success: false,
      message: 'Error processing request',
      error: errorMessage
    });
  }
}