"use client";

import { signOutAction } from "@/actions/auth";
import { SignOutSubmitButton } from "@/components/layout/SignOutSubmitButton";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <SignOutSubmitButton />
    </form>
  );
}
