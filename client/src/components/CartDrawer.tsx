import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { useLocation } from "wouter";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

function ProductThumb({ src, alt }: { src: string; alt: string }) {
  if (!src) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs bg-muted">
        No image
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      onError={(e) => {
        const el = e.currentTarget;
        el.style.display = "none";
        el.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-xs text-gray-400 bg-gray-100">No image</div>';
      }}
    />
  );
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const [, navigate] = useLocation();

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    onClose();
    navigate("/checkout");
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-border shadow-lg flex flex-col transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
          <h2 className="text-2xl font-light tracking-wider text-foreground">CART</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <p className="text-muted-foreground text-center">Your cart is empty</p>
            </div>
          ) : (
            cart.map((item, index) => (
              <div key={index} className="flex gap-4 pb-6 border-b border-border">
                {/* Image */}
                <div className="w-24 h-24 rounded overflow-hidden bg-card flex-shrink-0">
                  <ProductThumb src={item.image} alt={item.name} />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-light text-foreground mb-1">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      EGP {item.price.toFixed(2)}
                    </p>
                    {item.customizations && item.customizations.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {item.customizations.map((c, i) => (
                          <p key={i} className="text-xs text-muted-foreground">
                            {c.title}: <span className="text-foreground">{c.value}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quantity Controls — buttons only */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(index, Math.max(1, item.quantity - 1))}
                      disabled={item.quantity <= 1}
                      className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-40"
                      aria-label="Decrease"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 text-center text-sm select-none">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(index, item.quantity + 1)}
                      className="p-1 hover:bg-muted rounded transition-colors"
                      aria-label="Increase"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeFromCart(index)}
                      className="ml-auto p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-colors"
                      aria-label="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-border p-6 space-y-4 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="text-xl font-light text-foreground">
                EGP {totalPrice.toFixed(2)}
              </span>
            </div>
            <Button
              onClick={handleCheckout}
              className="w-full bg-foreground text-background hover:bg-foreground/90 py-6 font-light tracking-wider"
            >
              PROCEED TO CHECKOUT
            </Button>
          </div>
        )}
      </div>
    </>
  );
}