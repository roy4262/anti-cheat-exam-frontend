import { ApiError } from '../../models/api-response';

export const handleApiResponse = async <T>(response: Response): Promise<T> => {
  let data;
  try {
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Invalid response format: Server returned non-JSON response');
    }
    data = await response.json();
  } catch (parseError) {
    throw new Error('Invalid response format: Unable to parse server response');
  }

  if (!response.ok || !data.success) {
    const errorMessage = data.error?.message || 'An unexpected error occurred';
    const errorCode = data.error?.code || response.status.toString();
    throw new ApiError(errorMessage, response.status || 500, errorCode);
  }

  if (!data.data) {
    throw new ApiError('Invalid response format: missing data', 500);
  }

  return data.data;
};

export const createApiRequest = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  try {
    const defaultHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    return await handleApiResponse<T>(response);
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message || 'Failed to make API request', 500);
  }
};