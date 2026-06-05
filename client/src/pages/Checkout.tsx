import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, Loader2, MapPin, Lock } from "lucide-react";
import { StorefrontLayout } from "@/components/StorefrontLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

function isDeliveryAllowed(_address: string): boolean {
  return true;
}

interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CheckboxField({ label, checked, onToggle, children }: CheckboxFieldProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-light text-foreground">{label}</label>
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={checked}
            onChange={onToggle}
            className="w-3.5 h-3.5 rounded"
          />
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            {checked && <Lock className="w-3 h-3" />}
            Use profile info
          </span>
        </label>
      </div>
      {children}
    </div>
  );
}

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  // Form fields
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  // "Use profile info" toggles — enabled by default when user is logged in
  const [usePName, setUsePName] = useState(false);
  const [usePEmail, setUsePEmail] = useState(false);
  const [usePPhone, setUsePPhone] = useState(false);
  const [usePAddress, setUsePAddress] = useState(false);

  const createOrder = trpc.orders.create.useMutation();

  // Load profile data when logged in
  useEffect(() => {
    if (!user) return;
    fetch(`/api/profile/get?supabaseId=${user.id}`)
      .then(r => r.json())
      .then(data => {
        setProfileData(data);
        // Auto-enable checkboxes for fields that exist
        if (data?.fullName) { setUsePName(true); setCustomerName(data.fullName); }
        if (user?.email) { setUsePEmail(true); setCustomerEmail(user.email); }
        if (data?.phone) { setUsePPhone(true); setCustomerPhone(data.phone); }
        if (data?.address) { setUsePAddress(true); setCustomerAddress(data.address); }
      })
      .catch(() => {
        if (user?.email) { setUsePEmail(true); setCustomerEmail(user.email); }
      });
  }, [user]);

  // Sync fields when toggles change
  useEffect(() => {
    if (usePName && profileData?.fullName) setCustomerName(profileData.fullName);
  }, [usePName, profileData]);
  useEffect(() => {
    if (usePEmail && user?.email) setCustomerEmail(user.email);
  }, [usePEmail, user]);
  useEffect(() => {
    if (usePPhone && profileData?.phone) setCustomerPhone(profileData.phone);
  }, [usePPhone, profileData]);
  useEffect(() => {
    if (usePAddress && profileData?.address) setCustomerAddress(profileData.address);
  }, [usePAddress, profileData]);

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail || !customerPhone || !customerAddress) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (cart.length === 0) { toast.error("Your cart is empty."); return; }

    setIsLoading(true);
    try {
      const orderResult = await createOrder.mutateAsync({
        customerName, customerEmail, customerPhone, customerAddress,
        supabaseUserId: user?.id,
        items: cart.map(item => ({
          productId: item.id, productName: item.name,
          quantity: item.quantity, price: item.price,
          customizations: item.customizations ? JSON.stringify(item.customizations) : undefined,
        })),
        totalPrice,
      });

      // Send order notification to admin
      try {
        await fetch("/api/email/order-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order: {
              id: orderResult.orderId,
              customerName, customerEmail, customerPhone, customerAddress,
              totalPrice: Math.round(totalPrice * 100),
              items: cart.map(item => ({
                productName: item.name, quantity: item.quantity,
                price: Math.round(item.price * 100),
                customizations: item.customizations ? JSON.stringify(item.customizations) : undefined,
              })),
            }
          }),
        });
      } catch (emailErr) {
        console.warn("Order notification email failed:", emailErr);
      }

      clearCart();
      navigate(`/order-confirmation/${orderResult.orderId}`);
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("An error occurred during checkout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <StorefrontLayout>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center">
          <p className="text-muted-foreground mb-6">{t("cartEmpty")}</p>
          <Button onClick={() => navigate("/products")} variant="outline">{t("continueShopping")}</Button>
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout>
      <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
        {/* Header */}
        <div className="bg-card py-6 border-b border-border">
          <div className="container">
            <button onClick={() => navigate("/products")}
                    className="flex items-center text-muted-foreground hover:text-foreground transition-colors mb-4">
              <ChevronLeft className="w-5 h-5 mr-2" />
              {t("backToShopping")}
            </button>
            <h1 className="text-4xl font-light tracking-wider text-foreground">{t("checkout")}</h1>
          </div>
        </div>

        {/* Delivery notice */}
        <div className="bg-muted/50 border-b border-border py-3">
          <div className="container flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 shrink-0" />
            <span>{t("deliveryNotice")}</span>
          </div>
        </div>

        <div className="container py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="text-2xl font-light tracking-wider text-foreground">{t("customerInfo")}</h2>

                {/* Full Name */}
                {user ? (
                  <CheckboxField label={t("fullNameLabel")} checked={usePName} onToggle={() => setUsePName(!usePName)}>
                    <Input
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder={t("fullNameLabel")}
                      disabled={usePName}
                      required
                      className={usePName ? "opacity-60 cursor-not-allowed" : ""}
                    />
                  </CheckboxField>
                ) : (
                  <div>
                    <label className="block text-sm font-light text-foreground mb-2">{t("fullNameLabel")}</label>
                    <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder={t("fullNameLabel")} required />
                  </div>
                )}

                {/* Email */}
                {user ? (
                  <CheckboxField label={t("emailLabel")} checked={usePEmail} onToggle={() => setUsePEmail(!usePEmail)}>
                    <Input
                      type="email"
                      value={customerEmail}
                      onChange={e => setCustomerEmail(e.target.value)}
                      placeholder={t("emailLabel")}
                      disabled={usePEmail}
                      required
                      className={usePEmail ? "opacity-60 cursor-not-allowed" : ""}
                    />
                  </CheckboxField>
                ) : (
                  <div>
                    <label className="block text-sm font-light text-foreground mb-2">{t("emailLabel")}</label>
                    <Input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder={t("emailLabel")} required />
                  </div>
                )}

                {/* Phone */}
                {user ? (
                  <CheckboxField label={t("phoneLabel")} checked={usePPhone} onToggle={() => setUsePPhone(!usePPhone)}>
                    <Input
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="01xxxxxxxxx"
                      disabled={usePPhone}
                      required
                      className={usePPhone ? "opacity-60 cursor-not-allowed" : ""}
                    />
                  </CheckboxField>
                ) : (
                  <div>
                    <label className="block text-sm font-light text-foreground mb-2">{t("phoneLabel")}</label>
                    <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="01xxxxxxxxx" required />
                  </div>
                )}

                {/* Address */}
                {user ? (
                  <CheckboxField label={t("addressLabel")} checked={usePAddress} onToggle={() => setUsePAddress(!usePAddress)}>
                    <textarea
                      value={customerAddress}
                      onChange={e => setCustomerAddress(e.target.value)}
                      placeholder={t("addressPlaceholder")}
                      rows={3}
                      disabled={usePAddress}
                      required
                      className={`w-full px-4 py-2 border border-border rounded bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none transition-colors ${usePAddress ? "opacity-60 cursor-not-allowed" : ""}`}
                    />
                  </CheckboxField>
                ) : (
                  <div>
                    <label className="block text-sm font-light text-foreground mb-2">{t("addressLabel")}</label>
                    <textarea
                      value={customerAddress}
                      onChange={e => setCustomerAddress(e.target.value)}
                      placeholder={t("addressPlaceholder")}
                      rows={3}
                      required
                      className="w-full px-4 py-2 border border-border rounded bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    />
                  </div>
                )}

                <Button type="submit" disabled={isLoading}
                        className="w-full bg-foreground text-background hover:bg-foreground/90 py-6 text-lg font-light tracking-wider">
                  {isLoading ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" />{t("processing")}</>
                  ) : t("completeOrder")}
                </Button>
              </form>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-lg p-8 sticky top-24">
                <h2 className="text-2xl font-light tracking-wider text-foreground mb-8">{t("orderSummary")}</h2>
                <div className="space-y-4 mb-8 pb-8 border-b border-border">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <div>
                        <p className="font-light text-foreground">{item.name}</p>
                        <p className="text-sm text-muted-foreground">x{item.quantity}</p>
                        {item.customizations?.map((c, i) => (
                          <p key={i} className="text-xs text-muted-foreground">{c.title}: {c.value}</p>
                        ))}
                      </div>
                      <p className="font-light text-foreground">EGP {(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-muted-foreground text-sm">
                    <span>{t("subtotal")}</span>
                    <span>EGP {totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-sm">
                    <span>{t("shipping")}</span>
                    <span>{t("free")}</span>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-border">
                    <span className="text-lg font-light text-foreground">{t("total")}</span>
                    <span className="text-2xl font-light text-foreground">EGP {totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}