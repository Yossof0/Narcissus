import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { StorefrontLayout } from "@/components/StorefrontLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, Package, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped:   "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const STATUS_STEPS = ["pending", "confirmed", "shipped", "delivered"];

export default function OrderHistory() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const { t, language, isRTL } = useLanguage();

  const { data: orders = [], isLoading } = trpc.orders.myOrders.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/login");
  }, [loading, isAuthenticated, navigate]);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      pending:   { en: "Pending",   ar: "في الانتظار" },
      confirmed: { en: "Confirmed", ar: "مؤكد" },
      shipped:   { en: "Shipped",   ar: "تم الشحن" },
      delivered: { en: "Delivered", ar: "تم التوصيل" },
      cancelled: { en: "Cancelled", ar: "ملغى" },
    };
    return language === "ar" ? (labels[status]?.ar || status) : (labels[status]?.en || status);
  };

  const getStepLabel = (step: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      pending:   { en: "Pending",   ar: "انتظار" },
      confirmed: { en: "Confirmed", ar: "مؤكد" },
      shipped:   { en: "Shipped",   ar: "شحن" },
      delivered: { en: "Delivered", ar: "تسليم" },
    };
    return language === "ar" ? (labels[step]?.ar || step) : (labels[step]?.en || step);
  };

  if (loading || isLoading) {
    return (
      <StorefrontLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout>
      <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
        {/* Header */}
        <div className="bg-card py-12 border-b border-border">
          <div className="container">
            <h1 className="text-4xl font-light tracking-wider text-foreground mb-2">{t("orderHistoryTitle")}</h1>
            <div className="w-16 h-px bg-accent" />
          </div>
        </div>

        <div className="container py-12 max-w-3xl">
          {orders.length === 0 ? (
            <div className="text-center py-24">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground mb-6">{t("noOrdersYet")}</p>
              <Button onClick={() => navigate("/products")} variant="outline">{t("startShopping")}</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order: any) => (
                <div key={order.id}
                     onClick={() => navigate(`/order-confirmation/${order.id}`)}
                     className="bg-card border border-border rounded-lg p-6 cursor-pointer hover:bg-muted/20 transition-colors">

                  {/* Order header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-light text-foreground text-lg">
                        {language === "ar" ? `طلب #${order.id}` : `Order #${order.id}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString(language === "ar" ? "ar-EG" : "en-EG", {
                          year: "numeric", month: "long", day: "numeric"
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-light ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-800"}`}>
                        {getStatusLabel(order.status)}
                      </span>
                      <ChevronRight className={`w-4 h-4 text-muted-foreground ${isRTL ? "rotate-180" : ""}`} />
                    </div>
                  </div>

                  {/* Progress bar */}
                  {STATUS_STEPS.includes(order.status) && (
                    <div className="mb-4">
                      <div className="flex items-center gap-1 mb-1">
                        {STATUS_STEPS.map((step, idx) => {
                          const currentIdx = STATUS_STEPS.indexOf(order.status);
                          return (
                            <div key={step} className="flex-1 h-1.5 rounded-full transition-colors"
                                 style={{ backgroundColor: idx <= currentIdx ? "hsl(var(--foreground))" : "hsl(var(--border))" }} />
                          );
                        })}
                      </div>
                      <div className="flex justify-between">
                        {STATUS_STEPS.map(step => (
                          <span key={step} className="text-xs text-muted-foreground">{getStepLabel(step)}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Items summary */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {order.items?.length || 0} {language === "ar" ? "منتج" : "item(s)"}
                      {order.items?.slice(0, 2).map((item: any) => (
                        <span key={item.id}> · {item.productName}</span>
                      ))}
                      {order.items?.length > 2 && <span> · +{order.items.length - 2}</span>}
                    </p>
                    <p className="font-light text-foreground">
                      EGP {(order.totalPrice / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </StorefrontLayout>
  );
}