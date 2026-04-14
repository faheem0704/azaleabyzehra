import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
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
        // BUG-20: normalise email to lowercase so login is case-insensitive
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
        // BUG-20: normalise email to lowercase for consistent lookup
        const contact = isEmail ? rawContact.toLowerCase() : rawContact;

        // Find valid OTP record
        const otpRecord = await prisma.oTPRecord.findFirst({
          where: {
            contact,
            otp,
            used: false,
            expiresAt: { gt: new Date() },
          },
        });

        if (!otpRecord) return null;

        // Mark OTP as used
        await prisma.oTPRecord.update({
          where: { id: otpRecord.id },
          data: { used: true },
        });

        // Find existing user only (otp-credentials is for login, not signup)
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
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
