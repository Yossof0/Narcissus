import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase sends the user back with a session in the URL hash.
  // We need to wait for it to be picked up before allowing the form.
  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-12">
          <button
            onClick={() => navigate("/")}
            className="text-3xl font-light tracking-[0.4em] text-foreground hover:text-muted-foreground transition-colors"
          >
            NARCISSUS
          </button>
          <div className="w-16 h-px bg-accent mx-auto mt-4" />
        </div>

        <div className="bg-card border border-border rounded-lg p-8">
          {done ? (
            // Success state
            <div className="text-center py-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
              <h2 className="text-2xl font-light tracking-wider text-foreground mb-4">
                PASSWORD UPDATED
              </h2>
              <p className="text-muted-foreground mb-8">
                Your password has been changed successfully.
              </p>
              <Button
                onClick={() => navigate("/")}
                className="bg-foreground text-background hover:bg-foreground/90 px-8 font-light tracking-wider"
              >
                BACK TO STORE
              </Button>
            </div>
          ) : !sessionReady ? (
            // Waiting for Supabase to process the recovery token
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Verifying your reset link...</p>
              <p className="text-sm text-muted-foreground mt-2">
                If nothing happens,{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="underline hover:text-foreground transition-colors"
                >
                  request a new link
                </button>
                .
              </p>
            </div>
          ) : (
            // Reset form
            <>
              <h2 className="text-2xl font-light tracking-wider text-foreground mb-2">
                NEW PASSWORD
              </h2>
              <p className="text-sm text-muted-foreground mb-8">
                Choose a strong password for your account.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-light text-foreground mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      required
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-light text-foreground mb-2">
                    Confirm New Password
                  </label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your new password"
                    required
                    autoComplete="new-password"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-foreground text-background hover:bg-foreground/90 py-6 text-sm font-light tracking-wider mt-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "SET NEW PASSWORD"
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}