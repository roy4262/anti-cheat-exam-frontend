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

    // Log the request details
    console.log(`Proxying create exam request to: ${BASE_URL}/exam/create`);
    console.log('Request body:', JSON.stringify(req.body).substring(0, 200) + '...');

    // Make sure we're using the correct URL
    const apiUrl = `${BASE_URL}/exam/create`;
    console.log('Full API URL:', apiUrl);

    try {
      const backendResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(req.body)
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
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      return res.status(500).json({
        success: false,
        message: 'Error connecting to backend server',
        error: fetchError.message
      });
    }
  } catch (error) {
    console.error('Error in exam/create API route:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing request',
      error: error.message
    });
  }
}