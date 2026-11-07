import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { compare } from "bcryptjs";
import { queryOne } from "@/lib/db";
import { logOrbitAction } from "@/lib/orbit-log";
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
           WHERE email = $1
             AND is_active = TRUE
             AND employment_status <> 'deactivated'`,
          [email]
        );
        if (!user) return null;

        const ok = await compare(password, user.password_hash);
        if (!ok) return null;

        await logOrbitAction({
          action: "sign_in",
          resource: "auth",
          summary: `Signed in (${user.email})`,
          actor: {
            id: user.id,
            name: user.full_name,
            email: user.email,
            role: user.role,
          },
        });

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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: Role }).role;
        return token;
      }

      // Keep role in sync with temp_users so HOO/admin permissions stay current.
      const userId = Number(token.id);
      if (Number.isFinite(userId)) {
        let row: { role: Role } | null;
        try {
          row = await queryOne<{ role: Role }>(
            `SELECT role FROM temp_users
              WHERE id = $1
                AND is_active = TRUE
                AND employment_status <> 'deactivated'`,
            [userId]
          );
        } catch {
          // Keep the existing token role if the DB is briefly unavailable.
          return token;
        }
        // Deactivated or deleted: end the session now instead of when it expires.
        if (!row) return null;
        token.role = row.role;
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

