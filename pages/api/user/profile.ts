import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { BASE_URL } from '../../../constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Get the session
    const session = await getSession({ req });
    
    if (!session || !session.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    
    // Get the token from the session
    const token = session.user.token;
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token found in session' });
    }
    
    console.log(`Fetching profile for user: ${session.user.email}`);
    
    // Forward the request to the backend
    const response = await fetch(`${BASE_URL}/user/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Get the response as text first for debugging
    const textResponse = await response.text();
    console.log('Backend response length:', textResponse.length);
    
    // Try to parse the response as JSON
    let data;
    try {
      data = JSON.parse(textResponse);
      console.log('Response parsed successfully');
    } catch (error) {
      console.error('Error parsing response:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Invalid response from server',
        rawResponse: textResponse.substring(0, 500) // Only include first 500 chars for safety
      });
    }
    
    if (!response.ok) {
      console.error('Error from backend:', data);
      return res.status(response.status).json(data);
    }
    
    return res.status(200).json({
      success: true,
      data: data.data || data
    });
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
}