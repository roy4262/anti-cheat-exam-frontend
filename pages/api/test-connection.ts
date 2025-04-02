// Next.js API route to test backend connection
// Access at /api/test-connection

import type { NextApiRequest, NextApiResponse } from 'next';
import { BASE_URL } from '../../constants';

type ResponseData = {
  success: boolean;
  message: string;
  backendUrl?: string;
  error?: any;
  data?: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  console.log('Testing backend connection to:', BASE_URL);
  
  try {
    // Test connection to backend hello endpoint
    const response = await fetch(`${BASE_URL}/hello`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Backend returned status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return res.status(200).json({
      success: true,
      message: 'Successfully connected to backend',
      backendUrl: BASE_URL,
      data,
    });
  } catch (error) {
    console.error('Error connecting to backend:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to connect to backend',
      backendUrl: BASE_URL,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}