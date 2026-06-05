import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { CheckCircle, Package, MapPin, Loader2 } from "lucide-react";
import { StorefrontLayout } from "@/components/StorefrontLayout";
import { useLanguage } from "@/contexts/LanguageContext";

const STATUS_CONFIG: Record<string, { color: string; messageEn: string; messageAr: string }> = {
  pending:   { color: "bg-yellow-100 text-yellow-800",  messageEn: "We've received your order and will confirm it shortly.",            messageAr: "استلمنا طلبك وسنؤكده قريباً." },
  confirmed: { color: "bg-blue-100 text-blue-800",      messageEn: "Your order has been confirmed and is being prepared.",              messageAr: "تم تأكيد طلبك وهو قيد التجهيز." },
  shipped:   { color: "bg-purple-100 text-purple-800",  messageEn: "Your order is on its way to you!",                                messageAr: "طلبك في الطريق إليك!" },
  delivered: { color: "bg-green-100 text-green-800",    messageEn: "Your order has been delivered. Enjoy!",                           messageAr: "تم توصيل طلبك. استمتع!" },
  cancelled: { color: "bg-red-100 text-red-800",        messageEn: "Your order has been cancelled. Contact us if you have questions.", messageAr: "تم إلغاء طلبك. تواصل معنا إذا كان لديك استفسار." },
};

export default function OrderConfirmation() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { t, language, isRTL } = useLanguage();
  const orderId = parseInt(id || "0");
  const { data: order, isLoading } = trpc.orders.getById.useQuery({ id: orderId });

  if (isLoading) {
    return (
      <StorefrontLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </StorefrontLayout>
    );
  }

  if (!order) {
    return (
      <StorefrontLayout>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center">
          <p className="text-muted-foreground mb-6">Order not found</p>
          <Button onClick={() => navigate("/")} variant="outline">{t("continueShopping")}</Button>
        </div>
      </StorefrontLayout>
    );
  }

  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
  const statusMessage = language === "ar" ? cfg.messageAr : cfg.messageEn;

  return (
    <StorefrontLayout>
      <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
        <div className="container py-24 max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-4xl font-light tracking-wider text-foreground mb-4">{t("orderConfirmed")}</h1>
            <div className="w-16 h-px bg-accent mx-auto mb-6" />
            <p className="text-muted-foreground text-lg">
              {t("thankYouName")}, <strong className="text-foreground font-light">{order.customerName}</strong>.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {language === "ar" ? `طلب #${order.id}` : `Order #${order.id}`}
              {" · "}
              {language === "ar" ? "تم إرسال إشعار الطلب إلى المالك" : "Order notification sent to the owner"}
            </p>
          </div>
          <div className="bg-card rounded-lg p-8 mb-6">
            <h2 className="text-xl font-light tracking-wider text-foreground mb-6">{t("orderDetails")}</h2>
            {order.items && order.items.length > 0 && (
              <div className="space-y-4 mb-8 pb-8 border-b border-border">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between">
                    <div>
                      <p className="font-light text-foreground">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">{language === "ar" ? `الكمية: ${item.quantity}` : `Qty: ${item.quantity}`}</p>
                      {item.customizations && (() => { try { return JSON.parse(item.customizations).map((c: any, i: number) => <p key={i} className="text-xs text-muted-foreground">{c.title}: {c.value}</p>); } catch { return null; } })()}
                    </div>
                    <p className="font-light text-foreground">EGP {((item.price * item.quantity) / 100).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-lg font-light text-foreground">{t("total")}</span>
              <span className="text-2xl font-light text-foreground">EGP {(order.totalPrice / 100).toFixed(2)}</span>
            </div>
          </div>
          <div className="bg-card rounded-lg p-8 mb-6">
            <h2 className="text-xl font-light tracking-wider text-foreground mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />{t("deliveryInfo")}
            </h2>
            <div className="space-y-2 text-muted-foreground text-sm">
              <p><span className="text-foreground font-light">{t("fullNameLabel")}:</span> {order.customerName}</p>
              <p><span className="text-foreground font-light">{t("phoneLabel")}:</span> {order.customerPhone}</p>
              <p><span className="text-foreground font-light">{t("addressLabel")}:</span> {order.customerAddress}</p>
            </div>
          </div>
          <div className="bg-card rounded-lg p-8 mb-12">
            <h2 className="text-xl font-light tracking-wider text-foreground mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />{t("orderStatus")}
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-light capitalize ${cfg.color}`}>{order.status}</span>
              <span className="text-sm text-muted-foreground">{statusMessage}</span>
            </div>
          </div>
          <div className="text-center space-y-4">
            <Button onClick={() => navigate("/products")} className="bg-foreground text-background hover:bg-foreground/90 px-12 py-6 text-lg font-light tracking-wider">
              {t("continueShopping")}
            </Button>
            <p className="text-sm text-muted-foreground">
              {language === "ar" ? "استفسارات؟ تواصل معنا:" : "Questions? Contact us:"}{" "}
              <a href="tel:+201092855408" className="underline hover:text-foreground transition-colors">+20 01092855408</a>
              {" · "}
              <a href="mailto:abdelwahedrowan@gmail.com" className="underline hover:text-foreground transition-colors">abdelwahedrowan@gmail.com</a>
            </p>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}