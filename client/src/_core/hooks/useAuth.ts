import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

// Cache user in memory to avoid flicker
let cachedUser: User | null = null;

export function useAuth() {
  const [user, setUser] = useState<User | null>(cachedUser);
  const [loading, setLoading] = useState(!cachedUser);

  useEffect(() => {
    // Get session immediately (uses localStorage cache)
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      cachedUser = u;
      setUser(u);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      cachedUser = u;
      setUser(u);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    cachedUser = null;
    setUser(null);
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    logout,
  };
}