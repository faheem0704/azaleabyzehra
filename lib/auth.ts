import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      id: "password-credentials",
      name: "Password",
      credentials: {
        contact: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.contact || !credentials?.password) return null;

        const rawContact = (credentials.contact as string).trim();
        const password = credentials.password as string;
        const isEmail = rawContact.includes("@");
        const contact = isEmail ? rawContact.toLowerCase() : rawContact;

        const user = await prisma.user.findFirst({
          where: isEmail ? { email: contact } : { phone: contact },
        });
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
    CredentialsProvider({
      id: "otp-credentials",
      name: "OTP",
      credentials: {
        contact: { label: "Email or Phone", type: "text" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.contact || !credentials?.otp) return null;

        const rawContact = (credentials.contact as string).trim();
        const otp = credentials.otp as string;
        const isEmail = rawContact.includes("@");
        const contact = isEmail ? rawContact.toLowerCase() : rawContact;

        const otpRecord = await prisma.oTPRecord.findFirst({
          where: {
            contact,
            otp,
            used: false,
            expiresAt: { gt: new Date() },
          },
        });

        if (!otpRecord) return null;

        await prisma.oTPRecord.update({
          where: { id: otpRecord.id },
          data: { used: true },
        });

        const user = await prisma.user.findFirst({
          where: isEmail ? { email: contact } : { phone: contact },
        });

        if (!user) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    // Fires on every sign-in attempt. For Google: find or create the user in our DB.
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        const email = profile?.email;
        if (!email) return false;

        const existing = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!existing) {
          await prisma.user.create({
            data: {
              name: (profile?.name as string | undefined) ?? "Google User",
              email: email.toLowerCase(),
              role: "CUSTOMER",
            },
          });
        }
        return true;
      }
      return true;
    },

    // Fires once on sign-in (user present) then on every request (user absent).
    // For Google: look up our DB id + role via email since Google gives its own user id.
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "google") {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email! },
            select: { id: true, role: true },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
          }
        } else {
          token.id = user.id;
          token.role = (user as { role?: string }).role;
        }
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
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
});
