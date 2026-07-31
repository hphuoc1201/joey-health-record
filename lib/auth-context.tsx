"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { SupabaseClient, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface AuthState {
  supabase: SupabaseClient;
  session: Session | null;
  email: string;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load(current: Session | null) {
      if (!current) {
        if (active) {
          setSession(null);
          setIsAdmin(false);
          setLoading(false);
        }
        router.replace("/login");
        return;
      }
      const email = (current.user.email ?? "").toLowerCase();
      // RLS lets a user read only their own admins row.
      const { data } = await supabase
        .from("admins")
        .select("email")
        .eq("email", email)
        .maybeSingle();
      if (!active) return;
      setSession(current);
      setIsAdmin(Boolean(data));
      setLoading(false);
    }

    supabase.auth.getSession().then(({ data }) => load(data.session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      load(next);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const value = useMemo<AuthState>(
    () => ({
      supabase,
      session,
      email: (session?.user.email ?? "").toLowerCase(),
      isAdmin,
      loading,
    }),
    [supabase, session, isAdmin, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
