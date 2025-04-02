import { NextApiRequest, NextApiResponse } from 'next';
import { BASE_URL } from '../../../constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get environment variables
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      BACKEND_URL: process.env.BACKEND_URL,
      BASE_URL: BASE_URL,
    };

    // Test connection to backend
    let backendStatus = 'Unknown';
    let backendError = null;
    let backendResponse = null;

    try {
      const response = await fetch(`${BASE_URL}/hello`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      backendStatus = `${response.status} ${response.statusText}`;
      
      // Try to get response as text
      const responseText = await response.text();
      
      // Try to parse as JSON
      try {
        backendResponse = JSON.parse(responseText);
      } catch (e) {
        backendResponse = responseText.substring(0, 200) + (responseText.length > 200 ? '...' : '');
      }
    } catch (error) {
      backendStatus = 'Error';
      backendError = error.message;
    }

    // Return configuration information
    return res.status(200).json({
      success: true,
      config: {
        environment: envVars,
        server: {
          timestamp: new Date().toISOString(),
          platform: process.platform,
          nodeVersion: process.version,
        },
        backend: {
          url: BASE_URL,
          status: backendStatus,
          error: backendError,
          response: backendResponse
        }
      }
    });
  } catch (error) {
    console.error('Error in debug/config API route:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error processing request',
      error: error.message 
    });
  }
}