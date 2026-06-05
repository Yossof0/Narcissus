# Narcissus E-Commerce Website - Project TODO

## Phase 1: Research & Assets
- [x] Research portfolio and gather brand assets
- [ ] Generate brand imagery and handmade product visuals

## Phase 2: Database & Configuration
- [x] Design and implement database schema (products, orders, order items, users)
- [ ] Configure EmailJS secrets and integration (VITE_EMAILJS_PUBLIC_KEY, VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID)
- [x] Write database helper functions and queries

## Phase 3: Core E-Commerce UI
- [x] Build homepage with hero section, featured products, brand story, and animations
- [x] Build product listing page with filters, search, and sorting
- [x] Build product detail page with image gallery and related products
- [x] Implement responsive top navigation with logo, cart icon badge, login/logout

## Phase 4: Shopping Cart & Checkout
- [x] Implement shopping cart as slide-over drawer
- [x] Build checkout page with customer information form
- [x] Delivery location validation (Helwan/Cairo only) — client + server-side messaging
- [x] Integrate EmailJS for order notifications (graceful fallback if not configured)
- [ ] Write tests for cart and checkout functionality

## Phase 5: Admin Panel
- [ ] Build admin dashboard with product management
- [ ] Implement product add/edit/delete functionality
- [ ] Integrate file storage for product images
- [ ] Implement role-based access control (protected routes)
- [ ] Write tests for admin functionality

## Phase 6: Order Confirmation & Polish
- [x] Build order confirmation page
- [x] Add developer credits footer with Yossof's social links
- [ ] Polish animations and transitions
- [x] Ensure mobile-first responsive design across all pages

## Phase 7: Testing & Delivery
- [ ] Run full test suite (vitest)
- [ ] Test all user flows (browse, add to cart, checkout)
- [ ] Test admin panel functionality
- [ ] Verify EmailJS integration
- [ ] Final visual review and polish
- [ ] Create checkpoint and prepare for delivery

## Recent Fixes (this session)
- [x] Removed legacy `<input type="number">` from quantity selector — now pure button controls
- [x] Fixed quantity selector in CartDrawer — button-only, no number inputs
- [x] Fixed sort controls in Products page — replaced radio inputs with buttons
- [x] Product images now degrade gracefully on broken URLs (onError fallback)
- [x] Currency corrected to EGP throughout (was showing $)
- [x] Login/logout wired into storefront Navbar (all pages)
- [x] Cart badge shows live item count in navbar
- [x] Added all missing routes: /products, /product/:id, /checkout, /order-confirmation/:id
- [x] Fixed broken `useMutation` call inside event handler in Checkout
- [x] Delivery location validation: Helwan & Cairo only (Arabic + English)
- [x] Created OrderConfirmation page

## Design System
- Premium, elegant aesthetic with refined typography
- Consistent Narcissus branding throughout
- Smooth animations and micro-interactions
- Mobile-first responsive design
- Luxury and craftsmanship visual language