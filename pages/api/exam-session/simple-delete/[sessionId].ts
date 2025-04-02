import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'DELETE') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { sessionId } = req.query;
    if (!sessionId || Array.isArray(sessionId)) {
      return res.status(400).json({ success: false, message: 'Invalid session ID' });
    }

    // This is a simple endpoint that always returns success
    // It's useful for testing the frontend without relying on the backend
    console.log(`Simple delete endpoint called for session: ${sessionId}`);

    // Return a success response
    return res.status(200).json({
      success: true,
      message: "Exam session deleted successfully",
      sessionId: sessionId
    });
  } catch (error) {
    console.error('Error in simple-delete API route:', error);
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