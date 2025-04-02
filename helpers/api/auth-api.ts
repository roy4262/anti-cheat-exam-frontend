import { AuthResponse, LoginCredentials, SignupCredentials } from "../../models/auth-models";
import { ApiResponse, ApiError } from "../../models/api-response";
import { BASE_URL } from "../../constants";

const handleApiError = (error: unknown, defaultMessage: string): never => {
  if (error instanceof ApiError) {
    throw error;
  }
  if (error instanceof Error) {
    throw new ApiError(error.message, 500);
  }
  throw new ApiError(defaultMessage, 500);
};

export const signupUser = async (credentials: SignupCredentials): Promise<AuthResponse> => {
  try {
    // Use the backend URL directly for server-side calls
    // We need to use an absolute URL for server-side rendering
    const isServer = typeof window === 'undefined';
    const apiUrl = isServer
      ? `${BASE_URL}/user/signup`
      : `/api/auth/signup`;

    console.log(`Using API URL for signup: ${apiUrl} (${isServer ? 'server' : 'client'})`);

    const res = await fetch(apiUrl, {
      method: "POST",
      body: JSON.stringify(credentials),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    let data: ApiResponse<AuthResponse>;
    try {
      data = await res.json();
    } catch (parseError) {
      console.error('Failed to parse response:', parseError);
      throw new Error("Invalid response format from server");
    }

    if (!res.ok || !data.success) {
      const errorMessage = data.error?.message || "Failed to signup user!";
      const errorCode = data.error?.code || res.status.toString();
      throw new ApiError(errorMessage, res.status || 500, errorCode);
    }

    if (!data.data) {
      throw new ApiError("Invalid response format: missing data", 500);
    }

    return data.data;
  } catch (e: any) {
    console.error('Signup error:', e);
    if (e instanceof ApiError) {
      throw e;
    }
    throw new ApiError(e.message || "Failed to signup user!", 500);
  }
};

export const loginUser = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    // Use the backend URL directly for server-side calls
    // We need to use an absolute URL for server-side rendering
    const isServer = typeof window === 'undefined';
    const apiUrl = isServer
      ? `${BASE_URL}/user/login`
      : `/api/auth/login`;

    console.log(`Using API URL for login: ${apiUrl} (${isServer ? 'server' : 'client'})`);

    const res = await fetch(apiUrl, {
      method: "POST",
      body: JSON.stringify(credentials),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    let data: ApiResponse<AuthResponse>;
    try {
      data = await res.json();
    } catch (parseError) {
      console.error('Failed to parse response:', parseError);
      throw new Error("Invalid response format from server");
    }

    if (!res.ok || !data.success) {
      const errorMessage = data.error?.message || "Failed to login user!";
      const errorCode = data.error?.code || res.status.toString();
      throw new ApiError(errorMessage, res.status || 500, errorCode);
    }

    if (!data.data) {
      throw new ApiError("Invalid response format: missing data", 500);
    }

    return data.data;
  } catch (e: any) {
    console.error('Login error:', e);
    if (e instanceof ApiError) {
      throw e;
    }
    throw new ApiError(e.message || "Failed to login user!", 500);
  }
};

export const getUserProfile = async (token: string): Promise<AuthResponse> => {
  try {
    const res = await fetch(`${BASE_URL}/user/profile`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    let data: ApiResponse<AuthResponse>;
    try {
      data = await res.json();
    } catch (parseError) {
      throw new Error("Invalid response format from server");
    }

    if (!res.ok || !data.success) {
      const errorMessage = data.error?.message || "Failed to fetch user profile!";
      const errorCode = data.error?.code || res.status.toString();
      throw new ApiError(errorMessage, res.status || 500, errorCode);
    }

    if (!data.data) {
      throw new ApiError("Invalid response format: missing data", 500);
    }

    return data.data;
  } catch (e: any) {
    if (e instanceof ApiError) {
      throw e;
    }
    throw new ApiError(e.message || "Failed to fetch user profile!", 500);
  }
};