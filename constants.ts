// API URL configuration
// This function will determine the correct API URL to use
const getApiUrl = () => {
  // Check if we're in a browser or server environment
  const isServer = typeof window === 'undefined';

  // Get the API URL from environment variables
  const envApiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;

  // Default to localhost if no environment variable is set
  const defaultUrl = 'http://localhost:8000';

  // Use the environment variable or default
  let apiUrl = envApiUrl || defaultUrl;

  // Remove trailing slash if present
  if (apiUrl.endsWith('/')) {
    apiUrl = apiUrl.slice(0, -1);
  }

  // Make sure the URL ends with /api
  if (!apiUrl.endsWith('/api')) {
    apiUrl = apiUrl + '/api';
  }

  console.log(`Using API URL: ${apiUrl} (${isServer ? 'server' : 'client'})`);

  return apiUrl;
};

export const BASE_URL: string = getApiUrl();
// Make sure to set NEXT_PUBLIC_API_URL or BACKEND_URL in your .env file
// Default fallback is localhost:8000 to match the backend port