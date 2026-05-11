"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

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
  await signOut({ redirectTo: "/login" });
}

