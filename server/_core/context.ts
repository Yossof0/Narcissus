import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { createClient } from "@supabase/supabase-js";
import { isAdmin, isOwner, getPrivilege } from "../../shared/privileges";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: { id: string; email: string; role: string; privilege: string } | null;
};

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin && process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });
  }
  return supabaseAdmin;
}

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: TrpcContext["user"] = null;
  try {
    const token = opts.req.headers.authorization?.replace("Bearer ", "");
    if (!token) return { req: opts.req, res: opts.res, user: null };
    const admin = getSupabaseAdmin();
    if (!admin) return { req: opts.req, res: opts.res, user: null };
    const { data, error } = await Promise.race([
      admin.auth.getUser(token),
      new Promise<{ data: { user: null }; error: Error }>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 5000)
      ),
    ]) as any;
    if (!error && data.user) {
      const email = data.user.email ?? "";
      user = {
        id: data.user.id,
        email,
        role: isAdmin(email) ? "admin" : "user",
        privilege: getPrivilege(email),
      };
    }
  } catch { user = null; }
  return { req: opts.req, res: opts.res, user };
}