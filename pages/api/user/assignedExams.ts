import { NextApiRequest, NextApiResponse } from 'next';
import { BASE_URL } from '../../../constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Authorization header missing' });
    }

    // Log the request details
    console.log(`Proxying get assigned exams request to: ${BASE_URL}/user/assignedExams`);
    
    try {
      const backendResponse = await fetch(`${BASE_URL}/user/assignedExams`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Backend response status:', backendResponse.status);
      
      // Get the raw response text
      const data = await backendResponse.text();
      console.log('Response length:', data.length);
      
      if (data.length === 0) {
        console.error('Empty response from backend');
        return res.status(500).json({ 
          success: false, 
          message: 'Empty response from backend server'
        });
      }
      
      // Check if the response is HTML (error page)
      if (data.trim().startsWith('<!DOCTYPE html>') || data.trim().startsWith('<html')) {
        console.error('HTML response received instead of JSON:', data.substring(0, 200));
        return res.status(500).json({ 
          success: false, 
          message: 'Backend returned HTML instead of JSON. The endpoint may not exist or may be incorrectly configured.',
          rawResponse: data.substring(0, 200) + '...'
        });
      }

      // Try to parse as JSON
      let jsonData;
      try {
        jsonData = JSON.parse(data);
        console.log('Successfully parsed JSON response');
        console.log('Exams received:', jsonData.exams ? jsonData.exams.length : 0);
      } catch (e: unknown) {
        console.error('Failed to parse response as JSON:', e);
        console.error('Raw response:', data.substring(0, 200) + '...');
        const errorMessage = e instanceof Error ? e.message : 'JSON parse error';
        return res.status(500).json({
          success: false,
          message: 'Invalid JSON response from backend',
          error: errorMessage,
          rawResponse: data.length > 100 ? data.substring(0, 100) + '...' : data
        });
      }

      // Return the response from the backend
      return res.status(backendResponse.status).json(jsonData);
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      const errorMessage = fetchError instanceof Error
        ? fetchError.message
        : 'Unknown error occurred';

      return res.status(500).json({
        success: false,
        message: 'Error connecting to backend server',
        error: errorMessage
      });
    }
  } catch (error) {
    console.error('Error in user/assignedExams API route:', error);
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