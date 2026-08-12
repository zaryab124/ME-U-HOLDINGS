"use client";

import { useState } from "react";
import { Product, ProductVariant, ProductAddon } from "@/lib/types";
import { Plus, Clock, Star, Check } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, variant?: ProductVariant, addons?: ProductAddon[]) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    product.variants?.[0]
  );
  const [selectedAddons, setSelectedAddons] = useState<ProductAddon[]>([]);
  const [showModal, setShowModal] = useState(false);

  const toggleAddon = (addon: ProductAddon) => {
    if (selectedAddons.some((a) => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter((a) => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const addonsTotal = selectedAddons.reduce((acc, a) => acc + a.price, 0);
  const totalPrice = currentPrice + addonsTotal;

  const handleAdd = () => {
    onAddToCart(product, selectedVariant, selectedAddons);
    setShowModal(false);
  };

  return (
    <>
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-800 hover:border-orange-500/50 transition-all duration-300 flex flex-col justify-between group">
        <div>
          {/* Image / Header */}
          <div className="relative h-44 bg-slate-900 overflow-hidden flex items-center justify-center">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="text-slate-700 text-4xl font-black uppercase tracking-widest">
                ME-U FOOD
              </div>
            )}
            {product.featured && (
              <span className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" /> Chef Special
              </span>
            )}
            <span className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur text-slate-300 text-[11px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1 border border-slate-800">
              <Clock className="w-3 h-3 text-orange-400" /> {product.preparation_time} mins
            </span>
          </div>

          {/* Details */}
          <div className="p-5">
            <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors">
              {product.name}
            </h3>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {product.description || "Freshly cooked with premium ingredients."}
            </p>
          </div>
        </div>

        {/* Footer & Price */}
        <div className="p-5 pt-0 flex items-center justify-between border-t border-slate-800/60 mt-2">
          <div>
            <span className="text-xs text-slate-500 uppercase font-semibold block">Price</span>
            <span className="text-xl font-extrabold text-orange-400">
              ${totalPrice.toFixed(2)}
            </span>
          </div>

          <button
            onClick={() => {
              if (product.variants.length > 0 || product.addons.length > 0) {
                setShowModal(true);
              } else {
                onAddToCart(product);
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-600/20 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add to Order
          </button>
        </div>
      </div>

      {/* Customization Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-slate-700 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-white mb-1">{product.name}</h3>
            <p className="text-xs text-slate-400 mb-5">{product.description}</p>

            {/* Variants */}
            {product.variants.length > 0 && (
              <div className="mb-5">
                <label className="text-xs font-bold text-orange-400 uppercase tracking-wider block mb-2">
                  Select Portion / Size
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`p-3 rounded-xl border text-left flex justify-between items-center text-xs transition-all ${
                        selectedVariant?.id === v.id
                          ? "bg-orange-500/20 border-orange-500 text-white font-semibold"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <span>{v.name}</span>
                      <span className="text-orange-400 font-bold">${v.price.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Addons */}
            {product.addons.length > 0 && (
              <div className="mb-6">
                <label className="text-xs font-bold text-orange-400 uppercase tracking-wider block mb-2">
                  Add Extra Toppings
                </label>
                <div className="space-y-2">
                  {product.addons.map((a) => {
                    const isSelected = selectedAddons.some((item) => item.id === a.id);
                    return (
                      <button
                        key={a.id}
                        onClick={() => toggleAddon(a)}
                        className={`w-full p-3 rounded-xl border flex justify-between items-center text-xs transition-all ${
                          isSelected
                            ? "bg-orange-500/20 border-orange-500 text-white font-semibold"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? "bg-orange-500 border-orange-500 text-white" : "border-slate-700"}`}>
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                          {a.name}
                        </span>
                        <span className="text-slate-300 font-medium">+${a.price.toFixed(2)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-2">
              <div>
                <span className="text-xs text-slate-500 uppercase block font-semibold">Total Price</span>
                <span className="text-2xl font-extrabold text-orange-400">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  className="px-5 py-2.5 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-500 shadow-lg shadow-orange-600/20"
                >
                  Confirm & Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
