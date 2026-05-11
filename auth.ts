import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { compare } from "bcryptjs";
import { queryOne } from "@/lib/db";
import type { Role } from "@/types/db";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type DbUserAuthRow = {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  role: Role;
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await queryOne<DbUserAuthRow>(
          `SELECT id, full_name, email, password_hash, role
           FROM temp_users
           WHERE email = $1 AND is_active = TRUE`,
          [email]
        );
        if (!user) return null;

        const ok = await compare(password, user.password_hash);
        if (!ok) return null;

        return {
          id: String(user.id),
          email: user.email,
          name: user.full_name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: Role }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
});

