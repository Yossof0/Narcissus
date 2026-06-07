import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createClient } from "@supabase/supabase-js";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { sendPasswordResetEmail, sendConfirmEmail, sendPasswordChangeEmail, sendOrderNotificationEmail } from "./email";
import {
  upsertUserProfile, getUserProfile, getUserProfileByIdentifier,
  getOrdersByUser, resetProductRating, getAllProducts, getAllOrders,
  updateOrderStatus, updateUserPrivilege, setProductDiscount,
} from "../db";
import { OWNER, isOwner } from "../../shared/privileges";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => { server.close(() => resolve(true)); });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error("No available port found");
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerStorageProxy(app);

  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const SITE_URL = process.env.VITE_SITE_URL || "http://localhost:3000";

  // ── Email routes ──────────────────────────────────────────────
  app.post("/api/email/reset-password", async (req, res) => {
    const { email } = req.body;
    if (!email) { res.status(400).json({ error: "Email required" }); return; }
    try {
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({ type: "recovery", email, options: { redirectTo: `${SITE_URL}/reset-password` } });
      if (error) throw error;
      await sendPasswordResetEmail(email, data.properties.action_link);
      res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/email/confirm", async (req, res) => {
    const { email } = req.body;
    if (!email) { res.status(400).json({ error: "Email required" }); return; }
    try {
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({ type: "signup", email, options: { redirectTo: `${SITE_URL}/` } });
      if (error) throw error;
      await sendConfirmEmail(email, data.properties.action_link);
      res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/email/change-password", async (req, res) => {
    const { email } = req.body;
    if (!email) { res.status(400).json({ error: "Email required" }); return; }
    try {
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({ type: "recovery", email, options: { redirectTo: `${SITE_URL}/reset-password` } });
      if (error) throw error;
      await sendPasswordChangeEmail(email, data.properties.action_link);
      res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/email/order-notification", async (req, res) => {
    const { order } = req.body;
    if (!order) { res.status(400).json({ error: "Order data required" }); return; }
    try {
      await sendOrderNotificationEmail(order);
      res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ── Auth helpers ──────────────────────────────────────────────
  // Resolve username or phone to email for login
  app.get("/api/auth/resolve-identifier", async (req, res) => {
    const { identifier } = req.query;
    if (!identifier) { res.status(400).json({ error: "identifier required" }); return; }
    try {
      const profile = await getUserProfileByIdentifier(identifier as string);
      if (!profile) { res.status(404).json({ error: "Account not found" }); return; }
      res.json({ email: profile.email });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Profile ───────────────────────────────────────────────────
  app.get("/api/profile/get", async (req, res) => {
    const { supabaseId } = req.query;
    if (!supabaseId) { res.status(400).json({ error: "supabaseId required" }); return; }
    try {
      const profile = await getUserProfile(supabaseId as string);
      res.json(profile);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/profile/upsert", async (req, res) => {
    try {
      const profile = await upsertUserProfile(req.body);
      res.json(profile);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ── Owner REST endpoints ──────────────────────────────────────
  const ownerAuth = async (req: express.Request, res: express.Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) { res.status(401).json({ error: "Unauthorized" }); return false; }
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user || !isOwner(data.user.email)) {
      res.status(403).json({ error: "Owner access only" }); return false;
    }
    return true;
  };

  app.post("/api/owner/reset-rating", async (req, res) => {
    if (!await ownerAuth(req, res)) return;
    const { productId } = req.body;
    try {
      await resetProductRating(productId);
      res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/owner/order-history", async (req, res) => {
    if (!await ownerAuth(req, res)) return;
    const identifier = req.query.identifier as string;
    try {
      const profile = await getUserProfileByIdentifier(identifier);
      if (!profile) { res.json({ orders: [] }); return; }
      const orders = await getOrdersByUser(profile.supabaseId);
      res.json({ orders });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/owner/create-account", async (req, res) => {
    if (!await ownerAuth(req, res)) return;
    const { email, password } = req.body;
    try {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true });
      if (error) throw error;
      res.json({ success: true, userId: data.user.id });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/owner/list-products", async (req, res) => {
    if (!await ownerAuth(req, res)) return;
    try {
      const prods = await getAllProducts();
      res.json({ products: prods });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/owner/list-orders", async (req, res) => {
    if (!await ownerAuth(req, res)) return;
    try {
      const orderList = await getAllOrders();
      res.json({ orders: orderList });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/owner/update-order", async (req, res) => {
    if (!await ownerAuth(req, res)) return;
    const { id, status } = req.body;
    try {
      await updateOrderStatus(id, status);
      res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/owner/set-privilege", async (req, res) => {
    if (!await ownerAuth(req, res)) return;
    const { identifier, privilege } = req.body;
    try {
      const profile = await getUserProfileByIdentifier(identifier);
      if (!profile) throw new Error("User not found");
      await updateUserPrivilege(profile.supabaseId, privilege);
      res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/owner/set-discount", async (req, res) => {
    if (!await ownerAuth(req, res)) return;
    const { id, type, value } = req.body;
    try {
      await setProductDiscount(id, type, value);
      res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/owner/remove-account", async (req, res) => {
    if (!await ownerAuth(req, res)) return;
    const { identifier } = req.body;
    try {
      const profile = await getUserProfileByIdentifier(identifier);
      if (!profile) throw new Error("User not found");
      const { error } = await supabaseAdmin.auth.admin.deleteUser(profile.supabaseId);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ─────────────────────────────────────────────────────────────
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      allowMethodOverride: true,
    }),
  );

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) console.log(`Port ${preferredPort} busy, using ${port}`);
  server.listen(port, () => console.log(`Server running on http://localhost:${port}/`));
}

startServer().catch(console.error);