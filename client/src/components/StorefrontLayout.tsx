import { useState } from "react";
import { Navbar } from "./NavBar";
import { CartDrawer } from "./CartDrawer";

export function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      {/* pt-16 accounts for the fixed navbar height */}
      <div className="pt-16">{children}</div>
    </>
  );
}