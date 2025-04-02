// File: /pages/api/auth/[...nextauth].ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string };

        try {
          console.log(`Authorizing user: ${email}`);

          // Use the environment variable for the backend URL
          const baseUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          console.log(`Using backend URL: ${baseUrl}`);

          const res = await fetch(`${baseUrl}/api/user/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify({ email, password }),
          });

          console.log(`Login response status: ${res.status}`);

          // Get the raw response text
          const textResponse = await res.text();
          console.log(`Response length: ${textResponse.length}`);

          if (textResponse.length === 0) {
            console.error('Empty response from backend');
            throw new Error("Empty response from server");
          }

          // Try to parse as JSON
          let response;
          try {
            response = JSON.parse(textResponse);
            console.log('Successfully parsed JSON response');
          } catch (parseError) {
            console.error('Failed to parse response as JSON:', parseError);
            console.error('Raw response:', textResponse.substring(0, 200));
            throw new Error("Invalid JSON response from server");
          }

          if (!res.ok) {
            const errorMessage = response?.error?.message || response?.message || "Invalid credentials";
            console.error(`Login failed: ${errorMessage}`);
            throw new Error(errorMessage);
          }

          // If user is authenticated
          if (response && response.success && response.data) {
            console.log('Login successful, user authenticated');
            // Add token to the user object so it can be used in the session
            const userData = response.data.user;
            userData.token = response.data.token;

            // Log the user data for debugging
            console.log('User data:', JSON.stringify(userData, null, 2));

            return userData; // Return the user data with token
          }

          console.error('Login failed: Invalid response format');
          return null; // Authentication failed
        } catch (error) {
          console.error("Error in authorize:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",   // Customize the login page route
    signOut: "/auth/logout",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = token.user;
      return session;
    },
  },
  secret: process.env.AUTH_SECRET || 'Lakshman4262', // Using the AUTH_SECRET from .env
});
