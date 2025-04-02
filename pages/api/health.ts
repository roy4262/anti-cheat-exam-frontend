import { NextApiRequest, NextApiResponse } from 'next';
import { BASE_URL } from '../../constants';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    // Return basic health information
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      apiUrl: BASE_URL
    });
  } catch (error) {
    console.error('Health check error:', error);
    const errorMessage = error instanceof Error
      ? error.message
      : 'An unknown error occurred';

    res.status(500).json({
      status: 'error',
      message: errorMessage
    });
  }
}