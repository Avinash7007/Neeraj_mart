import React from "react";
import { ArrowRight, LayoutGrid, Sparkles } from "lucide-react";
import { CATEGORIES_DATA } from "../data/categories";
import { Product } from "../types";

interface CategoryShowcaseProps {
  selectedCategory: string;
  onSelectCategory: (categoryCode: string) => void;
  products: Product[];
}

export default function CategoryShowcase({
  selectedCategory,
  onSelectCategory,
  products,
}: CategoryShowcaseProps) {
  // Count items per category
  const getCategoryCount = (code: string) => {
    if (code === "all") return products.length;
    return products.filter((p) => p.category === code).length;
  };

  return (
    <section className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              Shop by Category
              <span className="text-xs font-normal text-zinc-400 font-mono">
                ({CATEGORIES_DATA.length - 1} Departments)
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              Browse Kannauj Store&apos;s full collection by department
            </p>
          </div>
        </div>

        {selectedCategory !== "all" && (
          <button
            onClick={() => onSelectCategory("all")}
            className="text-xs text-primary hover:text-[#ff8533] font-medium flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Grid of all categories */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2.5 sm:gap-3">
        {CATEGORIES_DATA.map((cat) => {
          const isSelected = selectedCategory === cat.code;
          const count = getCategoryCount(cat.code);

          return (
            <button
              key={cat.code}
              onClick={() => onSelectCategory(cat.code)}
              className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                isSelected
                  ? "bg-primary/15 border-primary shadow-[0_0_15px_rgba(255,107,0,0.25)]"
                  : "bg-[#151518] hover:bg-[#1c1c22] border-border-subtle hover:border-zinc-600"
              }`}
            >
              {/* Background Glow */}
              <div
                className={`absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 rounded-full bg-gradient-to-br ${cat.bgGradient} blur-xl pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity`}
              />

              <div className="flex items-start justify-between mb-2 z-10">
                <span className="text-2xl sm:text-3xl p-1 rounded-lg bg-black/30 backdrop-blur-xs">
                  {cat.icon}
                </span>
                {count > 0 && (
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                      isSelected
                        ? "bg-primary text-black"
                        : "bg-white/10 text-zinc-400 group-hover:text-zinc-200"
                    }`}
                  >
                    {count} {count === 1 ? "item" : "items"}
                  </span>
                )}
              </div>

              <div className="z-10 mt-1">
                <h4
                  className={`text-xs font-bold truncate leading-snug ${
                    isSelected ? "text-white" : "text-zinc-200 group-hover:text-white"
                  }`}
                >
                  {cat.name}
                </h4>
                <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                  {cat.hindiName}
                </p>
              </div>

              {/* Active Indicator Bar */}
              {isSelected && (
                <div className="absolute bottom-0 inset-x-0 h-1 bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
