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

export async function requestMagicLink(
  email: string,
  role: AccountRole,
  fullName: string,
): Promise<AppUser | null> {
  if (!supabase) {
    return {
      id: crypto.randomUUID(),
      email,
      user_metadata: { account_type: role, full_name: fullName, demo: true },
    };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${window.location.origin}/#account`,
      data: { account_type: role, full_name: fullName || undefined },
    },
  });
  if (error) throw error;
  return null;
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function onAuthChange(callback: (user: AppUser | null) => void): () => void {
  if (!supabase) return () => undefined;
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => data.subscription.unsubscribe();
}

export { isSupabaseConfigured };
