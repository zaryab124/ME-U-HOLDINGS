"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { api } from "@/lib/api";
import { Deal, Product } from "@/lib/types";
import { Flame, Sparkles, Plus, Check, ShoppingBag, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Custom Deal Builder State
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [customDiscountPercent, setCustomDiscountPercent] = useState<number>(15);

  useEffect(() => {
    Promise.all([
      api.get<Deal[]>("/deals/"),
      api.get<Product[]>("/products/"),
    ]).then(([dRes, pRes]) => {
      setDeals(dRes.data);
      setProducts(pRes.data);
      setLoading(false);
    });
  }, []);

  const toggleProductSelection = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter((pId) => pId !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const selectedProducts = products.filter((p) => selectedProductIds.includes(p.id));
  const rawSubtotal = selectedProducts.reduce((acc, p) => acc + p.price, 0);

  // MAX 25% CUTOFF ENFORCEMENT
  const MAX_DISCOUNT = 25;
  const effectiveDiscountPercent = Math.min(customDiscountPercent, MAX_DISCOUNT);
  const discountAmount = rawSubtotal * (effectiveDiscountPercent / 100);
  const finalPrice = rawSubtotal - discountAmount;

  const handleApplyCustomDeal = () => {
    if (selectedProducts.length === 0) return;

    // Format cart items
    const newItems = selectedProducts.map((p) => ({
      product: p,
      addons: [],
      quantity: 1,
    }));

    localStorage.setItem("cart", JSON.stringify(newItems));
    router.push("/cart");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8 w-full flex-grow space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
            <Flame className="w-4 h-4" /> Promotions & Deal Engine
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            Exclusive Deals & Custom Meal Builder
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Enjoy branch-specific combos, BOGO offers, or build your own custom deal with server-side validated discounts up to 25%.
          </p>
        </div>

        {/* Section 1: Official Restaurant Deals */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            🏷️ Official Branch Combos & Discounts
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {deals.map((deal) => (
              <div key={deal.id} className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col justify-between group hover:border-orange-500/40 transition-all">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-extrabold border border-amber-500/20 uppercase tracking-wider">
                      {deal.discount_type}
                    </span>
                    <span className="text-2xl font-black text-orange-400">
                      {deal.discount_type === "PERCENTAGE" ? `${deal.discount_value}% OFF` : `$${deal.discount_value} SAVINGS`}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-orange-400 transition-colors">
                    {deal.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {deal.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    Min Order: ${deal.minimum_order.toFixed(2)}
                  </span>
                  <button
                    onClick={() => router.push("/menu")}
                    className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md shadow-orange-600/20"
                  >
                    View in Menu
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: "MAKE YOUR OWN DEAL" Customer Deal Builder */}
        <div className="glass-panel p-8 rounded-3xl border border-slate-700/80 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">"Make Your Own Deal" Builder</h2>
              <p className="text-xs text-slate-400">Select any items and set your requested custom discount.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Food Selector List */}
            <div className="lg:col-span-7 space-y-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                1. Select Foods for Your Combo
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                {products.map((p) => {
                  const isSelected = selectedProductIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleProductSelection(p.id)}
                      className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between text-xs transition-all ${
                        isSelected
                          ? "bg-purple-600/20 border-purple-500 text-white font-bold"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded flex items-center justify-center ${isSelected ? "bg-purple-500 text-white" : "border border-slate-700"}`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <span className="truncate max-w-[140px]">{p.name}</span>
                      </div>
                      <span className="text-orange-400 font-extrabold">${p.price.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Discount Calculator & Rules */}
            <div className="lg:col-span-5 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                2. Requested Discount Percentage
              </label>

              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-slate-400">Requested: {customDiscountPercent}%</span>
                  <span className="text-emerald-400 font-bold">Applied: {effectiveDiscountPercent}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  value={customDiscountPercent}
                  onChange={(e) => setCustomDiscountPercent(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              {/* 25% Cutoff Rule Notice */}
              {customDiscountPercent > 25 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Server Rule Enforced:</strong> Maximum custom deal discount is capped at 25% by backend business logic.
                  </span>
                </div>
              )}

              {/* Pricing Breakdown */}
              <div className="border-t border-slate-800 pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Selected Items ({selectedProducts.length})</span>
                  <span>${rawSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Discount ({effectiveDiscountPercent}%)</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-white border-t border-slate-800 pt-3">
                  <span>Final Combo Price</span>
                  <span className="text-orange-400">${finalPrice.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleApplyCustomDeal}
                disabled={selectedProducts.length === 0}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Add Custom Combo to Cart <ShoppingBag className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
