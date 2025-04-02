import { NextApiRequest, NextApiResponse } from 'next';
import { BASE_URL } from '../../constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Log the BASE_URL
    console.log('Testing backend connection to:', BASE_URL);
    
    // Try to connect to the backend
    const response = await fetch(`${BASE_URL}/hello`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    // Get the response as text
    const textResponse = await response.text();
    console.log('Backend response status:', response.status);
    console.log('Raw response:', textResponse);
    
    // Try to parse as JSON
    let jsonData;
    try {
      jsonData = JSON.parse(textResponse);
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      
      // Check if the response is HTML
      if (textResponse.trim().startsWith('<!DOCTYPE html>') || textResponse.trim().startsWith('<html')) {
        return res.status(500).json({
          success: false,
          message: 'Backend returned HTML instead of JSON',
          rawResponse: textResponse.substring(0, 200) + '...'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Invalid JSON response from backend',
        rawResponse: textResponse
      });
    }
    
    // Return the backend response
    return res.status(response.status).json({
      success: true,
      message: 'Backend connection successful',
      backendResponse: jsonData
    });
  } catch (error) {
    console.error('Error testing backend connection:', error);

    // Properly handle the unknown error type
    const errorMessage = error instanceof Error
      ? error.message
      : 'Unknown error occurred';

    return res.status(500).json({
      success: false,
      message: 'Error connecting to backend',
      error: errorMessage
    });
  }
}