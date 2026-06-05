import { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff, Lock, AtSign } from "lucide-react";
import { toast } from "sonner";

type ConfirmMethod = "email" | "phone" | null;

// Detect what kind of identifier was entered
function detectIdentifierType(identifier: string): "email" | "username" {
  if (identifier.includes("@") && identifier.includes(".")) return "email";
  return "username";
}

// Popup for username login — choose confirmation method
function ConfirmMethodPopup({
                              onSelect,
                              onClose,
                            }: {
  onSelect: (method: "email" | "phone") => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card border border-border rounded-lg p-8 w-80 shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-light tracking-wider text-foreground mb-2">CHOOSE CONFIRMATION</h3>
        <p className="text-sm text-muted-foreground mb-6">
          How would you like to confirm your login?
        </p>
        <div className="space-y-3 mb-4">
          <button
            onClick={() => onSelect("email")}
            className="w-full flex items-center gap-3 px-4 py-3 border border-border rounded hover:bg-muted transition-colors text-left"
          >
            <span className="text-xl">📧</span>
            <div>
              <p className="text-sm font-light text-foreground">Confirm via Email</p>
              <p className="text-xs text-muted-foreground">We'll send a link to your email</p>
            </div>
          </button>
          <button
            onClick={() => onSelect("phone")}
            className="w-full flex items-center gap-3 px-4 py-3 border border-border rounded hover:bg-muted transition-colors text-left"
          >
            <span className="text-xl">📱</span>
            <div>
              <p className="text-sm font-light text-foreground">Confirm via SMS</p>
              <p className="text-xs text-muted-foreground">We'll send a code to your phone</p>
            </div>
          </button>
        </div>
        <Button variant="outline" className="w-full" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}

export default function Login() {
  const [, navigate] = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [resolvedEmail, setResolvedEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) { toast.error("Please enter your email, username, or phone number."); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters."); return; }

    const type = detectIdentifierType(identifier);

    setIsLoading(true);
    try {
      if (type === "email") {
        const { error } = await supabase.auth.signInWithPassword({ email: identifier, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate("/");
      } else {
        // Username: resolve to email then sign in
        const res = await fetch(`/api/auth/resolve-identifier?identifier=${encodeURIComponent(identifier)}`);
        if (!res.ok) throw new Error("Account not found.");
        const data = await res.json();
        if (!data.email) throw new Error("Account not found.");
        const { error } = await supabase.auth.signInWithPassword({ email: data.email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const id = identifier.trim();
    if (!id) { toast.error("Enter your email, username, or phone first."); return; }

    setIsLoading(true);
    try {
      let email = id;

      // If not an email, resolve it
      if (!id.includes("@")) {
        const res = await fetch(`/api/auth/resolve-identifier?identifier=${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error("Account not found.");
        const data = await res.json();
        email = data.email;
      }

      const type = detectIdentifierType(id);

      if (type === "username") {
        // Show popup to choose method
        setResolvedEmail(email);
        setShowConfirmPopup(true);
      } else {
        // Send directly
        await fetch("/api/email/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        toast.success("Password reset link sent!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmMethodSelect = async (method: "email" | "phone") => {
    setShowConfirmPopup(false);
    try {
      if (method === "email") {
        await fetch("/api/email/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: resolvedEmail }),
        });
        toast.success("Reset link sent to your email!");
      } else {
        toast.info("SMS reset requires phone verification setup. Reset via email instead.");
      }
    } catch {
      toast.error("Failed to send reset.");
    }
  };

  const idType = identifier ? detectIdentifierType(identifier) : null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {showConfirmPopup && (
        <ConfirmMethodPopup
          onSelect={handleConfirmMethodSelect}
          onClose={() => setShowConfirmPopup(false)}
        />
      )}

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-12">
          <button onClick={() => navigate("/")}
                  className="text-3xl font-light tracking-[0.4em] text-foreground hover:text-muted-foreground transition-colors">
            NARCISSUS
          </button>
          <div className="w-16 h-px bg-accent mx-auto mt-4" />
        </div>

        {/* Guest note */}
        <div className="bg-muted/40 border border-border rounded-lg px-5 py-4 mb-6 text-center">
          <p className="text-sm text-muted-foreground">
            You don't need an account to shop.{" "}
            <button onClick={() => navigate("/products")} className="underline hover:text-foreground transition-colors font-light">
              Browse & checkout as guest →
            </button>
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Yet you still need an account to access{" "}
            <strong className="text-foreground font-light">Order History</strong>,{" "}
            <strong className="text-foreground font-light">Track Your Orders</strong>, and other features.
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-8">
          <h2 className="text-xl font-light tracking-wider mb-6">SIGN IN</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-light text-foreground mb-2">
                Email or Username
              </label>
              <div className="relative">
                <Input
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="your@email.com or @username"
                  required
                  autoComplete="username"
                  className="pl-9"
                />
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              {idType && (
                <p className="text-xs text-muted-foreground mt-1">
                  Detected: <span className="text-foreground font-light capitalize">{idType}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-light text-foreground mb-2">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
                  autoComplete="current-password"
                  className="pl-9 pr-10"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={isLoading}
                    className="w-full bg-foreground text-background hover:bg-foreground/90 py-6 text-sm font-light tracking-wider">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "SIGN IN"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Forgot your password?{" "}
            <button
              onClick={handleForgotPassword}
              disabled={isLoading}
              className="underline hover:text-foreground transition-colors"
            >
              Reset it
            </button>
          </p>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          No account?{" "}
          <button onClick={() => navigate("/signup")} className="underline hover:text-foreground transition-colors font-medium">
            Sign Up!
          </button>
        </p>

        <p className="text-center text-xs text-muted-foreground mt-3">
          <button onClick={() => navigate("/")} className="underline hover:text-foreground transition-colors">
            Back to store
          </button>
        </p>
      </div>
    </div>
  );
}