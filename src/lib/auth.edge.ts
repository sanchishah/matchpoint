/**
 * Lightweight NextAuth config for Edge middleware.
 *
 * This mirrors the main auth.ts config but WITHOUT the PrismaAdapter
 * and database-dependent code, since Prisma cannot run in Edge runtime.
 * Only used for JWT verification in middleware — all actual auth
 * operations (sign-in, sign-up, callbacks) go through auth.ts.
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { auth: authMiddleware } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    // Providers must be listed so NextAuth recognizes the session token,
    // but authorize is never called from middleware — only JWT decoding.
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize() {
        return null; // Never called from middleware
      },
    }),
  ],
  callbacks: {
    async jwt({ token }) {
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
});
