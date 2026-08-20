import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  ShoppingCart,
  UserCheck,
  ShieldAlert,
  PackageSearch,
  Clock,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Sparkles,
  X,
} from "lucide-react";
import { StoreSettings, Banner } from "../types";
import { CATEGORIES_DATA, CategoryItem } from "../data/categories";

interface StoreHeaderProps {
  settings: StoreSettings;
  banners: Banner[];
  cartCount: number;
  onCartClick: () => void;
  onSearchChange: (search: string) => void;
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  onAdminToggle: () => void;
  isAdmin: boolean;
  adminAuthenticated?: boolean;
  customerName?: string | null;
  onCustomerLogin: () => void;
}

export default function StoreHeader({
  settings,
  cartCount,
  onCartClick,
  onSearchChange,
  selectedCategory,
  onCategorySelect,
  onAdminToggle,
  isAdmin,
  adminAuthenticated,
  customerName,
  onCustomerLogin,
}: StoreHeaderProps) {
  const [searchValue, setSearchValue] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const menuDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Update scroll boundaries
  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 8);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 8);
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  // Scroll active item into view
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const activeBtn = el.querySelector(`[data-category="${selectedCategory}"]`) as HTMLElement;
    if (activeBtn) {
      const containerLeft = el.getBoundingClientRect().left;
      const btnLeft = activeBtn.getBoundingClientRect().left;
      const offset = btnLeft - containerLeft - el.clientWidth / 2 + activeBtn.clientWidth / 2;
      el.scrollBy({ left: offset, behavior: "smooth" });
    }
  }, [selectedCategory]);

  // Outside click to close category menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuDropdownRef.current &&
        !menuDropdownRef.current.contains(e.target as Node)
      ) {
        setIsCategoryMenuOpen(false);
      }
    };
    if (isCategoryMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCategoryMenuOpen]);

  const handleScrollClick = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = direction === "left" ? -280 : 280;
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    onSearchChange(val);
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-canvas/95 backdrop-blur-xl border-b border-border-subtle shadow-md"
          : "bg-canvas border-b border-border-subtle"
      }`}
      id="store-header"
    >
      {/* Top Announcement Bar */}
      {settings.announcement && (
        <div className="bg-primary text-black text-[10px] sm:text-xs font-semibold py-2 px-4 text-center overflow-hidden flex items-center justify-center gap-2 tracking-wide uppercase">
          <span className="shrink-0">🎉</span>
          <p className="truncate">{settings.announcement}</p>
        </div>
      )}

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 sm:gap-6">
        {/* Brand Identity */}
        <div
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group shrink-0"
          onClick={() => onCategorySelect("all")}
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF6B00] to-[#ff944d] p-[1px] shadow-[0_0_15px_rgba(255,107,0,0.25)] overflow-hidden">
            <div className="w-full h-full bg-[#0a0a0a] rounded-xl flex items-center justify-center">
              <div className="w-3.5 h-3.5 bg-[#FF6B00] rounded-xs transform group-hover:rotate-45 transition-transform duration-500"></div>
            </div>
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-[#FAFAFA] tracking-tight flex items-center gap-1.5">
              {settings.storeName.split(" &")[0]}
            </h1>
            <span className="text-[9px] text-zinc-400 hidden sm:block font-mono">
              Kannauj • 13 Departments
            </span>
          </div>
        </div>

        {/* Command Center / Search */}
        <div className="relative flex-1 max-w-lg mx-auto hidden md:block">
          <div className="relative flex items-center w-full bg-surface border border-border-subtle rounded-xl overflow-hidden transition-all duration-300 hover:border-zinc-500 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
            <div className="pl-4 py-2.5">
              <Search className="w-4 h-4 text-zinc-500" />
            </div>
            <input
              type="text"
              placeholder="Search fruits, atta, electronics, snacks, essentials..."
              value={searchValue}
              onChange={handleSearch}
              className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 pl-3 pr-4 py-2 outline-none font-medium"
            />
            <div className="pr-4 text-[10px] text-zinc-500 font-mono opacity-80 border-l border-border-subtle pl-3 py-1">
              ⌘K
            </div>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Track Orders Quick Button */}
          <button
            onClick={() =>
              document.dispatchEvent(new CustomEvent("open-track-order"))
            }
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-xs bg-surface border border-transparent hover:border-border-subtle text-zinc-400 hover:text-zinc-100 transition-all duration-200 cursor-pointer"
          >
            <PackageSearch className="w-4 h-4" />
            <span>Track</span>
          </button>

          {customerName && (
            <button
              onClick={() =>
                document.dispatchEvent(new CustomEvent("open-customer-orders"))
              }
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg font-medium text-xs bg-surface border border-transparent hover:border-border-subtle text-zinc-100 transition-all duration-200 cursor-pointer"
            >
              <Clock className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline">Orders</span>
            </button>
          )}

          <button
            onClick={onCustomerLogin}
            className={`flex items-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-lg font-medium text-xs transition-all duration-200 border cursor-pointer ${
              customerName
                ? "bg-surface border-transparent hover:border-border-subtle text-red-400"
                : "bg-surface border-white/10 hover:border-primary/50 text-zinc-100"
            }`}
          >
            <UserCheck className="w-4 h-4 opacity-80" />
            <span className="inline">
              {customerName ? "Logout" : "Sign In"}
            </span>
          </button>

          <button
            onClick={onCartClick}
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
                  document.dispatchEvent(
                    new CustomEvent("product-dropped-to-cart", { detail: product })
                  );
                }
              } catch (err) {
                console.error("Drop failed", err);
              }
            }}
            className="group relative flex items-center gap-2 bg-primary hover:bg-[#ff7a1a] text-black font-bold text-xs py-2 px-3 sm:px-4 rounded-xl transition-all active:scale-95 shadow-md cursor-pointer shrink-0"
          >
            <ShoppingCart className="w-4 h-4 text-black" />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="bg-black text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-white/20 shadow-md">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search for Mobile */}
      <div className="p-2.5 md:hidden border-t border-border-subtle bg-canvas">
        <div className="relative flex items-center w-full bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-sm">
          <div className="pl-3.5 py-2">
            <Search className="w-4 h-4 text-zinc-500" />
          </div>
          <input
            type="text"
            placeholder="Search all 13 categories..."
            value={searchValue}
            onChange={handleSearch}
            className="flex-1 bg-transparent text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 pl-2.5 pr-4 py-2 outline-none font-medium"
          />
        </div>
      </div>

      {/* Enhanced Categories Navigation Bar with Left/Right Arrows & Full Category Drawer */}
      {!isAdmin && (
        <div className="border-t border-border-subtle bg-[#121215] relative select-none">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 flex items-center relative">
            {/* Quick "All Departments" Button with Dropdown Drawer */}
            <div className="relative shrink-0 pr-2 border-r border-border-subtle py-2">
              <button
                type="button"
                onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold tracking-tight transition-all cursor-pointer ${
                  isCategoryMenuOpen
                    ? "bg-primary text-black shadow-md"
                    : "bg-surface hover:bg-white/10 text-zinc-200 hover:text-white border border-white/5"
                }`}
                title="View all 13 categories"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-primary group-hover:text-black shrink-0" />
                <span className="hidden xs:inline">All</span>
                <span className="bg-primary/20 text-primary border border-primary/30 font-mono text-[9px] px-1 py-0.2 rounded font-bold">
                  13
                </span>
              </button>

              {/* Full Categories Dropdown Modal */}
              {isCategoryMenuOpen && (
                <div
                  ref={menuDropdownRef}
                  className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-[#16161a] border border-border-subtle rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-subtle">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        All Departments (13)
                      </span>
                    </div>
                    <button
                      onClick={() => setIsCategoryMenuOpen(false)}
                      className="p-1 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-1 max-h-80 overflow-y-auto pr-1">
                    {CATEGORIES_DATA.map((cat) => (
                      <button
                        key={cat.code}
                        onClick={() => {
                          onCategorySelect(cat.code);
                          setIsCategoryMenuOpen(false);
                        }}
                        className={`flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                          selectedCategory === cat.code
                            ? "bg-primary/20 text-white font-bold border border-primary/30"
                            : "hover:bg-white/5 text-zinc-300 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="text-base">{cat.icon}</span>
                          <div className="truncate">
                            <p className="text-xs font-medium truncate">{cat.name}</p>
                            <p className="text-[10px] text-zinc-500 font-normal truncate">
                              {cat.hindiName}
                            </p>
                          </div>
                        </div>
                        {selectedCategory === cat.code && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0"></span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Left Scroll Navigation Button */}
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => handleScrollClick("left")}
                aria-label="Scroll categories left"
                className="absolute left-16 sm:left-20 z-20 w-7 h-7 rounded-full bg-[#1c1c22] border border-white/20 text-white hover:text-primary shadow-lg flex items-center justify-center cursor-pointer transition-all hover:scale-110"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {/* Left Gradient Edge */}
            {canScrollLeft && (
              <div className="absolute left-16 sm:left-20 top-0 bottom-0 w-8 bg-gradient-to-r from-[#121215] to-transparent pointer-events-none z-10" />
            )}

            {/* Category Pills Strip */}
            <div
              ref={scrollContainerRef}
              className="flex-1 flex gap-2 sm:gap-2.5 overflow-x-auto py-2.5 px-3 sm:px-4 no-scrollbar scroll-smooth items-center"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {CATEGORIES_DATA.map((cat) => {
                const isSelected = selectedCategory === cat.code;
                return (
                  <button
                    key={cat.code}
                    data-category={cat.code}
                    onClick={() => onCategorySelect(cat.code)}
                    className={`relative shrink-0 py-1.5 px-3 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-1.5 border ${
                      isSelected
                        ? "bg-primary text-black font-bold border-primary shadow-[0_0_12px_rgba(255,107,0,0.3)] scale-[1.02]"
                        : "bg-surface hover:bg-[#1f1f26] border-border-subtle text-zinc-300 hover:text-white"
                    }`}
                  >
                    <span className="text-xs sm:text-sm">{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Gradient Edge */}
            {canScrollRight && (
              <div className="absolute right-9 sm:right-10 top-0 bottom-0 w-12 bg-gradient-to-l from-[#121215] to-transparent pointer-events-none z-10" />
            )}

            {/* Right Scroll Navigation Button */}
            {canScrollRight && (
              <button
                type="button"
                onClick={() => handleScrollClick("right")}
                aria-label="Scroll categories right"
                className="shrink-0 ml-1 z-20 w-7 h-7 rounded-full bg-[#1c1c22] border border-white/20 text-white hover:text-primary shadow-lg flex items-center justify-center cursor-pointer transition-all hover:scale-110"
                title="Scroll more categories"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
