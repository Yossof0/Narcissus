import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Search, Heart, Tag } from "lucide-react";
import { useLocation } from "wouter";
import { StorefrontLayout } from "@/components/StorefrontLayout";
import { useFavorites } from "@/_core/hooks/useFavorites";
import { useLanguage } from "@/contexts/LanguageContext";
import { getEffectiveDiscount, calculateDiscountedPrice, formatDiscount } from "@shared/discount";

function ProductImage({ src, alt }: { src: string | null; alt: string }) {
  const [errored, setErrored] = useState(false);
  const { t } = useLanguage();
  if (!src || errored) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <span className="text-muted-foreground text-sm">{t("noImage")}</span>
      </div>
    );
  }
  return <img src={src} alt={alt} onError={() => setErrored(true)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />;
}

export default function Products() {
  const [, navigate] = useLocation();
  const { t, isRTL } = useLanguage();
  const { data: products = [], isLoading } = trpc.products.list.useQuery();
  const { data: majorDiscount } = trpc.discounts.getMajor.useQuery();
  const { toggleFavorite, isFavorite, favorites } = useFavorites();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high" | "top-rated">("newest");
  const [discountedFirst, setDiscountedFirst] = useState(false);

  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category))).sort(), [products]);

  // Recommended: products related to favorites or high-rated products
  const recommended = useMemo(() => {
    if (!favorites.length) return [];
    const favProducts = products.filter(p => favorites.includes(p.id));
    const favCategories = new Set(favProducts.map(p => p.category));
    return products
      .filter(p => !favorites.includes(p.id) && favCategories.has(p.category))
      .slice(0, 4);
  }, [products, favorites]);

  const filteredProducts = useMemo(() => {
    let filtered = products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchCat = !selectedCategory || p.category === selectedCategory;
      return matchSearch && matchCat;
    });

    // Sort
    if (sortBy === "price-low") filtered.sort((a, b) => a.price - b.price);
    else if (sortBy === "price-high") filtered.sort((a, b) => b.price - a.price);
    else if (sortBy === "top-rated") filtered.sort((a, b) => ((b as any).avgRating ?? 0) - ((a as any).avgRating ?? 0));
    else filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Discounted first
    if (discountedFirst) {
      filtered.sort((a, b) => {
        const aHas = !!(a as any).discountType || majorDiscount;
        const bHas = !!(b as any).discountType || majorDiscount;
        return (bHas ? 1 : 0) - (aHas ? 1 : 0);
      });
    }

    return filtered;
  }, [products, searchTerm, selectedCategory, sortBy, discountedFirst, majorDiscount]);

  const discountedCount = useMemo(() =>
      filteredProducts.filter(p => getEffectiveDiscount(p as any, majorDiscount ?? null)).length,
    [filteredProducts, majorDiscount]
  );

  const ProductCard = ({ product }: { product: any }) => {
    const discount = getEffectiveDiscount(product, majorDiscount ?? null);
    const finalPrice = discount ? calculateDiscountedPrice(product.price, discount) : product.price;

    return (
      <div className="group cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
        <div className="relative overflow-hidden bg-card rounded-lg mb-4 aspect-square">
          <ProductImage src={product.imageUrl} alt={product.name} />
          {/* Favorite button */}
          <button
            onClick={e => { e.stopPropagation(); toggleFavorite(product.id); }}
            className={`absolute top-2 ${isRTL ? "left-2" : "right-2"} p-1.5 rounded-full backdrop-blur-sm transition-colors ${
              isFavorite(product.id) ? "bg-red-50 text-red-500" : "bg-white/70 text-gray-400 hover:text-red-400"
            }`}
          >
            <Heart className="w-4 h-4" fill={isFavorite(product.id) ? "currentColor" : "none"} />
          </button>
          {/* Discount badge */}
          {discount && (
            <div className={`absolute top-2 ${isRTL ? "right-2" : "left-2"} bg-red-500 text-white text-xs px-2 py-1 rounded font-light`}>
              {formatDiscount(discount)}
            </div>
          )}
        </div>
        <h3 className="text-base font-light tracking-wide text-foreground mb-1">{product.name}</h3>
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{product.description || ""}</p>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-base font-light text-foreground">EGP {(finalPrice / 100).toFixed(2)}</span>
            {discount && (
              <span className="ml-2 text-xs text-muted-foreground line-through">EGP {(product.price / 100).toFixed(2)}</span>
            )}
          </div>
          <ShoppingCart className="w-4 h-4 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        {(product.avgRating ?? 0) > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-amber-400 text-xs">★</span>
            <span className="text-xs text-muted-foreground">{(product.avgRating ?? 0).toFixed(1)}</span>
          </div>
        )}
      </div>
    );
  };

  const sortOptions: { value: typeof sortBy; label: string }[] = [
    { value: "newest", label: t("newest") },
    { value: "price-low", label: t("priceLow") },
    { value: "price-high", label: t("priceHigh") },
    { value: "top-rated", label: t("topRated") },
  ];

  return (
    <StorefrontLayout>
      <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
        {/* Header */}
        <div className="bg-card py-12 border-b border-border">
          <div className="container">
            <h1 className="text-5xl font-light tracking-wider text-foreground mb-2">{t("shop")}</h1>
            <div className="w-16 h-px bg-accent" />
          </div>
        </div>

        {/* Recommended */}
        {recommended.length > 0 && (
          <div className="bg-muted/30 py-8 border-b border-border">
            <div className="container">
              <h2 className="text-sm font-light tracking-widest text-muted-foreground mb-6">{t("recommended")}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {recommended.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          </div>
        )}

        <div className="container py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-20 space-y-8">
                {/* Search */}
                <div>
                  <label className="block text-sm font-light tracking-wide text-foreground mb-4">{t("searchLabel")}</label>
                  <div className="relative">
                    <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                           placeholder={t("searchPlaceholder")} className={isRTL ? "pr-10" : "pl-10"} />
                    <Search className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-light tracking-wide text-foreground mb-4">{t("categoryLabel")}</label>
                  <div className="space-y-1">
                    <button onClick={() => setSelectedCategory(null)}
                            className={`block w-full text-${isRTL ? "right" : "left"} px-3 py-2 rounded text-sm transition-colors ${!selectedCategory ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                      {t("allProducts")}
                    </button>
                    {categories.map(cat => (
                      <button key={cat} onClick={() => setSelectedCategory(cat)}
                              className={`block w-full text-${isRTL ? "right" : "left"} px-3 py-2 rounded text-sm transition-colors ${selectedCategory === cat ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-sm font-light tracking-wide text-foreground mb-4">{t("sortByLabel")}</label>
                  <div className="space-y-1">
                    {sortOptions.map(opt => (
                      <button key={opt.value} onClick={() => setSortBy(opt.value)}
                              className={`block w-full text-${isRTL ? "right" : "left"} px-3 py-2 rounded text-sm transition-colors ${sortBy === opt.value ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Discounted first */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={discountedFirst} onChange={e => setDiscountedFirst(e.target.checked)} className="w-4 h-4" />
                  <span className="text-sm font-light text-muted-foreground">{t("discountedFirst")}</span>
                </label>
              </div>
            </div>

            {/* Products Grid */}
            <div className="lg:col-span-3">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-square bg-muted rounded-lg mb-4" />
                      <div className="h-4 bg-muted rounded mb-2 w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-24 text-muted-foreground">{t("noProducts")}</div>
              ) : (
                <>
                  <div className="mb-6 text-sm text-muted-foreground flex items-center gap-2">
                    <span>{t("showing")} {filteredProducts.length} {t("productsText")}</span>
                    {discountedCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-red-500" />
                        {discountedCount} {t("onDiscount")}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {filteredProducts.map(p => <ProductCard key={p.id} product={p} />)}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}