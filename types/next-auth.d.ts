import NextAuth, { DefaultSession, User as DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare global {}

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    studentId?: string;
    teacherId?: string;
    token: string;
  }

  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session extends DefaultSession {
    user: User;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** OpenID ID Token */
    idToken?: string;
    user: {
      id: string;
      email: string;
      role: string;
      firstName: string;
      lastName: string;
      studentId?: string;
      teacherId?: string;
      token: string;
    };
  }
}
