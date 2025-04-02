export interface User {
  id: string;
  email: string;
  role: 'student' | 'teacher';
  firstName: string;
  lastName: string;
  studentId?: string;
  teacherId?: string;
  token: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: 'student' | 'teacher';
    firstName: string;
    lastName: string;
    studentId?: string;
    teacherId?: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  role: 'student' | 'teacher';
  firstName: string;
  lastName: string;
  studentId?: string;
  teacherId?: string;
}