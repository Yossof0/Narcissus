import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { OWNER, isOwner } from "@shared/privileges";
import { supabase } from "@/lib/supabase";
import { Loader2, Terminal, LayoutDashboard, LogOut, ShoppingBag, Shield, ChevronDown } from "lucide-react";
import { toast } from "sonner";

const STATUS_OPTIONS = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};
const PRIVILEGE_COLORS: Record<string, string> = {
  owner: "bg-amber-100 text-amber-800",
  admin: "bg-blue-100 text-blue-800",
  user: "bg-gray-100 text-gray-600",
};

type Tab = "dashboard" | "terminal";

// ── Terminal ──────────────────────────────────────────────────────
interface TerminalLine {
  type: "input" | "output" | "error" | "success";
  text: string;
}

function TerminalPanel() {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: "output", text: "Narcissus OS v1.0.0 — Owner Terminal" },
    { type: "output", text: 'Type "help" to see available commands.' },
    { type: "output", text: "" },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const updateStatus = trpc.orders.updateStatus.useMutation();
  const { data: allUsers = [] } = trpc.owner.allUsers.useQuery();

  const ownerFetch = async (url: string, options: RequestInit = {}) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const print = (text: string, type: TerminalLine["type"] = "output") => {
    setLines(prev => [...prev, { type, text }]);
  };

  const handleCommand = async (raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;
    print(`> ${cmd}`, "input");
    setHistory(h => [cmd, ...h]);
    setHistIdx(-1);

    const parts = cmd.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
    const clean = parts.map(p => p.replace(/^"|"$/g, ""));
    const command = clean[0]?.toLowerCase();

    if (command === "help") {
      print("═══════════════════════════════════════");
      print("  NARCISSUS TERMINAL — Available Commands");
      print("═══════════════════════════════════════");
      print("  ACCOUNTS:");
      print("    list-users                        — List all accounts");
      print("    create-account <email> <password> — Create new account");
      print("    remove-account <identifier>       — Delete account");
      print("    make-admin <identifier>            — Promote to admin");
      print("    remove-admin <identifier>          — Demote to user");
      print("  PRODUCTS:");
      print("    list-products                     — List all products with IDs");
      print("    reset-rating <product-id>         — Reset product rating");
      print("    set-discount <id> <percent|cash> <value> — Set product discount");
      print("    remove-discount <id>              — Remove product discount");
      print("  ORDERS:");
      print("    order-history <identifier>        — View user order history");
      print("    list-orders                       — List all orders");
      print("    update-order <id> <status>        — Update order status");
      print("  SYSTEM:");
      print("    clear                             — Clear terminal");
      print("    whoami                            — Show current session info");
      print("═══════════════════════════════════════");
      return;
    }

    if (command === "clear") {
      setLines([{ type: "output", text: "Terminal cleared." }]);
      return;
    }

    if (command === "whoami") {
      const { data } = await supabase.auth.getSession();
      print(`Email: ${data.session?.user?.email}`);
      print(`Role: owner`);
      print(`Session expires: ${data.session?.expires_at ? new Date(data.session.expires_at * 1000).toLocaleString() : "N/A"}`);
      return;
    }

    if (command === "list-users") {
      if (!allUsers.length) { print("No users found."); return; }
      print(`${"PRIVILEGE".padEnd(10)} ${"EMAIL".padEnd(35)} USERNAME`);
      print("─".repeat(65));
      allUsers.forEach((u: any) => print(`${u.privilege.padEnd(10)} ${u.email.padEnd(35)} @${u.username || "?"}`));
      return;
    }

    if (command === "list-products") {
      try {
        const res = await ownerFetch("/api/owner/list-products");
        const data = await res.json();
        if (!data.products?.length) { print("No products found."); return; }
        print(`${"ID".padEnd(6)} ${"PRICE".padEnd(12)} NAME`);
        print("─".repeat(50));
        data.products.forEach((p: any) => print(`#${String(p.id).padEnd(5)} EGP ${(p.price/100).toFixed(2).padEnd(8)} ${p.name}`));
      } catch { print("Failed to fetch products.", "error"); }
      return;
    }

    if (command === "list-orders") {
      try {
        const res = await ownerFetch("/api/owner/list-orders");
        const data = await res.json();
        if (!data.orders?.length) { print("No orders found."); return; }
        print(`${"ID".padEnd(6)} ${"STATUS".padEnd(12)} ${"TOTAL".padEnd(12)} CUSTOMER`);
        print("─".repeat(55));
        data.orders.forEach((o: any) => print(`#${String(o.id).padEnd(5)} ${o.status.padEnd(12)} EGP ${(o.totalPrice/100).toFixed(2).padEnd(8)} ${o.customerName}`));
      } catch { print("Failed to fetch orders.", "error"); }
      return;
    }

    if (command === "update-order") {
      const [, orderId, status] = clean;
      const validStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
      if (!orderId || !status) { print("Usage: update-order <id> <pending|confirmed|shipped|delivered|cancelled>", "error"); return; }
      if (!validStatuses.includes(status)) { print(`Invalid status. Use: ${validStatuses.join(", ")}`, "error"); return; }
      try {
        const res = await ownerFetch("/api/owner/update-order", {
          method: "POST",
          body: JSON.stringify({ id: parseInt(orderId), status }),
        });
        if (!res.ok) throw new Error();
        print(`Order #${orderId} → ${status}`, "success");
      } catch { print("Failed to update order.", "error"); }
      return;
    }

    if (command === "make-admin") {
      const identifier = clean[1];
      if (!identifier) { print("Usage: make-admin <identifier>", "error"); return; }
      try {
        const res = await ownerFetch("/api/owner/set-privilege", {
          method: "POST",
          body: JSON.stringify({ identifier, privilege: "admin" }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        print(`${identifier} is now an admin.`, "success");
        utils.owner.allUsers.invalidate();
      } catch (e: any) { print(`Error: ${e.message}`, "error"); }
      return;
    }

    if (command === "remove-admin") {
      const identifier = clean[1];
      if (!identifier) { print("Usage: remove-admin <identifier>", "error"); return; }
      try {
        const res = await ownerFetch("/api/owner/set-privilege", {
          method: "POST",
          body: JSON.stringify({ identifier, privilege: "user" }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        print(`${identifier} is now a regular user.`, "success");
        utils.owner.allUsers.invalidate();
      } catch (e: any) { print(`Error: ${e.message}`, "error"); }
      return;
    }

    if (command === "set-discount") {
      const [, productId, type, value] = clean;
      if (!productId || !type || !value) { print("Usage: set-discount <product-id> <percent|cash> <value>", "error"); return; }
      if (!["percent", "cash"].includes(type)) { print("Type must be 'percent' or 'cash'", "error"); return; }
      try {
        const res = await ownerFetch("/api/owner/set-discount", {
          method: "POST",
          body: JSON.stringify({ id: parseInt(productId), type, value: parseFloat(value) }),
        });
        if (!res.ok) throw new Error();
        print(`Discount set on product #${productId}: ${value}${type === "percent" ? "%" : " EGP"} off`, "success");
        utils.products.list.invalidate();
      } catch { print("Failed to set discount.", "error"); }
      return;
    }

    if (command === "remove-discount") {
      const productId = parseInt(clean[1]);
      if (isNaN(productId)) { print("Usage: remove-discount <product-id>", "error"); return; }
      try {
        const res = await ownerFetch("/api/owner/set-discount", {
          method: "POST",
          body: JSON.stringify({ id: productId, type: null, value: null }),
        });
        if (!res.ok) throw new Error();
        print(`Discount removed from product #${productId}`, "success");
        utils.products.list.invalidate();
      } catch { print("Failed to remove discount.", "error"); }
      return;
    }

    if (command === "reset-rating") {
      const productId = parseInt(clean[1]);
      if (isNaN(productId)) { print("Usage: reset-rating <product-id>", "error"); return; }
      try {
        await ownerFetch("/api/owner/reset-rating", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        utils.products.list.invalidate();
        utils.products.getById.invalidate({ id: productId });
        print(`Rating for product #${productId} has been reset.`, "success");
      } catch { print("Failed to reset rating.", "error"); }
      return;
    }

    if (command === "order-history") {
      const identifier = clean[1];
      if (!identifier) { print("Usage: order-history <identifier>", "error"); return; }
      try {
        const res = await ownerFetch(`/api/owner/order-history?identifier=${encodeURIComponent(identifier)}`);
        const data = await res.json();
        if (!data.orders?.length) { print(`No orders found for "${identifier}".`); return; }
        data.orders.forEach((o: any) => {
          print(`Order #${o.id} — ${o.status} — EGP ${(o.totalPrice / 100).toFixed(2)} — ${new Date(o.createdAt).toLocaleDateString()}`);
        });
      } catch { print("Failed to fetch order history.", "error"); }
      return;
    }

    if (command === "create-account") {
      const [, identifier, password] = clean;
      if (!identifier || !password) { print("Usage: create-account <email> <password>", "error"); return; }
      try {
        const res = await ownerFetch("/api/owner/create-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: identifier, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        print(`Account created: ${identifier}`, "success");
        utils.owner.allUsers.invalidate();
      } catch (e: any) { print(`Error: ${e.message}`, "error"); }
      return;
    }

    if (command === "remove-account") {
      const identifier = clean[1];
      if (!identifier) { print("Usage: remove-account <identifier>", "error"); return; }
      try {
        const res = await ownerFetch("/api/owner/remove-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        print(`Account removed: ${identifier}`, "success");
        utils.owner.allUsers.invalidate();
      } catch (e: any) { print(`Error: ${e.message}`, "error"); }
      return;
    }

    print(`Command not found: "${command}". Type "help".`, "error");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleCommand(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      const idx = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(idx);
      setInput(history[idx] ?? "");
    } else if (e.key === "ArrowDown") {
      const idx = Math.max(histIdx - 1, -1);
      setHistIdx(idx);
      setInput(idx === -1 ? "" : history[idx] ?? "");
    }
  };

  return (
    <div
      className="bg-black rounded-lg overflow-hidden font-mono text-sm h-[600px] flex flex-col cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border-b border-zinc-700">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
        <span className="ml-2 text-zinc-400 text-xs">narcissus-terminal</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {lines.map((line, i) => (
          <div key={i} className={
            line.type === "input" ? "text-white" :
              line.type === "error" ? "text-red-400" :
                line.type === "success" ? "text-green-400" :
                  "text-green-500"
          }>
            {line.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-center px-4 py-2 border-t border-zinc-800">
        <span className="text-green-500 mr-2">owner@narcissus:~$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          className="flex-1 bg-transparent text-white outline-none caret-green-400"
          autoFocus
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────
function DashboardPanel() {
  const { data: allUsers = [], refetch } = trpc.owner.allUsers.useQuery();
  const updatePrivilege = trpc.owner.updatePrivilege.useMutation();
  const updateStatus = trpc.orders.updateStatus.useMutation();
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"privilege" | "date">("privilege");
  const [, navigate] = useLocation();

  const sorted = [...allUsers].sort((a: any, b: any) => {
    if (sortBy === "privilege") {
      const order = { owner: 0, admin: 1, user: 2 };
      return (order[a.privilege as keyof typeof order] ?? 3) - (order[b.privilege as keyof typeof order] ?? 3);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handlePrivilege = async (supabaseId: string, privilege: "user" | "admin") => {
    try {
      await updatePrivilege.mutateAsync({ supabaseId, privilege });
      toast.success("Privilege updated.");
      refetch();
    } catch { toast.error("Failed to update privilege."); }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <p className="text-3xl font-light text-foreground">{allUsers.length}</p>
          <p className="text-sm text-muted-foreground mt-1">Total Users</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <p className="text-3xl font-light text-foreground">{allUsers.filter((u: any) => u.privilege === "admin").length}</p>
          <p className="text-sm text-muted-foreground mt-1">Admins</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <p className="text-3xl font-light text-foreground">{allUsers.filter((u: any) => u.privilege === "user").length}</p>
          <p className="text-sm text-muted-foreground mt-1">Regular Users</p>
        </div>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Sort by:</span>
        <button onClick={() => setSortBy("privilege")} className={`text-sm px-3 py-1.5 rounded transition-colors ${sortBy === "privilege" ? "bg-foreground text-background" : "hover:bg-muted text-muted-foreground"}`}>Privilege</button>
        <button onClick={() => setSortBy("date")} className={`text-sm px-3 py-1.5 rounded transition-colors ${sortBy === "date" ? "bg-foreground text-background" : "hover:bg-muted text-muted-foreground"}`}>Join Date</button>
      </div>

      {/* Users List */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-border bg-muted/30">
          <tr>
            <th className="text-left px-6 py-4 text-xs font-light tracking-wide text-muted-foreground">USER</th>
            <th className="text-left px-6 py-4 text-xs font-light tracking-wide text-muted-foreground hidden md:table-cell">CONTACT</th>
            <th className="text-left px-6 py-4 text-xs font-light tracking-wide text-muted-foreground">PRIVILEGE</th>
            <th className="text-right px-6 py-4 text-xs font-light tracking-wide text-muted-foreground">ACTIONS</th>
          </tr>
          </thead>
          <tbody className="divide-y divide-border">
          {sorted.map((user: any) => (
            <>
              <tr key={user.supabaseId} className="hover:bg-muted/10 transition-colors cursor-pointer" onClick={() => setExpandedUser(expandedUser === user.supabaseId ? null : user.supabaseId)}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-light shrink-0">
                      {user.email?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-light text-foreground">{user.fullName || user.username || "—"}</p>
                      <p className="text-xs text-muted-foreground">@{user.username || "?"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">{user.phone || "No phone"}</p>
                </td>
                <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-light capitalize ${PRIVILEGE_COLORS[user.privilege] || "bg-gray-100"}`}>
                      {user.privilege}
                    </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                    {user.privilege !== "owner" && (
                      user.privilege === "admin" ? (
                        <Button size="sm" variant="outline" className="text-xs h-7"
                                onClick={() => handlePrivilege(user.supabaseId, "user")}>
                          Remove Admin
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="text-xs h-7"
                                onClick={() => handlePrivilege(user.supabaseId, "admin")}>
                          Make Admin
                        </Button>
                      )
                    )}
                  </div>
                </td>
              </tr>
              {expandedUser === user.supabaseId && (
                <tr key={`${user.supabaseId}-expanded`}>
                  <td colSpan={4} className="px-6 py-4 bg-muted/10 border-b border-border">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div><p className="text-xs text-muted-foreground">Email</p><p>{user.email}</p></div>
                      <div><p className="text-xs text-muted-foreground">Phone</p><p>{user.phone || "—"}</p></div>
                      <div><p className="text-xs text-muted-foreground">Birthday</p><p>{user.birthday || "—"}</p></div>
                      <div><p className="text-xs text-muted-foreground">Joined</p><p>{new Date(user.createdAt).toLocaleDateString()}</p></div>
                      <div className="col-span-2"><p className="text-xs text-muted-foreground">Address</p><p>{user.address || "—"}</p></div>
                    </div>
                    {/* Order History */}
                    {user.orders?.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2 tracking-wide">ORDER HISTORY</p>
                        <div className="space-y-2">
                          {user.orders.map((o: any) => (
                            <div key={o.id} className="flex items-center justify-between bg-card rounded p-3">
                              <div>
                                <span className="text-sm">Order #{o.id}</span>
                                <span className="text-xs text-muted-foreground ml-2">{new Date(o.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm">EGP {(o.totalPrice / 100).toFixed(2)}</span>
                                <div className="relative">
                                  <select value={o.status}
                                          onChange={async (e) => {
                                            await updateStatus.mutateAsync({ id: o.id, status: e.target.value as any });
                                            toast.success(`Order #${o.id} → ${e.target.value}`);
                                            refetch();
                                          }}
                                          className={`appearance-none pl-2 pr-6 py-1 rounded-full text-xs border-0 cursor-pointer focus:outline-none ${STATUS_COLORS[o.status]}`}>
                                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                  <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Owner Panel ───────────────────────────────────────────────────
export default function OwnerPanel() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );

  if (!isAuthenticated || !isOwner(user?.email)) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Shield className="w-12 h-12 text-muted-foreground opacity-30" />
      <p className="text-muted-foreground">Owner access only.</p>
      <Button variant="outline" onClick={() => navigate("/")}>Back to Store</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-20">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-amber-500" />
            <span className="text-lg font-light tracking-wider">NARCISSUS OWNER</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:block">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>Admin Panel</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ShoppingBag className="w-4 h-4 mr-2" />Store
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} className="text-destructive hover:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Tabs */}
        <div className="flex border-b border-border mb-8 gap-8">
          <button onClick={() => setActiveTab("dashboard")}
                  className={`pb-3 text-sm font-light tracking-wide transition-colors border-b-2 -mb-px flex items-center gap-2 ${activeTab === "dashboard" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <LayoutDashboard className="w-4 h-4" />DASHBOARD
          </button>
          <button onClick={() => setActiveTab("terminal")}
                  className={`pb-3 text-sm font-light tracking-wide transition-colors border-b-2 -mb-px flex items-center gap-2 ${activeTab === "terminal" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <Terminal className="w-4 h-4" />TERMINAL
          </button>
        </div>

        {activeTab === "dashboard" && <DashboardPanel />}
        {activeTab === "terminal" && <TerminalPanel />}
      </div>
    </div>
  );
}