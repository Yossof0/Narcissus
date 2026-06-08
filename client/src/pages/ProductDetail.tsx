import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ShoppingCart,
  Minus,
  Plus,
  ChevronDown,
  Heart,
  RotateCcw,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/_core/hooks/useFavorites";
import { StorefrontLayout } from "@/components/StorefrontLayout";
import { StarRating } from "@/components/StarRating";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { isAdmin } from "@shared/privileges";
import {
  getEffectiveDiscount,
  calculateDiscountedPrice,
  formatDiscount,
} from "@shared/discount";
import { toast } from "sonner";
import type { CustomizationOption } from "@/pages/Admin";

function ProductImage({
  src,
  alt,
  className,
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);
  if (!src || errored) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <span className="text-muted-foreground">No image available</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setErrored(true)}
      className={className || "w-full h-full object-cover"}
    />
  );
}

function CounterInput({
  option,
  value,
  onChange,
}: {
  option: CustomizationOption;
  value: number;
  onChange: (v: number) => void;
}) {
  const min = option.min ?? 1;
  const max = option.max ?? 99;
  return (
    <div className="flex items-center border border-border rounded w-fit select-none">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="px-3 py-2 hover:bg-muted transition-colors disabled:opacity-40 rounded-l"
      >
        <Minus className="w-3 h-3" />
      </button>
      <span className="w-10 text-center text-sm font-light border-x border-border py-2">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="px-3 py-2 hover:bg-muted transition-colors disabled:opacity-40 rounded-r"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const productId = parseInt(id || "0");
  const { data: product, isLoading } = trpc.products.getById.useQuery({
    id: productId,
  });
  const { data: relatedProducts = [] } = trpc.products.getByCategory.useQuery(
    { category: product?.category || "" },
    { enabled: !!product?.category }
  );
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const [quantity, setQuantity] = useState(1);

  const { data: majorDiscount } = trpc.discounts.getMajor.useQuery();

  const utils = trpc.useUtils();
  const resetRating = trpc.products.resetRating.useMutation({
    onSuccess: () => {
      toast.success("Rating reset.");
      utils.products.getById.invalidate({ id: productId });
      utils.products.list.invalidate();
    },
    onError: () => toast.error("Failed to reset rating."),
  });
  const [customValues, setCustomValues] = useState<
    Record<string, string | number>
  >({});

  // Parse customization options from product
  const customOptions = useMemo<CustomizationOption[]>(() => {
    try {
      return JSON.parse((product as any)?.customizations || "[]");
    } catch {
      return [];
    }
  }, [product]);

  // Initialize default values when options load
  useMemo(() => {
    const defaults: Record<string, string | number> = {};
    customOptions.forEach(opt => {
      if (opt.type === "counter")
        defaults[opt.id] = opt.defaultValue ?? opt.min ?? 1;
      else if (opt.type === "dropdown" && opt.choices?.length)
        defaults[opt.id] = opt.choices[0];
    });
    setCustomValues(defaults);
  }, [customOptions.length]);

  if (isLoading) {
    return (
      <StorefrontLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </StorefrontLayout>
    );
  }

  if (!product) {
    return (
      <StorefrontLayout>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center">
          <p className="text-muted-foreground mb-6">Product not found</p>
          <Button onClick={() => navigate("/products")} variant="outline">
            Back to Products
          </Button>
        </div>
      </StorefrontLayout>
    );
  }

  const decreaseQty = () => setQuantity(q => Math.max(1, q - 1));
  const increaseQty = () => setQuantity(q => q + 1);

  const handleAddToCart = () => {
    const customizations = customOptions.map(opt => ({
      title: opt.title,
      value:
        customValues[opt.id] ??
        (opt.type === "counter"
          ? (opt.defaultValue ?? 1)
          : (opt.choices?.[0] ?? "")),
    }));
    const discount = getEffectiveDiscount(
      product as any,
      majorDiscount ?? null
    );
    const finalPriceCents = discount
      ? calculateDiscountedPrice(product.price, discount)
      : product.price;
    addToCart({
      id: product.id,
      name: product.name,
      price: finalPriceCents / 100,
      originalPrice: discount ? product.price / 100 : undefined,
      image: product.imageUrl || "",
      quantity,
      customizations: customizations.length > 0 ? customizations : undefined,
    });
    toast.success(`${product.name} added to cart`);
    setQuantity(1);
  };

  return (
    <StorefrontLayout>
      <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
        {/* Back nav */}
        <div className="bg-card py-6 border-b border-border">
          <div className="container">
            <button
              onClick={() => navigate("/products")}
              className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Back to Products
            </button>
          </div>
        </div>

        {/* Product Detail */}
        <div className="container py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24">
            {/* Image */}
            <div className="flex items-center justify-center">
              <div className="w-full aspect-square rounded-lg overflow-hidden bg-card">
                <ProductImage src={product.imageUrl} alt={product.name} />
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-col justify-center">
              <div className="mb-6">
                <p className="text-sm text-muted-foreground tracking-wide mb-4">
                  {product.category.toUpperCase()}
                  {isAdmin(user?.email) && (
                    <span className="ml-3 font-mono text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                      ID: #{product.id}
                    </span>
                  )}
                </p>
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-5xl font-light tracking-wider text-foreground mb-4">
                    {product.name}
                  </h1>
                  <button
                    onClick={() => toggleFavorite(product.id)}
                    className={`mt-2 p-2 rounded-full border transition-colors shrink-0 ${
                      isFavorite(product.id)
                        ? "border-red-300 bg-red-50 text-red-500"
                        : "border-border hover:border-red-300 hover:text-red-400"
                    }`}
                    aria-label={
                      isFavorite(product.id)
                        ? "Remove from favorites"
                        : "Add to favorites"
                    }
                  >
                    <Heart
                      className="w-5 h-5"
                      fill={isFavorite(product.id) ? "currentColor" : "none"}
                    />
                  </button>
                </div>
                <div className="w-16 h-px bg-accent mb-4" />
                <div className="flex items-center gap-3 flex-wrap">
                  <StarRating
                    productId={product.id}
                    avgRating={(product as any).avgRating ?? 0}
                    ratingCount={(product as any).ratingCount ?? 0}
                  />
                  {isAdmin(user?.email) && (
                    <button
                      onClick={() => resetRating.mutate({ id: product.id })}
                      disabled={resetRating.isPending}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                      title="Reset rating (admin only)"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset rating
                    </button>
                  )}
                </div>
              </div>

              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {product.description ||
                  "Premium handmade product from Narcissus collection."}
              </p>

              <div className="mb-8">
                {(() => {
                  const discount = getEffectiveDiscount(
                    product as any,
                    majorDiscount ?? null
                  );
                  const finalPrice = discount
                    ? calculateDiscountedPrice(product.price, discount)
                    : product.price;
                  return (
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-4xl font-light text-foreground">
                        EGP {(finalPrice / 100).toFixed(2)}
                      </p>
                      {discount && (
                        <>
                          <p className="text-xl text-muted-foreground line-through">
                            EGP {(product.price / 100).toFixed(2)}
                          </p>
                          <span className="bg-red-500 text-white text-sm px-2 py-1 rounded font-light">
                            {formatDiscount(discount)}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Customization Options */}
              {customOptions.length > 0 && (
                <div className="mb-8 space-y-5">
                  {customOptions.map(opt => (
                    <div key={opt.id}>
                      <label className="block text-sm font-light tracking-wide text-foreground mb-3">
                        {opt.title.toUpperCase()}
                      </label>
                      {opt.type === "dropdown" && opt.choices && (
                        <div className="relative w-48">
                          <select
                            value={
                              (customValues[opt.id] as string) ?? opt.choices[0]
                            }
                            onChange={e =>
                              setCustomValues(v => ({
                                ...v,
                                [opt.id]: e.target.value,
                              }))
                            }
                            className="w-full appearance-none pl-4 pr-8 py-3 border border-border rounded bg-background text-foreground font-light focus:outline-none focus:ring-2 focus:ring-accent"
                          >
                            {opt.choices.map(choice => (
                              <option key={choice} value={choice}>
                                {choice}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                      )}
                      {opt.type === "counter" && (
                        <CounterInput
                          option={opt}
                          value={
                            (customValues[opt.id] as number) ??
                            opt.defaultValue ??
                            opt.min ??
                            1
                          }
                          onChange={v =>
                            setCustomValues(cv => ({ ...cv, [opt.id]: v }))
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Quantity Selector — button-only, no number input */}
              <div className="mb-8">
                <label className="block text-sm font-light tracking-wide text-foreground mb-4">
                  QUANTITY
                </label>
                <div className="flex items-center border border-border rounded w-fit select-none">
                  <button
                    onClick={decreaseQty}
                    disabled={quantity <= 1}
                    className="px-4 py-3 hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed rounded-l"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center text-base font-light border-x border-border py-3">
                    {quantity}
                  </span>
                  <button
                    onClick={increaseQty}
                    className="px-4 py-3 hover:bg-muted transition-colors rounded-r"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Add to Cart */}
              <Button
                onClick={handleAddToCart}
                className="bg-foreground text-background hover:bg-foreground/90 px-8 py-6 text-lg font-light tracking-wider w-full"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                ADD TO CART
              </Button>

              {/* Product Info */}
              <div className="mt-12 pt-8 border-t border-border">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      CRAFTSMANSHIP
                    </p>
                    <p className="text-foreground">Handmade with care</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      DELIVERY
                    </p>
                    <p className="text-foreground">All over Egypt</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 1 && (
            <div>
              <h2 className="text-4xl font-light tracking-wider text-foreground mb-12">
                RELATED PRODUCTS
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {relatedProducts
                  .filter(p => p.id !== product.id)
                  .slice(0, 4)
                  .map(rp => (
                    <div
                      key={rp.id}
                      className="group cursor-pointer"
                      onClick={() => navigate(`/product/${rp.id}`)}
                    >
                      <div className="relative overflow-hidden bg-card rounded-lg mb-6 aspect-square">
                        <ProductImage
                          src={rp.imageUrl}
                          alt={rp.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <h3 className="text-lg font-light tracking-wide text-foreground mb-2">
                        {rp.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {rp.description || "Premium handmade product"}
                      </p>
                      <span className="text-lg font-light text-foreground">
                        EGP {(rp.price / 100).toFixed(2)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </StorefrontLayout>
  );
}
