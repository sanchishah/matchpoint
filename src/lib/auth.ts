import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendLoginEmail } from "@/lib/login-email";
import { sendWelcomeEmail } from "@/lib/welcome-email";
import { ADMIN_EMAILS } from "@/lib/constants";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  events: {
    async signIn({ user, account }) {
      if (user.id) {
        // Auto-verify email for OAuth providers (e.g. Google) since they
        // only return verified emails. Without this, OAuth users get blocked
        // from joining games with "Please verify your email".
        if (account?.provider && account.provider !== "credentials") {
          await prisma.user.updateMany({
            where: { id: user.id, emailVerified: null },
            data: { emailVerified: new Date() },
          });
        }
        // Fire-and-forget — never block the login flow.
        sendLoginEmail(user.id).catch(() => {});
      }
    },
    async createUser({ user }) {
      if (user.id) {
        // OAuth signups go through PrismaAdapter which triggers this event.
        // Credentials signups already call sendWelcomeEmail in the signup route,
        // but the idempotency guard in sendWelcomeEmail prevents duplicates.
        sendWelcomeEmail(user.id).catch(() => {});
      }
    },
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id!;
        // For OAuth users, check DB for role since it's not on the user object
        const role = (user as { role?: string }).role;
        if (role) {
          token.role = role;
        } else {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id! },
            select: { role: true },
          });
          token.role = dbUser?.role || "USER";
        }
      }
      // Set admin role for admin emails on first OAuth sign-in
      if (trigger === "signIn" && token.email && ADMIN_EMAILS.includes(token.email)) {
        await prisma.user.updateMany({
          where: { email: token.email, role: "USER" },
          data: { role: "ADMIN" },
        });
        token.role = "ADMIN";
      }
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
