import React from "react";
import { Store, LayoutGrid, PackageSearch, ShoppingBag, User, Clock } from "lucide-react";
import { StoreSettings } from "../types";

interface MobileBottomNavProps {
  cartCount: number;
  cartTotal?: number;
  onCartClick: () => void;
  onTrackClick: () => void;
  onOrdersClick: () => void;
  onLoginClick: () => void;
  onHomeClick: () => void;
  onCategoriesClick: () => void;
  customerName?: string | null;
  selectedCategory: string;
}

export default function MobileBottomNav({
  cartCount,
  cartTotal = 0,
  onCartClick,
  onTrackClick,
  onOrdersClick,
  onLoginClick,
  onHomeClick,
  onCategoriesClick,
  customerName,
  selectedCategory,
}: MobileBottomNavProps) {
  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0e0e12]/95 backdrop-blur-xl border-t border-white/10 px-2 py-2 shadow-[0_-8px_30px_rgba(0,0,0,0.6)]">
      <div className="flex items-center justify-around">
        {/* 1. Store / Home */}
        <button
          onClick={onHomeClick}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-colors cursor-pointer ${
            selectedCategory === "all" ? "text-primary font-bold" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Store className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Store</span>
        </button>

        {/* 2. Categories */}
        <button
          onClick={onCategoriesClick}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-colors cursor-pointer ${
            selectedCategory !== "all" ? "text-primary font-bold" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <LayoutGrid className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Categories</span>
        </button>

        {/* 3. Cart - Center Highlighted */}
        <button
          onClick={onCartClick}
          className="flex flex-col items-center justify-center flex-1 py-1 px-1 relative transition-all cursor-pointer group active:scale-95"
        >
          <div className="relative">
            <div className={`p-2 rounded-xl transition-all ${cartCount > 0 ? "bg-primary text-black shadow-[0_0_15px_rgba(255,107,0,0.4)]" : "bg-white/10 text-white"}`}>
              <ShoppingBag className="w-4 h-4" />
            </div>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-black text-white font-bold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-primary">
                {cartCount}
              </span>
            )}
          </div>
          <span className={`text-[10px] mt-0.5 font-bold ${cartCount > 0 ? "text-primary" : "text-zinc-400"}`}>
            {cartCount > 0 && cartTotal > 0 ? `₹${cartTotal}` : "Cart"}
          </span>
        </button>

        {/* 4. Track Order */}
        <button
          onClick={onTrackClick}
          className="flex flex-col items-center justify-center flex-1 py-1 px-1 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <PackageSearch className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Track</span>
        </button>

        {/* 5. Account / Orders */}
        {customerName ? (
          <button
            onClick={onOrdersClick}
            className="flex flex-col items-center justify-center flex-1 py-1 px-1 text-zinc-400 hover:text-primary transition-colors cursor-pointer"
          >
            <Clock className="w-5 h-5 mb-0.5 text-primary" />
            <span className="text-[10px] tracking-tight text-white truncate max-w-[50px]">
              Orders
            </span>
          </button>
        ) : (
          <button
            onClick={onLoginClick}
            className="flex flex-col items-center justify-center flex-1 py-1 px-1 text-zinc-400 hover:text-primary transition-colors cursor-pointer"
          >
            <User className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Login</span>
          </button>
        )}
      </div>
    </div>
  );
}
