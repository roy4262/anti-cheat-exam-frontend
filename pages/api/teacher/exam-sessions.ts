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

    // Get query parameters
    const { status, page, limit } = req.query;
    
    // Build query string
    let queryString = '';
    if (status || page || limit) {
      queryString = '?';
      if (status) queryString += `status=${status}&`;
      if (page) queryString += `page=${page}&`;
      if (limit) queryString += `limit=${limit}&`;
      // Remove trailing & if present
      queryString = queryString.endsWith('&') 
        ? queryString.slice(0, -1) 
        : queryString;
    }

    console.log(`Proxying teacher exam sessions request to: ${BASE_URL}/teacher/exam-sessions${queryString}`);
    
    const backendResponse = await fetch(`${BASE_URL}/teacher/exam-sessions${queryString}`, {
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

      // Log the cheating data for debugging
      console.log('EXAM SESSIONS RESPONSE:');
      console.log(`- Success: ${jsonData.success}`);
      console.log(`- Number of sessions: ${jsonData.sessions ? jsonData.sessions.length : 0}`);

      if (jsonData.sessions && jsonData.sessions.length > 0) {
        jsonData.sessions.forEach((session, index) => {
          console.log(`\nSession ${index + 1}:`);
          console.log(`- ID: ${session._id}`);
          console.log(`- Status: ${session.status}`);
          console.log(`- Tab Switch Count: ${session.tabSwitchCount}`);
          console.log(`- Face Detection Violations: ${session.faceDetectionViolations}`);
          console.log(`- Face Detection Stats: ${session.faceDetectionStats ? 'Present' : 'Not present'}`);

          if (session.faceDetectionStats) {
            console.log(`  - Total Violations: ${session.faceDetectionStats.totalViolations}`);
            if (session.faceDetectionStats.violationTypes) {
              console.log(`  - Looking Left: ${session.faceDetectionStats.violationTypes.lookingLeft}`);
              console.log(`  - Looking Right: ${session.faceDetectionStats.violationTypes.lookingRight}`);
              console.log(`  - Face Not Detected: ${session.faceDetectionStats.violationTypes.faceNotDetected}`);
              console.log(`  - Multiple Faces: ${session.faceDetectionStats.violationTypes.multipleFaces}`);
            }
          }
        });
      }
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
    console.error('Error in teacher/exam-sessions API route:', error);
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