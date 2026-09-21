import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "./storage";

export type AccountRole = "patient" | "professional";

export type AppUser = Pick<User, "id" | "email" | "user_metadata">;

export async function getCurrentUser(): Promise<AppUser | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function signIn(email: string, password: string): Promise<AppUser> {
  if (!supabase) {
    return {
      id: crypto.randomUUID(),
      email,
      user_metadata: { account_type: "patient", demo: true },
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error("No user was returned after sign in.");
  return data.user;
}

export async function createAccount(
  email: string,
  password: string,
  role: AccountRole,
  fullName: string,
): Promise<{ user: AppUser | null; requiresEmailConfirmation: boolean }> {
  if (!supabase) {
    return {
      user: {
        id: crypto.randomUUID(),
        email,
        user_metadata: { account_type: role, full_name: fullName, demo: true },
      },
      requiresEmailConfirmation: false,
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { account_type: role, full_name: fullName } },
  });
  if (error) throw error;

  return {
    user: data.user,
    requiresEmailConfirmation: Boolean(data.user && !data.session),
  };
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export { isSupabaseConfigured };
