import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { useTheme, THEMES, type ThemeId } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StorefrontLayout } from "@/components/StorefrontLayout";
import { toast } from "sonner";
import { Loader2, User, Globe, Lock, Mail, AtSign, ChevronDown, AlertCircle, KeyRound, Camera, Palette, Check } from "lucide-react";
import { getPrivilege } from "@shared/privileges";

const FLAG: Record<Language, string> = { en: "🇬🇧", ar: "🇪🇬" };
const LABEL: Record<Language, string> = { en: "English", ar: "العربية" };

function PasswordResetPopup({ email, onClose }: { email: string; onClose: () => void }) {
  const [sending, setSending] = useState(false);
  const sendViaEmail = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/email/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      toast.success("Password reset link sent!");
      onClose();
    } catch { toast.error("Failed to send reset email."); }
    finally { setSending(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card border border-border rounded-lg p-8 w-96 shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-light tracking-wider text-foreground mb-2">REQUEST PASSWORD CHANGE</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Choose how you'd like to receive your reset link.
        </p>
        <div className="space-y-3 mb-6">
          <button onClick={sendViaEmail} disabled={sending}
                  className="w-full flex items-center gap-3 px-4 py-3 border border-border rounded hover:bg-muted transition-colors text-left">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-light text-foreground">Via Email</p>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
            {sending && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
          </button>
        </div>
        <Button variant="outline" className="w-full" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, isAuthenticated, loading } = useAuth();
  const { t, language, setLanguage, isRTL } = useLanguage();
  const { themeId, setTheme, theme } = useTheme();
  const [, navigate] = useLocation();

  const [langOpen, setLangOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isSavingIdentifiers, setIsSavingIdentifiers] = useState(false);
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/login");
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/profile/get?supabaseId=${user.id}`)
      .then(r => r.json())
      .then(data => {
        setProfileData(data);
        setUsername(data?.username || user.user_metadata?.username || "");
        setEmail(user.email || "");
      })
      .catch(() => {
        setUsername(user.user_metadata?.username || "");
        setEmail(user.email || "");
      })
      .finally(() => setProfileLoading(false));
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      await supabase.auth.updateUser({ data: { avatar_url: url } });
      await fetch("/api/profile/upsert", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supabaseId: user.id, email: user.email, avatarUrl: url, fullName: profileData?.fullName, birthday: profileData?.birthday, address: profileData?.address }),
      });
      await supabase.auth.refreshSession();
      toast.success("Profile photo updated!");
      window.location.reload();
    } catch (err: any) { toast.error(err.message || "Upload failed."); }
    finally { setIsUploadingAvatar(false); }
  };

  const setAvatar = async (url: string | null) => {
    if (!user) return;
    try {
      await supabase.auth.updateUser({ data: { avatar_url: url } });
      await fetch("/api/profile/upsert", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supabaseId: user.id, email: user.email, avatarUrl: url, fullName: profileData?.fullName, birthday: profileData?.birthday, address: profileData?.address }),
      });
      toast.success(url ? "Profile photo updated!" : "Using initial as avatar.");
      window.location.reload();
    } catch { toast.error("Failed."); }
  };

  // Only show missing fields for birthday and fullName (no phone)
  const missingFields: string[] = [];
  if (!profileData?.birthday) missingFields.push("birthday");
  if (!profileData?.fullName) missingFields.push("full name");

  const handleSaveIdentifiers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingIdentifiers(true);
    try {
      if (email !== user.email) {
        const { error } = await supabase.auth.updateUser({ email });
        if (error) throw error;
        toast.success("Email update confirmation sent! Check your inbox.");
      }
      await fetch("/api/profile/upsert", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supabaseId: user.id, email: user.email, username: username.trim() || undefined, fullName: profileData?.fullName, address: profileData?.address, birthday: profileData?.birthday }),
      });
      toast.success("Profile updated!");
    } catch (err: any) { toast.error(err.message || "Failed to update profile."); }
    finally { setIsSavingIdentifiers(false); }
  };

  if (loading || profileLoading || !isAuthenticated || !user) {
    return (
      <StorefrontLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </StorefrontLayout>
    );
  }

  const privilege = getPrivilege(user.email);

  return (
    <StorefrontLayout>
      {showPasswordPopup && <PasswordResetPopup email={user.email!} onClose={() => setShowPasswordPopup(false)} />}
      <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
        <div className="bg-card py-12 border-b border-border">
          <div className="container">
            <h1 className="text-4xl font-light tracking-wider text-foreground mb-2">{t("myProfile")}</h1>
            <div className="w-16 h-px bg-accent" />
          </div>
        </div>

        <div className="container py-12 max-w-2xl space-y-6">

          {/* Missing fields — only birthday and full name */}
          {!profileLoading && missingFields.length > 0 && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-light text-amber-800">{t("profileIncomplete")}</p>
                <p className="text-xs text-amber-600 mt-1">
                  {t("missingFields")}: {missingFields.join(", ")}.{" "}
                  <button onClick={() => navigate("/signup")} className="underline hover:text-amber-800">{t("completeProfile")}</button>
                </p>
              </div>
            </div>
          )}

          {/* Account + Avatar */}
          <div className="bg-card border border-border rounded-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-light tracking-wider">{t("accountSettings")}</h2>
            </div>
            <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg mb-6">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border bg-foreground shrink-0">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-light text-background">
                    {(profileData?.username || user.email)?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="font-light text-foreground">{profileData?.fullName || profileData?.username || user.email}</p>
                <p className="text-sm text-muted-foreground capitalize">{privilege} account</p>
              </div>
            </div>
            <p className="text-sm font-light text-muted-foreground mb-3">Change profile photo:</p>
            <div className="grid grid-cols-3 gap-3">
              <button type="button" onClick={() => setAvatar("https://res.cloudinary.com/dxofj2nsv/image/upload/v1779330195/logo_jkwmyl.jpg")}
                      className="flex flex-col items-center gap-2 p-3 border border-border rounded-lg hover:bg-muted transition-colors">
                <img src="https://res.cloudinary.com/dxofj2nsv/image/upload/v1779330195/logo_jkwmyl.jpg" alt="Brand" className="w-10 h-10 rounded-full object-cover" />
                <span className="text-xs text-muted-foreground">Brand Logo</span>
              </button>
              <button type="button" onClick={() => setAvatar(null)}
                      className="flex flex-col items-center gap-2 p-3 border border-border rounded-lg hover:bg-muted transition-colors">
                <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center text-lg font-light">
                  {(profileData?.username || user.email)?.[0]?.toUpperCase()}
                </div>
                <span className="text-xs text-muted-foreground">My Initial</span>
              </button>
              <label className="flex flex-col items-center gap-2 p-3 border border-border rounded-lg hover:bg-muted transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  {isUploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <Camera className="w-4 h-4 text-muted-foreground" />}
                </div>
                <span className="text-xs text-muted-foreground">Upload Photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
              </label>
            </div>
          </div>

          {/* Edit Profile */}
          <div className="bg-card border border-border rounded-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <AtSign className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-light tracking-wider">{t("editProfile")}</h2>
            </div>
            <form onSubmit={handleSaveIdentifiers} className="space-y-4">
              <div>
                <label className="block text-sm font-light text-foreground mb-2">{t("usernameLabel")}</label>
                <div className="relative">
                  <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="your_username" className="pl-9" />
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-light text-foreground mb-2">{t("emailLabel")}</label>
                <div className="relative">
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="pl-9" />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
                {email !== user.email && (
                  <p className="text-xs text-amber-600 mt-1">A confirmation will be sent to both old and new email.</p>
                )}
              </div>
              <Button type="submit" disabled={isSavingIdentifiers} className="bg-foreground text-background hover:bg-foreground/90 font-light tracking-wider">
                {isSavingIdentifiers ? <Loader2 className="w-4 h-4 animate-spin" /> : t("saveChanges")}
              </Button>
            </form>
          </div>

          {/* Password */}
          <div className="bg-card border border-border rounded-lg p-8">
            <div className="flex items-center gap-3 mb-2">
              <KeyRound className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-light tracking-wider">{t("changePassword")}</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">{t("changePasswordDesc")}</p>
            <Button type="button" onClick={() => setShowPasswordPopup(true)} variant="outline" className="font-light tracking-wider">
              {t("requestResetLink")}
            </Button>
          </div>

          {/* Theme */}
          <div className="bg-card border border-border rounded-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <Palette className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-light tracking-wider">THEME</h2>
            </div>
            <div className="relative">
              <button type="button" onClick={() => setThemeOpen(!themeOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 border border-border rounded bg-background hover:bg-muted transition-colors">
                <span className="flex items-center gap-3">
                  <span className="flex gap-1">
                    {theme.preview.map((c, i) => (
                      <span key={i} className="w-4 h-4 rounded-full border border-border/50" style={{ backgroundColor: c }} />
                    ))}
                  </span>
                  <span className="font-light text-foreground">
                    {language === "ar" ? theme.nameAr : theme.name}
                  </span>
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${themeOpen ? "rotate-180" : ""}`} />
              </button>
              {themeOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-10 overflow-hidden">
                  {THEMES.map(th => (
                    <button key={th.id} type="button"
                            onClick={() => { setTheme(th.id as ThemeId); setThemeOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left ${themeId === th.id ? "bg-muted/50" : ""}`}>
                      <span className="flex gap-1 shrink-0">
                        {th.preview.map((c, i) => (
                          <span key={i} className="w-4 h-4 rounded-full border border-border/50" style={{ backgroundColor: c }} />
                        ))}
                      </span>
                      <span className="font-light text-foreground flex-1">
                        {language === "ar" ? th.nameAr : th.name}
                      </span>
                      {themeId === th.id && <Check className="w-4 h-4 text-foreground" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Language */}
          <div className="bg-card border border-border rounded-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-light tracking-wider">{t("language")}</h2>
            </div>
            <div className="relative w-64">
              <button type="button" onClick={() => setLangOpen(!langOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 border border-border rounded bg-background hover:bg-muted transition-colors">
                <span className="flex items-center gap-3">
                  <span className="text-xl">{FLAG[language]}</span>
                  <span className="font-light text-foreground">{LABEL[language]}</span>
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${langOpen ? "rotate-180" : ""}`} />
              </button>
              {langOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded shadow-lg z-10 overflow-hidden">
                  {(["en", "ar"] as Language[]).map(lang => (
                    <button key={lang} type="button" onClick={() => { setLanguage(lang); setLangOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left ${language === lang ? "bg-muted/50" : ""}`}>
                      <span className="text-xl">{FLAG[lang]}</span>
                      <span className="font-light text-foreground">{LABEL[lang]}</span>
                      {language === lang && <span className="ml-auto text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </StorefrontLayout>
  );
}