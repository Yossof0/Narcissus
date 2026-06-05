import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useLocation } from "wouter";
import { StorefrontLayout } from "@/components/StorefrontLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { FaFacebook, FaInstagram, FaGithub, FaYoutube, FaGlobe } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category: string;
  imageUrl: string | null;
  imageKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function ProductImage({ src, alt }: { src: string | null; alt: string }) {
  const [errored, setErrored] = useState(false);
  if (!src || errored) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <span className="text-muted-foreground text-sm">No image</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setErrored(true)}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
    />
  );
}

export default function Home() {
  const [, navigate] = useLocation();
  const { t, isRTL } = useLanguage();
  const { data: products = [] } = trpc.products.list.useQuery();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (products && products.length > 0) setFeaturedProducts(products.slice(0, 4));
  }, [products]);

  const handleProductClick = (productId: number) => navigate(`/product/${productId}`);
  const handleShopNow = () => navigate("/products");

  return (
    <StorefrontLayout>
      <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
        {/* Hero Section */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('https://d2xsxph8kpxj0f.cloudfront.net/310519663626115847/36DfMmTaZPiXT6u9dxqmKo/narcissus-hero-fP7hJmzvcorimRxgYEvbiF.webp')`,
              opacity: 0.4,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />

          <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
            <h1 className="text-5xl md:text-7xl font-light tracking-wider mb-6 text-foreground">
              NARCISSUS
            </h1>
            <p className="text-xl md:text-2xl font-light text-muted-foreground mb-4 tracking-wide">
              HANDMADE WITH DEVOTION
            </p>
            <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              Timeless creations, carefully handmade for a life of quiet luxury. Each piece tells a story of craftsmanship and elegance.
            </p>
            <Button
              onClick={handleShopNow}
              className="bg-foreground text-background hover:bg-foreground/90 px-12 py-6 text-lg font-light tracking-wider"
            >
              DISCOVER COLLECTION
            </Button>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-24 bg-background">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-light tracking-wider mb-4 text-foreground">
                FEATURED COLLECTION
              </h2>
              <div className="w-16 h-px bg-accent mx-auto" />
            </div>

            {featuredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {featuredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="group cursor-pointer"
                    onClick={() => handleProductClick(product.id)}
                  >
                    <div className="relative overflow-hidden bg-card rounded-lg mb-6 aspect-square">
                      <ProductImage src={product.imageUrl} alt={product.name} />
                    </div>
                    <h3 className="text-lg font-light tracking-wide text-foreground mb-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {product.description || "Premium handmade product"}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-light text-foreground">
                        EGP {(product.price / 100).toFixed(2)}
                      </span>
                      <ShoppingCart className="w-5 h-5 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t("noProducts")}</p>
              </div>
            )}

            <div className="text-center mt-16">
              <Button
                onClick={handleShopNow}
                variant="outline"
                className="px-12 py-6 text-lg font-light tracking-wider"
              >
                VIEW ALL PRODUCTS
              </Button>
            </div>
          </div>
        </section>

        {/* Brand Story */}
        <section className="py-24 bg-card">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-light tracking-wider mb-8 text-foreground">
                  OUR STORY
                </h2>
                <div className="w-16 h-px bg-accent mb-8" />
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  Narcissus was born from a passion for handcrafted excellence. Each piece in our collection is meticulously created by skilled artisans who believe in the power of slow, intentional making.
                </p>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  We celebrate the beauty of imperfection, the warmth of natural materials, and the timeless elegance that comes from true craftsmanship.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Our commitment is simple: to create pieces that inspire, endure, and bring quiet luxury into your everyday life.
                </p>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-lg overflow-hidden">
                  <img
                    src="https://d2xsxph8kpxj0f.cloudfront.net/310519663626115847/36DfMmTaZPiXT6u9dxqmKo/narcissus-product-1-TjMRNPRHNYYunibGpjwUB9.webp"
                    alt="Narcissus craftsmanship"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-background">
          <div className="container text-center">
            <h2 className="text-4xl md:text-5xl font-light tracking-wider mb-8 text-foreground">
              EXPLORE HANDMADE LUXURY
            </h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Discover our complete collection of premium handcrafted products
            </p>
            <Button
              onClick={handleShopNow}
              className="bg-foreground text-background hover:bg-foreground/90 px-12 py-6 text-lg font-light tracking-wider"
            >
              SHOP NOW
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 bg-card border-t border-border">
          <div className="container text-center">
            <p className="text-sm text-muted-foreground font-light tracking-wide mb-6">
              © 2025 NARCISSUS · Handmade with devotion · Cairo, Egypt
            </p>

            {/* Narcissus Brand Socials */}
            <p className="text-xs text-muted-foreground tracking-widest mb-3 uppercase">Narcissus</p>
            <div className="flex items-center justify-center gap-5 mb-6">
              <a href="https://www.facebook.com/share/14NJiWxqYW5/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer"
                 className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Narcissus Facebook">
                <FaFacebook size={20} />
              </a>
              <a href="https://www.instagram.com/narcissus.brand?igsh=NWhwenE4ZGZxczM5" target="_blank" rel="noopener noreferrer"
                 className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Narcissus Instagram">
                <FaInstagram size={20} />
              </a>
            </div>

            {/* Developer Socials */}
            <p className="text-xs text-muted-foreground tracking-widest mb-3 uppercase">Developer</p>
            <div className="flex items-center justify-center gap-5 mb-6">
              <a href="https://github.com/yossof0" target="_blank" rel="noopener noreferrer"
                 className="text-muted-foreground hover:text-foreground transition-colors" aria-label="GitHub">
                <FaGithub size={20} />
              </a>
              <a href="https://yossof0.github.io" target="_blank" rel="noopener noreferrer"
                 className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Portfolio">
                <FaGlobe size={20} />
              </a>
              <a href="https://youtube.com/@OverClock33" target="_blank" rel="noopener noreferrer"
                 className="text-muted-foreground hover:text-foreground transition-colors" aria-label="YouTube">
                <FaYoutube size={20} />
              </a>
              <a href="https://x.com/OverClock33" target="_blank" rel="noopener noreferrer"
                 className="text-muted-foreground hover:text-foreground transition-colors" aria-label="X">
                <FaXTwitter size={20} />
              </a>
              <a href="https://facebook.com/YossofABD" target="_blank" rel="noopener noreferrer"
                 className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Facebook">
                <FaFacebook size={20} />
              </a>
            </div>

            <p className="text-xs text-muted-foreground">
              Crafted by{" "}
              <a href="https://yossof0.github.io" target="_blank" rel="noopener noreferrer"
                 className="underline hover:text-foreground transition-colors">
                Yossof0
              </a>
            </p>
          </div>
        </footer>
      </div>
    </StorefrontLayout>
  );
}