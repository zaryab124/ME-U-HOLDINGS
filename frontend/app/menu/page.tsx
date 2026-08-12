"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { api } from "@/lib/api";
import { Category, Product, ProductVariant, ProductAddon, Branch } from "@/lib/types";
import { Search, Filter, ShoppingBag, Utensils } from "lucide-react";
import Link from "next/link";

interface CartItem {
  product: Product;
  variant?: ProductVariant;
  addons: ProductAddon[];
  quantity: number;
}

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    // Load stored cart
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch {}
    }

    // Load branches
    api.get<Branch[]>("/branches/").then((res) => {
      setBranches(res.data);
      const storedBranchId = localStorage.getItem("selected_branch_id");
      const found = res.data.find((b) => b.id === storedBranchId);
      setSelectedBranch(found || res.data[0]);
    });

    // Load categories & products
    Promise.all([
      api.get<Category[]>("/categories/"),
      api.get<Product[]>("/products/"),
    ]).then(([catRes, prodRes]) => {
      setCategories(catRes.data);
      setProducts(prodRes.data);
      setLoading(false);
    });
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const handleAddToCart = (product: Product, variant?: ProductVariant, addons: ProductAddon[] = []) => {
    const existingIndex = cart.findIndex(
      (item) =>
        item.product.id === product.id &&
        item.variant?.id === variant?.id &&
        JSON.stringify(item.addons.map((a) => a.id)) === JSON.stringify(addons.map((a) => a.id))
    );

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      saveCart(updated);
    } else {
      saveCart([...cart, { product, variant, addons, quantity: 1 }]);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory ? p.category_id === selectedCategory : true;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBranch = !p.branch_id || (selectedBranch && p.branch_id === selectedBranch.id);
    return matchesCategory && matchesSearch && matchesBranch;
  });

  const cartTotalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar selectedBranch={selectedBranch} cartCount={cartTotalItems} />

      <main className="max-w-7xl mx-auto px-4 py-8 w-full flex-grow">
        
        {/* Branch Selector Header */}
        <div className="glass-panel p-4 rounded-2xl mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800">
          <div>
            <span className="text-xs text-orange-400 font-bold uppercase tracking-wider block">Ordering From</span>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              📍 {selectedBranch ? selectedBranch.name : "Main Branch"} ({selectedBranch?.city})
            </h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            {branches.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setSelectedBranch(b);
                  localStorage.setItem("selected_branch_id", b.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedBranch?.id === b.id
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                    : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="space-y-4 mb-8">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search for burgers, pizzas, drinks, starters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors text-sm"
            />
          </div>

          {/* Categories Horizontal Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === null
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                  : "glass-card text-slate-400 hover:text-white"
              }`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === c.id
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                    : "glass-card text-slate-400 hover:text-white"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Food Products Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Loading delicious food menu...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center glass-panel rounded-3xl border border-slate-800">
            <Utensils className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No food items found</h3>
            <p className="text-slate-400 text-xs mt-1">Try clearing your search query or selecting another category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}

      </main>

      {/* Floating View Cart Bar */}
      {cartTotalItems > 0 && (
        <div className="sticky bottom-4 z-40 px-4 max-w-xl mx-auto w-full">
          <Link
            href="/cart"
            className="flex items-center justify-between px-6 py-4 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold shadow-2xl shadow-orange-600/30 hover:scale-[1.02] transition-transform border border-orange-400/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-sm font-black">
                {cartTotalItems}
              </div>
              <span className="text-sm">View Cart & Checkout</span>
            </div>
            <span className="text-sm font-extrabold flex items-center gap-1">
              Proceed <ShoppingBag className="w-4 h-4" />
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
