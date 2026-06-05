import { useAuth } from "@/_core/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { isAdmin, isOwner } from "@shared/privileges";
import { ShoppingCart, LogOut, LogIn, User, Package, Shield } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  onCartOpen: () => void;
}

export function Navbar({ onCartOpen }: NavbarProps) {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { getTotalItems } = useCart();
  const { t } = useLanguage();
  const cartCount = getTotalItems();

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-background/95 backdrop-blur border-b border-border">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="text-xl font-light tracking-[0.3em] text-foreground hover:text-muted-foreground transition-colors"
        >
          NARCISSUS
        </button>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => navigate("/")}
            className="text-sm font-light tracking-wide text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("home")}
          </button>
          <button
            onClick={() => navigate("/products")}
            className="text-sm font-light tracking-wide text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("shop")}
          </button>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-4">
          {/* Cart */}
          <button
            onClick={onCartOpen}
            className="relative p-2 hover:bg-muted rounded transition-colors"
            aria-label="Open cart"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-foreground text-background text-xs rounded-full w-5 h-5 flex items-center justify-center font-light">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>

          {/* Auth */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1.5 hover:bg-muted rounded-full transition-colors">
                  {user?.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="avatar"
                         className="w-8 h-8 rounded-full object-cover border border-border" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-light">
                      {(user?.user_metadata?.username?.[0] || user?.email?.[0])?.toUpperCase()}
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">
                  {user?.user_metadata?.username || user?.email}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  {t("profile")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/orders")} className="cursor-pointer">
                  <Package className="mr-2 h-4 w-4" />
                  {t("orderHistory")}
                </DropdownMenuItem>
                {isOwner(user?.email) && (
                  <DropdownMenuItem onClick={() => navigate("/owner")} className="cursor-pointer text-amber-600 focus:text-amber-600">
                    <Shield className="mr-2 h-4 w-4" />
                    {t("ownerPanel")}
                  </DropdownMenuItem>
                )}
                {isAdmin(user?.email) && (
                  <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer">
                    <Package className="mr-2 h-4 w-4" />
                    {t("adminPanel")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 font-light tracking-wide"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden md:block">{t("signIn")}</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}