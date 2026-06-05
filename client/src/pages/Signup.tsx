import { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff, User, Mail, Lock, MapPin, Calendar, CheckCircle, Camera } from "lucide-react";
import { toast } from "sonner";

type Step = 1 | 2 | 3 | 4;
const STEPS = ["Account Info", "Verify Email", "Personal Info", "Profile Photo"];
const BRAND_LOGO = "https://res.cloudinary.com/dxofj2nsv/image/upload/v1779330195/logo_jkwmyl.jpg";

export default function Signup() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Step 1
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 3
  const [address, setAddress] = useState("");
  const [birthday, setBirthday] = useState("");

  // Step 4
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { toast.error("Username is required."); return; }
    if (!fullName.trim()) { toast.error("Full name is required."); return; }
    if (!email.trim()) { toast.error("Email is required."); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    if (password !== confirmPassword) { toast.error("Passwords do not match."); return; }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { username: username.trim(), full_name: fullName.trim() } },
      });
      if (error) throw error;
      await fetch("/api/email/confirm", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStep(2);
    } catch (err: any) { toast.error(err.message || "Signup failed."); }
    finally { setIsLoading(false); }
  };

  const handleStep2 = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) { setStep(3); }
      else { toast.error("Email not confirmed yet. Check your inbox and click the link."); }
    } catch { toast.error("Could not verify email status."); }
    finally { setIsLoading(false); }
  };

  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthday) { toast.error("Birthday is required."); return; }
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      await fetch("/api/profile/upsert", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supabaseId: user.id, email: user.email,
          username, fullName,
          address: address || null, birthday,
        }),
      });
      setStep(4);
    } catch (err: any) { toast.error(err.message || "Failed to save profile."); }
    finally { setIsLoading(false); }
  };

  const saveAvatar = async (url: string | null) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.auth.updateUser({ data: { avatar_url: url } });
    await fetch("/api/profile/upsert", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supabaseId: user.id, email: user.email, username, fullName, birthday, avatarUrl: url }),
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      setAvatarUrl(url);
      await saveAvatar(url);
      toast.success("Photo uploaded!");
    } catch { toast.error("Photo upload failed."); setAvatarPreview(""); }
    finally { setIsUploadingAvatar(false); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <button onClick={() => navigate("/")}
                  className="text-3xl font-light tracking-[0.4em] text-foreground hover:text-muted-foreground transition-colors">
            NARCISSUS
          </button>
          <div className="w-16 h-px bg-accent mx-auto mt-4" />
        </div>

        {/* Progress */}
        <div className="flex items-start mb-8">
          {([1,2,3,4] as Step[]).map((s, idx) => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs border-2 transition-colors
                ${step > s ? "bg-foreground text-background border-foreground"
                : step === s ? "border-foreground text-foreground bg-background"
                  : "border-border text-muted-foreground bg-background"}`}>
                {step > s ? "✓" : s}
              </div>
              <span className={`text-xs text-center leading-tight hidden md:block ${step === s ? "text-foreground" : "text-muted-foreground"}`}>
                {STEPS[idx]}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-lg p-8">

          {/* Step 1: Account Info */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <h2 className="text-xl font-light tracking-wider mb-6">ACCOUNT INFO</h2>
              <div>
                <label className="block text-sm font-light mb-2">Username *</label>
                <div className="relative">
                  <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. yossof" className="pl-9" required />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-light mb-2">Full Name *</label>
                <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Yossof Abdelwahed" required />
              </div>
              <div>
                <label className="block text-sm font-light mb-2">Email *</label>
                <div className="relative">
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="pl-9" required />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-light mb-2">Password *</label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" className="pl-9 pr-10" required />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-light mb-2">Confirm Password *</label>
                <Input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password" required />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full bg-foreground text-background hover:bg-foreground/90 py-6 font-light tracking-wider">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "CONTINUE →"}
              </Button>
            </form>
          )}

          {/* Step 2: Verify Email */}
          {step === 2 && (
            <div className="text-center space-y-6">
              <Mail className="w-16 h-16 mx-auto text-muted-foreground" />
              <h2 className="text-xl font-light tracking-wider">VERIFY YOUR EMAIL</h2>
              <p className="text-muted-foreground text-sm">
                Confirmation sent to <strong className="text-foreground">{email}</strong>.<br />
                Click the link in the email, then come back here.
              </p>
              <Button onClick={handleStep2} disabled={isLoading} className="w-full bg-foreground text-background hover:bg-foreground/90 py-6 font-light tracking-wider">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "I CONFIRMED MY EMAIL →"}
              </Button>
              <button type="button" onClick={async () => {
                await fetch("/api/email/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
                toast.success("Resent!");
              }} className="text-xs text-muted-foreground underline hover:text-foreground">
                Resend email
              </button>
            </div>
          )}

          {/* Step 3: Personal Info */}
          {step === 3 && (
            <form onSubmit={handleStep3} className="space-y-4">
              <h2 className="text-xl font-light tracking-wider mb-6">PERSONAL INFO</h2>
              <div>
                <label className="block text-sm font-light mb-2">Birthday *</label>
                <div className="relative">
                  <Input type="date" value={birthday} onChange={e => setBirthday(e.target.value)} className="pl-9" required />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-light mb-2">Address <span className="text-muted-foreground text-xs">(optional)</span></label>
                <div className="relative">
                  <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Your address" className="pl-9" />
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full bg-foreground text-background hover:bg-foreground/90 py-6 font-light tracking-wider">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "CONTINUE →"}
              </Button>
            </form>
          )}

          {/* Step 4: Profile Photo */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-light tracking-wider text-center">PROFILE PHOTO</h2>
              <p className="text-sm text-muted-foreground text-center">Choose your profile picture — you can change this anytime.</p>

              {/* Preview */}
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border bg-foreground">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-light text-background">
                      {username[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* 3 options */}
              <div className="grid grid-cols-3 gap-3">
                {/* Brand logo */}
                <button type="button"
                        onClick={async () => {
                          setAvatarPreview(BRAND_LOGO);
                          setAvatarUrl(BRAND_LOGO);
                          await saveAvatar(BRAND_LOGO);
                          toast.success("Brand logo selected!");
                        }}
                        className={`flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors ${avatarUrl === BRAND_LOGO ? "border-foreground" : "border-border"}`}>
                  <img src={BRAND_LOGO} alt="Brand" className="w-12 h-12 rounded-full object-cover" />
                  <span className="text-xs text-muted-foreground">Brand Logo</span>
                </button>

                {/* Letter */}
                <button type="button"
                        onClick={async () => {
                          setAvatarPreview("");
                          setAvatarUrl("");
                          await saveAvatar(null);
                          toast.success("Using initial!");
                        }}
                        className={`flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors ${!avatarUrl ? "border-foreground" : "border-border"}`}>
                  <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center text-xl font-light">
                    {username[0]?.toUpperCase()}
                  </div>
                  <span className="text-xs text-muted-foreground">My Initial</span>
                </button>

                {/* Upload */}
                <label className={`flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors cursor-pointer ${avatarUrl && avatarUrl !== BRAND_LOGO ? "border-foreground" : "border-border"}`}>
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    {isUploadingAvatar ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : <Camera className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <span className="text-xs text-muted-foreground">Upload Photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                </label>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => navigate("/")}>Skip</Button>
                <Button type="button" onClick={() => navigate("/")} className="flex-1 bg-foreground text-background hover:bg-foreground/90 font-light tracking-wider">
                  {avatarUrl ? "FINISH →" : "SKIP & FINISH"}
                </Button>
              </div>
            </div>
          )}

        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <button type="button" onClick={() => navigate("/login")} className="underline hover:text-foreground font-medium">Sign in</button>
        </p>
      </div>
    </div>
  );
}