import { authenticatedFetch } from "./utils/api";
import React, { useState, useEffect, useMemo, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  PhoneCall,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, signInWithGoogle, logoutGoogle } from "./firebase";

import { Product, StoreSettings, Order, Banner } from "./types";
import StoreHeader from "./components/StoreHeader";
import ProductCard from "./components/ProductCard";
import CartDrawer from "./components/CartDrawer";
import LoginModal from "./components/LoginModal";
import TrackOrderModal from "./components/TrackOrderModal";
import CustomerOrderHistory from "./components/CustomerOrderHistory";
import WhatsAppButton from "./components/WhatsAppButton";
import CategoryShowcase from "./components/CategoryShowcase";
import MobileBottomNav from "./components/MobileBottomNav";
import { CATEGORIES_DATA } from "./data/categories";

const AdminPanel = lazy(() => import("./components/AdminPanel"));

export default function App() {
  // Server-sync Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: "Neeraj General Store & Hypermarket",
    tagline: "Apna Store, Swadeshi Aur Sasta! Low Prices Everyday.",
    address: "Awadh Market, Jalalpur Panwara, Kannauj",
    pincode: "209727",
    owners: [
      { name: "Neeraj Kumar Dubey", phone: "9876543210" },
      { name: "Dheeraj Kumar Dubey", phone: "9876543211" },
    ],
    deliveryFee: 30,
    freeDeliveryThreshold: 500,
    announcement:
      "🎉 Grand Scheme Offer: Free Delivery in Jalalpur Panwara and adjacent areas for orders above ₹500!",
    upiId: "store@upi",
  });
  const [banners, setBanners] = useState<Banner[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Local Interaction States
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>(
    [],
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Auth States
  const [adminAuthenticated, setAdminAuthenticated] = useState<boolean>(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [customerAuthenticated, setCustomerAuthenticated] =
    useState<boolean>(false);
  const [loginModalType, setLoginModalType] = useState<
    "admin" | "customer" | null
  >(null);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [trackOrderOpen, setTrackOrderOpen] = useState(false);
  const [customerOrderHistoryOpen, setCustomerOrderHistoryOpen] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);

  const [isDraggingProduct, setIsDraggingProduct] = useState(false);
  const [draggedProduct, setDraggedProduct] = useState<Product | null>(null);
  const [cartToast, setCartToast] = useState<string | null>(null);

  // Listen to drag events
  useEffect(() => {
    const handleDragStart = (e: any) => {
      setIsDraggingProduct(true);
      setDraggedProduct(e.detail || null);
    };

    const handleDragEnd = () => {
      setIsDraggingProduct(false);
      setDraggedProduct(null);
    };

    const handleDropped = (e: any) => {
      if (e.detail) {
        handleAddToCart(e.detail);
        showCartToast(`Added ${e.detail.name} to Cart!`);
      }
      setIsDraggingProduct(false);
      setDraggedProduct(null);
    };

    document.addEventListener("product-drag-start", handleDragStart);
    document.addEventListener("product-drag-end", handleDragEnd);
    document.addEventListener("product-dropped-to-cart", handleDropped);

    return () => {
      document.removeEventListener("product-drag-start", handleDragStart);
      document.removeEventListener("product-drag-end", handleDragEnd);
      document.removeEventListener("product-dropped-to-cart", handleDropped);
    };
  }, []);

  const showCartToast = (msg: string) => {
    setCartToast(msg);
    setTimeout(() => {
      setCartToast((curr) => (curr === msg ? null : curr));
    }, 2500);
  };

  // Auth observer subscription conforming to Phase 1 Security Guidelines
  useEffect(() => {
    // Check initial local session first (for mobile phone OTP / PIN)
    const storedAdminToken = localStorage.getItem("admin_session_token");
    const storedAdminEmail = localStorage.getItem("admin_email");
    if (storedAdminToken && storedAdminEmail) {
      setAdminAuthenticated(true);
      setAdminEmail(storedAdminEmail);
    }

    const storedCust = localStorage.getItem("customer_session");
    if (storedCust) {
      try {
        const parsed = JSON.parse(storedCust);
        if (parsed?.name || parsed?.phone) {
          setCustomerAuthenticated(true);
          setCustomerName(parsed.name || `Customer ${parsed.phone ? parsed.phone.slice(-4) : ''}`);
        }
      } catch (e) {
        // ignore JSON parse error
      }
    }

    // Optional Firebase session check
    try {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setCustomerAuthenticated(true);
          setCustomerName(user.displayName || user.email);
        }
      });
      return () => unsubscribe();
    } catch (e) {
      // Firebase optional
    }
  }, []);

  // Timer loop for auto-cycling banners (Phase 6)
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIdx((prev) => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [banners]);

  // Handle reorder custom event (Phase 5)
  useEffect(() => {
    const handleReorder = (e: Event) => {
      const items = (e as CustomEvent).detail;
      if (items && Array.isArray(items)) {
        setCart((prev) => {
          const updated = [...prev];
          items.forEach((item) => {
            const p = products.find((prod) => prod.id === item.productId);
            if (p) {
              const idx = updated.findIndex((cartItem) => cartItem.product.id === p.id);
              if (idx !== -1) {
                updated[idx].quantity = Math.min(p.stock, updated[idx].quantity + item.quantity);
              } else {
                updated.push({ product: p, quantity: Math.min(p.stock, item.quantity) });
              }
            }
          });
          return updated;
        });
        setIsCartOpen(true);
      }
    };
    document.addEventListener("reorder-items", handleReorder);
    return () => document.removeEventListener("reorder-items", handleReorder);
  }, [products]);

  useEffect(() => {
    const handleOpenTrack = () => setTrackOrderOpen(true);
    const handleOpenHistory = () => setCustomerOrderHistoryOpen(true);
    document.addEventListener("open-track-order", handleOpenTrack);
    document.addEventListener("open-customer-orders", handleOpenHistory);
    return () => {
      document.removeEventListener("open-track-order", handleOpenTrack);
      document.removeEventListener("open-customer-orders", handleOpenHistory);
    };
  }, []);

  // Load initial dataset from server APIs with secure admin headers if verified
  const fetchAllData = async () => {
    try {
      setFetchError(null);
      setIsLoading(true);

      const timestamp = new Date().getTime();
      // Products, settings, banners lists are fully public
      const [prodsRes, settingsRes, bannersRes] = await Promise.all([
        authenticatedFetch(`/api/products?t=${timestamp}`),
        authenticatedFetch(`/api/settings?t=${timestamp}`),
        authenticatedFetch(`/api/banners?t=${timestamp}`)
      ]);

      if (prodsRes.ok) {
         const productsData = await prodsRes.json();
         setProducts(productsData);
      } else {
         throw new Error(`Products fetch failed: ${prodsRes.status}`);
      }
      
      if (settingsRes.ok) setSettings(await settingsRes.json());
      if (bannersRes.ok) setBanners(await bannersRes.json());

      const ordersUrl = `/api/orders?t=${timestamp}`;
      const ordersRes = await authenticatedFetch(ordersUrl);
      if (ordersRes.ok) {
         setOrders(await ordersRes.json());
      } else if (ordersRes.status === 401 || ordersRes.status === 403) {
         // Guest / unauthenticated users don't have order sync
         setOrders([]);
      } else {
         throw new Error(`Orders fetch failed: ${ordersRes.status}`);
      }

    } catch (err: any) {
      console.error(
        "Connection to NGS database failed. Loading fallback storage engine.",
        err
      );
      setFetchError(err.message || String(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [adminEmail, customerName]);

  // Sync cart counter and total
  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart],
  );

  // Handle product addition to dynamic basket
  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id);
      if (idx !== -1) {
        // limit count to product stock limit
        const updated = [...prev];
        const newQty = Math.min(product.stock, updated[idx].quantity + 1);
        updated[idx] = { ...updated[idx], quantity: newQty };
        return updated;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleRemoveOneFromCart = (productId: string) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === productId);
      if (idx !== -1) {
        const updated = [...prev];
        if (updated[idx].quantity <= 1) {
          return updated.filter((item) => item.product.id !== productId);
        }
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity - 1 };
        return updated;
      }
      return prev;
    });
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === productId);
      if (idx !== -1) {
        const updated = [...prev];
        const stockLimit = updated[idx].product.stock;
        updated[idx] = {
          ...updated[idx],
          quantity: Math.min(stockLimit, quantity),
        };
        return updated;
      }
      return prev;
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.isAvailable && !isAdmin) return false;
      const term = (searchQuery || "").toLowerCase().trim();
      const pCat = p.category || "";
      const matchesCategory = selectedCategory === "all" || pCat === selectedCategory;
      
      const pName = p.name || "";
      const pHindi = p.hindiName || "";
      
      const matchesSearch =
        !term ||
        pName.toLowerCase().includes(term) ||
        pHindi.toLowerCase().includes(term) ||
        pCat.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery, isAdmin]);

  // Popular and highlight items
  const popularProducts = useMemo(() => {
    return products.filter((p) => p.isPopular && (isAdmin || p.isAvailable));
  }, [products, isAdmin]);

  const handleAdminToggle = () => {
    if (isAdmin) {
      setIsAdmin(false);
    } else {
      if (adminAuthenticated) {
        setIsAdmin(true);
      } else {
        setLoginModalType("admin");
      }
    }
  };

  const handleCustomerLoginToggle = async () => {
    if (customerAuthenticated || adminAuthenticated) {
      localStorage.removeItem("customer_session_token");
      localStorage.removeItem("customer_session");
      localStorage.removeItem("admin_session_token");
      localStorage.removeItem("admin_email");
      try {
        await logoutGoogle();
      } catch (e) {}
      setCustomerAuthenticated(false);
      setCustomerName(null);
      setAdminAuthenticated(false);
      setAdminEmail(null);
      setIsAdmin(false);
      fetchAllData();
    } else {
      setLoginModalType("customer");
    }
  };

  const handleLoginSuccess = (data: any) => {
    if (loginModalType === "admin" || data.role === "admin") {
      setAdminAuthenticated(true);
      setAdminEmail(data.email || "dubeyavinash157@gmail.com");
      setIsAdmin(true);
    } else {
      setCustomerAuthenticated(true);
      setCustomerName(data.name || `Customer ${data.phone ? data.phone.slice(-4) : ''}`);
    }
    setLoginModalType(null);
    fetchAllData();
  };

  return (
    <div
      className="min-h-screen bg-canvas text-[#F9FAFB] flex flex-col font-sans"
      id="app-root"
    >
      {fetchError && (
        <div className="bg-red-500/20 text-red-500 p-4 border-b border-red-500/50">
          <p className="font-bold">Initialization Error:</p>
          <p>{fetchError}</p>
        </div>
      )}

      {/* Header bar and promotional banner displays */}
      <StoreHeader
        settings={settings}
        banners={banners}
        cartCount={cartCount}
        onCartClick={() => setIsCartOpen(true)}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        onAdminToggle={handleAdminToggle}
        isAdmin={isAdmin}
        adminAuthenticated={adminAuthenticated}
        customerName={customerName}
        onCustomerLogin={handleCustomerLoginToggle}
      />

      {loginModalType && (
        <LoginModal
          type={loginModalType}
          onClose={() => setLoginModalType(null)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {trackOrderOpen && (
        <TrackOrderModal onClose={() => setTrackOrderOpen(false)} />
      )}

      {customerOrderHistoryOpen && (
        <CustomerOrderHistory onClose={() => setCustomerOrderHistoryOpen(false)} />
      )}

      {/* Main Container */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm font-semibold text-brand-muted mt-3 uppercase tracking-widest text-[#9CA3AF]">
            Initializing Workspace...
          </p>
        </div>
      ) : isAdmin ? (
        /* ADMIN CONFIGURATION SHEETS */
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1"
        >
          {/* Admin Header Bar to easily return to store */}
          <div className="sticky top-0 z-50 bg-[#16161a]/95 backdrop-blur-md border-b border-amber-500/30 px-3 sm:px-6 py-2.5 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span className="text-xs sm:text-sm font-bold text-amber-400 uppercase tracking-wider">
                Store Admin Portal Active
              </span>
              <span className="hidden md:inline text-xs text-zinc-400 font-mono">
                • {adminEmail || "Store Owner"}
              </span>
            </div>
            <button
              onClick={() => setIsAdmin(false)}
              className="bg-white hover:bg-zinc-200 text-black px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
            >
              <span>← Return to Store</span>
            </button>
          </div>

          <Suspense fallback={
            <div className="flex-1 flex items-center justify-center min-h-[50vh]">
              <div className="flex flex-col items-center gap-4">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-[#A1A1AA] font-mono tracking-widest uppercase">Loading Secure Console</p>
              </div>
            </div>
          }>
            <AdminPanel
              products={products}
              settings={settings}
              orders={orders}
              banners={banners}
              onUpdateProducts={fetchAllData}
              onUpdateSettings={setSettings}
              onUpdateOrders={fetchAllData}
              onUpdateBanners={fetchAllData}
            />
          </Suspense>
        </motion.main>
      ) : (
        /* RETAIL CUSTOMER PORTAL */
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-10 space-y-6 sm:space-y-10 lg:space-y-14 pb-24 sm:pb-12">
          {/* Promotional Banners */}
          {banners.length > 0 && selectedCategory === "all" && !searchQuery && (
            <section className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden group border border-border-subtle shadow-xl aspect-[16/9] sm:aspect-[24/9] md:aspect-[32/9] bg-surface">
              <AnimatePresence mode="wait">
                {banners.map((banner, idx) => {
                  if (idx !== currentBannerIdx) return null;
                  return (
                    <motion.div
                      key={banner.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.02 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="absolute inset-0 w-full h-full"
                    >
                      <img
                        src={banner.imageUrl}
                        alt={banner.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/40 to-transparent flex flex-col justify-end px-4 sm:px-8 md:px-12 pb-4 sm:pb-8 md:pb-10">
                        <h2 className="text-base sm:text-2xl md:text-3xl font-bold text-white tracking-tight mb-1 sm:mb-2 max-w-lg drop-shadow">
                          {banner.title}
                        </h2>
                        {banner.subtitle && (
                          <p className="text-[11px] sm:text-sm text-zinc-300 max-w-sm drop-shadow font-medium leading-relaxed">
                            {banner.subtitle}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Slider Dots */}
              {banners.length > 1 && (
                <div className="absolute bottom-3 right-4 sm:bottom-4 sm:right-6 flex gap-1.5 z-20">
                  {banners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentBannerIdx(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                      className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full cursor-pointer transition-all duration-300 ${
                        idx === currentBannerIdx ? "bg-primary w-3.5 sm:w-4" : "bg-white/40"
                      }`}
                    ></button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Visual Category Showcase Grid */}
          {!searchQuery && (
            <div id="category-showcase-section">
              <CategoryShowcase
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                products={products}
              />
            </div>
          )}

          {/* Highlight Popular Products Section */}
          {popularProducts.length > 0 &&
            !searchQuery &&
            selectedCategory === "all" && (
              <section className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3 sm:pb-4">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base sm:text-xl font-bold text-zinc-100 flex items-center gap-2">
                      Premium Goods
                    </h3>
                    <span className="bg-surface text-primary border border-primary/20 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest shadow-sm">
                      Featured
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4 md:gap-5">
                  {popularProducts.slice(0, 5).map((p) => {
                    const cartItem = cart.find(
                      (item) => item.product.id === p.id,
                    );
                    return (
                      <ProductCard
                        key={p.id}
                        product={p}
                        cartQuantity={cartItem ? cartItem.quantity : 0}
                        onAddToCart={handleAddToCart}
                        onRemoveOneFromCart={handleRemoveOneFromCart}
                      />
                    );
                  })}
                </div>
              </section>
            )}

          {/* Core Grid Listing Section */}
          <section className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3 sm:pb-4">
              <div className="flex items-center gap-2.5">
                {selectedCategory !== "all" && (
                  <span className="text-xl sm:text-2xl">
                    {CATEGORIES_DATA.find((c) => c.code === selectedCategory)?.icon || "📦"}
                  </span>
                )}
                <h3 className="text-base sm:text-xl font-bold text-zinc-100 flex items-center gap-2">
                  <span>
                    {selectedCategory === "all"
                      ? "Explore All Catalog"
                      : `${selectedCategory} Department`}
                  </span>
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {selectedCategory !== "all" && (
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className="text-[11px] text-zinc-400 hover:text-white bg-surface hover:bg-white/10 px-2.5 py-1 rounded-md border border-border-subtle cursor-pointer transition-colors"
                  >
                    Clear Filter ✕
                  </button>
                )}
                <span className="text-[11px] sm:text-[12px] bg-surface text-zinc-400 font-mono px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-md border border-border-subtle uppercase tracking-widest shadow-sm">
                  {filteredProducts.length} items
                </span>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="py-16 sm:py-24 text-center bg-surface border border-border-subtle rounded-2xl sm:rounded-3xl flex flex-col items-center shadow-sm px-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-canvas rounded-2xl flex items-center justify-center border border-border-subtle mb-4 sm:mb-6">
                  <span className="text-2xl opacity-60">🔎</span>
                </div>
                <h4 className="font-semibold text-zinc-100 text-lg sm:text-xl tracking-tight">
                  No matched items found
                </h4>
                <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-sm leading-relaxed">
                  We couldn't locate anything matching your criteria. Double-check your filters or try a broader search term.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                  className="mt-6 sm:mt-8 text-xs sm:text-sm font-semibold text-black bg-white hover:bg-zinc-200 px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl transition-all shadow-md active:scale-95"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4 md:gap-5">
                {filteredProducts.map((p) => {
                  const cartItem = cart.find(
                    (item) => item.product.id === p.id,
                  );
                  return (
                    <ProductCard
                      key={p.id}
                      product={p}
                      cartQuantity={cartItem ? cartItem.quantity : 0}
                      onAddToCart={handleAddToCart}
                      onRemoveOneFromCart={handleRemoveOneFromCart}
                    />
                  );
                })}
              </div>
            )}
          </section>

          {/* Quick Informational Cards segment */}
          <section className="glass-panel p-5 sm:p-8 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8 pb-6 sm:pb-10">
            <div className="flex gap-3.5 sm:gap-4 items-start">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 backdrop-blur-sm text-lg sm:text-xl">
                🚚
              </div>
              <div>
                <h4 className="font-medium text-xs sm:text-sm text-white tracking-wide">
                  Fast Delivery
                </h4>
                <p className="text-xs sm:text-[13px] text-[#9CA3AF] mt-1 sm:mt-1.5 leading-relaxed">
                  Reliable delivery directly to your door in Kannauj.
                </p>
              </div>
            </div>

            <div className="flex gap-3.5 sm:gap-4 items-start">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 backdrop-blur-sm text-lg sm:text-xl">
                ✨
              </div>
              <div>
                <h4 className="font-medium text-xs sm:text-sm text-white tracking-wide">
                  Premium Quality
                </h4>
                <p className="text-xs sm:text-[13px] text-[#9CA3AF] mt-1 sm:mt-1.5 leading-relaxed">
                  Carefully sourced groceries, electronics & clothing items.
                </p>
              </div>
            </div>

            <div className="flex gap-3.5 sm:gap-4 items-start">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 backdrop-blur-sm text-lg sm:text-xl">
                🛡️
              </div>
              <div>
                <h4 className="font-medium text-xs sm:text-sm text-white tracking-wide">
                  Secure Checkout & UPI
                </h4>
                <p className="text-xs sm:text-[13px] text-[#9CA3AF] mt-1 sm:mt-1.5 leading-relaxed">
                  Safe Cash on Delivery and instant UPI payment.
                </p>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* Slide-out Basket Cart drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onAddToCart={handleAddToCart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveItem}
        settings={settings}
        onOrderPlaced={fetchAllData}
        onClearCart={handleClearCart}
        customerName={customerName}
      />

      {/* Floating Drag & Drop Drop Dock Target */}
      {isDraggingProduct && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }}
          onDrop={(e) => {
            e.preventDefault();
            try {
              const raw = e.dataTransfer.getData("application/json");
              if (raw) {
                const product = JSON.parse(raw);
                handleAddToCart(product);
                showCartToast(`Added ${product.name} to Cart!`);
              }
            } catch (err) {
              console.error(err);
            }
          }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#16161a]/95 backdrop-blur-md border-2 border-dashed border-[#FF6B00] text-white px-6 py-3.5 rounded-2xl shadow-[0_10px_40px_rgba(255,107,0,0.35)] flex items-center gap-3 animate-bounce cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            🛒
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-white tracking-tight">
              Drop item here to Add to Cart!
            </p>
            {draggedProduct && (
              <p className="text-[10px] text-zinc-400 font-mono truncate max-w-xs">
                {draggedProduct.name} (₹{draggedProduct.price})
              </p>
            )}
          </div>
        </div>
      )}

      {/* Instant Toast Notification */}
      {cartToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#151518] text-white border border-emerald-500/40 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
            ✓
          </span>
          <span>{cartToast}</span>
        </div>
      )}

      {/* WhatsApp Floating Chat Button */}
      <WhatsAppButton phoneNumber="9935118811" storeName={settings.storeName} />

      {/* Page Footer */}
      <footer
        className="border-t border-white/5 bg-[#0B1020] text-[#9CA3AF] pb-20 sm:pb-0"
        id="store-footer"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 text-[13px] leading-relaxed">
          {/* Logo Brand information */}
          <div className="space-y-4 sm:space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-orange-400 flex items-center justify-center text-white font-black text-xs shadow-lg">
                NGS
              </div>
              <span className="font-medium text-white text-base sm:text-lg tracking-tight">
                {settings.storeName}
              </span>
            </div>
            <p className="text-[#9CA3AF] text-xs sm:text-sm leading-relaxed max-w-xs">
              {settings.tagline}
            </p>
          </div>

          {/* Location details */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-white font-medium text-[11px] sm:text-[12px] uppercase tracking-widest">
              Store Location & Contact
            </h4>
            <div className="space-y-2 text-[#9CA3AF] text-xs sm:text-sm">
              <p className="font-medium text-white">
                {settings.address}, {settings.pincode}
              </p>
              <p className="text-zinc-300">
                Phone / WhatsApp: <a href="tel:+919935118811" className="text-primary hover:underline font-semibold">+91 9935118811</a>
              </p>
              <div className="pt-2">
                <span className="font-mono block text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-0.5">
                  Store Hours:
                </span>
                <span className="font-medium text-white">
                  7:00 AM to 10:00 PM Daily
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Copy lines & Admin quick link - Sole location for Admin Access */}
        <div className="border-t border-white/5 py-5 flex flex-col sm:flex-row items-center justify-between px-4 sm:px-8 text-center sm:text-left gap-3">
          <p className="text-[11px] text-[#9CA3AF]/60 font-mono">
            {new Date().getFullYear()} © {settings.storeName}. All rights reserved.
          </p>
          <button
            onClick={handleAdminToggle}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/20 transition-all cursor-pointer shadow-sm"
          >
            <span>🛡️</span>
            <span>{isAdmin ? "Exit to Customer View" : "Store Admin Portal (एडमिन)"}</span>
          </button>
        </div>
      </footer>

      {/* Modern Sticky Bottom Navigation Bar for Mobile Devices */}
      {!isAdmin && (
        <MobileBottomNav
          cartCount={cartCount}
          cartTotal={cartTotal}
          onCartClick={() => setIsCartOpen(true)}
          onTrackClick={() => setTrackOrderOpen(true)}
          onOrdersClick={() => setCustomerOrderHistoryOpen(true)}
          onLoginClick={handleCustomerLoginToggle}
          onHomeClick={() => {
            setSelectedCategory("all");
            setSearchQuery("");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onCategoriesClick={() => {
            const el = document.getElementById("category-showcase-section");
            if (el) {
              el.scrollIntoView({ behavior: "smooth" });
            } else {
              setSelectedCategory("all");
            }
          }}
          customerName={customerName}
          selectedCategory={selectedCategory}
        />
      )}
    </div>
  );
}
