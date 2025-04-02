import { NextApiRequest, NextApiResponse } from 'next';
import { BASE_URL } from '../../../constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    console.log(`Testing connection to backend: ${BASE_URL}/exam-session/test`);

    try {
      const backendResponse = await fetch(`${BASE_URL}/exam-session/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Backend response status:', backendResponse.status);
      
      // Get the response data
      let data;
      try {
        const textResponse = await backendResponse.text();
        console.log('Raw response:', textResponse);
        
        try {
          data = JSON.parse(textResponse);
        } catch (jsonError) {
          console.error('Error parsing JSON response:', jsonError);
          return res.status(500).json({
            success: false,
            message: 'Error parsing backend response',
            error: textResponse
          });
        }
      } catch (textError) {
        console.error('Error getting response text:', textError);
        return res.status(500).json({
          success: false,
          message: 'Error reading backend response',
          error: textError.message
        });
      }
      
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
    console.error('Error in exam-session/test API route:', error);
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