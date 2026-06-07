import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { supabase } from "./supabase";
import type { AppRouter } from "../../../server/routers";

export const trpc = createTRPCReact<AppRouter>();

// Track current session in memory for quick access without network calls
let cachedToken: string | null = null;

// Set up listener to update cached token when auth state changes
if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event, session) => {
    cachedToken = session?.access_token || null;
  });
}

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      methodOverride: "POST",
      headers() {
        return cachedToken ? { Authorization: `Bearer ${cachedToken}` } : {};
      },
    }),
  ],
});
