"use server";

import { AuthError } from "next-auth";
import { auth, signIn, signOut } from "@/auth";
import { logOrbitAction } from "@/lib/orbit-log";

export async function signInAction(_prev: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
    return { error: null as string | null };
  } catch (err) {
    if (err instanceof AuthError && err.type === "CredentialsSignin") {
      return { error: "Invalid credentials" };
    }
    throw err;
  }
}

export async function signOutAction() {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (Number.isFinite(userId)) {
    await logOrbitAction({
      action: "sign_out",
      resource: "auth",
      summary: `Signed out (${session?.user?.email ?? ""})`,
      actor: {
        id: userId,
        name: session?.user?.name ?? "",
        email: session?.user?.email ?? "",
        role: session?.user?.role ?? "",
      },
    });
  }
  await signOut({ redirectTo: "/login" });
}

