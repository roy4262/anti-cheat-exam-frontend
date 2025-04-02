export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code?: string;
    message: string;
  };
}

export class ApiError extends Error {
  constructor(message: string, public status: number = 500, public code?: string) {
    super(message);
    this.name = 'ApiError';
  }
}