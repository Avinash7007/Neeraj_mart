import React, { useState } from "react";
import { Plus, Minus, Tag, Move, ShoppingCart } from "lucide-react";
import { Product } from "../types";

interface ProductCardProps {
  key?: string;
  product: Product;
  cartQuantity: number;
  onAddToCart: (product: Product) => void;
  onRemoveOneFromCart: (productId: string) => void;
}

export default function ProductCard({
  product,
  cartQuantity,
  onAddToCart,
  onRemoveOneFromCart,
}: ProductCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100,
        )
      : 0;

  const isPurchasable = product.isAvailable && product.stock > 0;

  const handleDragStart = (e: React.DragEvent) => {
    if (!isPurchasable) return;
    setIsDragging(true);
    e.dataTransfer.setData("application/json", JSON.stringify(product));
    e.dataTransfer.setData("text/plain", product.id);
    e.dataTransfer.effectAllowed = "copy";
    // Trigger global drag state so cart dropzones highlight
    document.dispatchEvent(new CustomEvent("product-drag-start", { detail: product }));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    document.dispatchEvent(new CustomEvent("product-drag-end"));
  };

  return (
    <div
      id={`product-card-${product.id}`}
      draggable={isPurchasable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`relative bg-[#141416] border rounded-2xl transition-all duration-300 flex flex-col group overflow-hidden ${
        isDragging
          ? "opacity-50 scale-95 border-primary shadow-2xl"
          : "border-white/10 hover:border-[#FF6B00] hover:shadow-[0_14px_35px_rgba(255,107,0,0.22)] hover:-translate-y-1.5"
      } ${isPurchasable ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
    >
      {/* Top Hover Accent Glow Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FF6B00] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20"></div>

      {/* Discount Badge */}
      {discountPercent > 0 && (
        <div className="absolute top-2.5 left-2.5 z-20 bg-[#FF6B00] text-white font-bold text-[9px] px-2 py-0.5 rounded-md flex items-center gap-0.5 shadow-lg">
          <Tag className="w-2.5 h-2.5" />
          <span>{discountPercent}% OFF</span>
        </div>
      )}

      {/* Drag to Cart Quick Hint Badge on Hover */}
      {isPurchasable && (
        <div className="absolute top-2.5 right-2.5 z-20 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none transform translate-y-1 group-hover:translate-y-0">
          <span className="bg-black/80 backdrop-blur-md text-white text-[9px] font-mono px-2 py-0.5 rounded-full border border-white/15 shadow-md flex items-center gap-1">
            <Move className="w-2.5 h-2.5 text-primary" /> Drag to cart
          </span>
        </div>
      )}

      {/* Product Image Stage */}
      <div className="relative w-full aspect-[4/3] sm:aspect-square bg-[#0c0c0e] flex items-center justify-center p-0 overflow-hidden border-b border-white/5">
        <img
          src={
            product.imageUrl ||
            "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=400&q=80"
          }
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover filter group-hover:scale-110 group-hover:brightness-105 transition-all duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141416]/90 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>

        {/* Unavailable & Low Stock Highlights */}
        {!product.isAvailable || product.stock <= 0 ? (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="bg-[#1A1A1A] border border-white/10 text-[#A1A1AA] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg shadow-lg">
              Sold Out
            </span>
          </div>
        ) : product.stock < 10 ? (
          <div className="absolute bottom-2 left-2 z-10">
            <span className="bg-red-500/20 text-red-400 text-[9px] font-bold px-2 py-0.5 rounded border border-red-500/30 uppercase tracking-wide backdrop-blur-xs">
              Only {product.stock} left
            </span>
          </div>
        ) : null}
      </div>

      {/* Description Content */}
      <div className="p-3 sm:p-4 flex flex-col flex-grow bg-[#141416]/90">
        <span className="text-[9px] sm:text-[10px] text-zinc-400 font-mono uppercase tracking-wider mb-1 flex items-center gap-1">
          {product.category}
        </span>

        {/* Main Title */}
        <h3 className="font-semibold text-zinc-100 text-xs sm:text-sm line-clamp-1 group-hover:text-primary transition-colors tracking-tight leading-snug">
          {product.name}
        </h3>

        {product.hindiName && (
          <p className="text-[10px] sm:text-[11px] text-zinc-400 font-medium leading-none mt-1 truncate">
            {product.hindiName}
          </p>
        )}

        {/* Detailed Description */}
        <p className="hidden md:block text-[11px] text-zinc-400 line-clamp-2 mt-2 leading-relaxed flex-grow">
          {product.description}
        </p>

        {/* Dynamic Action & Price Box */}
        <div className="mt-2.5 sm:mt-4 flex items-center justify-between pt-2.5 sm:pt-3 border-t border-white/5 gap-1.5">
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] sm:text-[10px] text-zinc-400 font-mono lowercase truncate">
              {product.unit}
            </span>
            <div className="flex items-baseline gap-1 sm:gap-1.5 mt-0.5">
              <span className="text-xs sm:text-sm md:text-base font-bold text-white tracking-tight">
                ₹{product.price}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-[10px] text-zinc-500 line-through">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>
          </div>

          {/* Stepper controls */}
          <div className="w-[72px] sm:w-20 shrink-0">
            {!product.isAvailable || product.stock <= 0 ? (
              <button
                disabled
                className="w-full bg-[#1A1A1A] text-zinc-600 text-[10px] font-bold py-1.5 sm:py-2 rounded-lg border border-white/5 uppercase tracking-wider"
              >
                N/A
              </button>
            ) : cartQuantity > 0 ? (
              <div className="flex items-center justify-between bg-primary text-white rounded-lg p-0.5 sm:p-1 shadow-md font-bold min-h-[32px] sm:min-h-[36px]">
                <button
                  onClick={() => onRemoveOneFromCart(product.id)}
                  aria-label="Decrease quantity"
                  className="p-1 sm:p-1.5 hover:bg-black/20 active:scale-90 rounded-md transition-all cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs px-0.5 sm:px-1 text-white font-bold">
                  {cartQuantity}
                </span>
                <button
                  onClick={() => onAddToCart(product)}
                  disabled={cartQuantity >= product.stock}
                  aria-label="Increase quantity"
                  className="p-1 sm:p-1.5 hover:bg-black/20 active:scale-90 rounded-md disabled:opacity-30 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onAddToCart(product)}
                aria-label={`Add ${product.name} to cart`}
                className="w-full bg-white hover:bg-primary text-black hover:text-white border border-transparent text-[11px] sm:text-xs font-bold py-1.5 sm:py-2 px-1 sm:px-3 rounded-lg transition-all duration-200 cursor-pointer text-center uppercase tracking-wider shadow-sm min-h-[32px] sm:min-h-[36px] active:scale-95 flex items-center justify-center gap-1 group/btn"
              >
                <Plus className="w-3 h-3 sm:hidden" />
                <span>Add</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
