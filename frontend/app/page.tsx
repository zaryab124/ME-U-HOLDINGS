"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { BranchSelector } from "@/components/BranchSelector";
import { api } from "@/lib/api";
import { Branch } from "@/lib/types";
import { Utensils, Award, Clock, Truck, ArrowRight, Star } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch 6 branches from backend API
    api.get<Branch[]>("/branches/")
      .then((res) => {
        setBranches(res.data);
        if (res.data.length > 0) {
          const stored = localStorage.getItem("selected_branch_id");
          const found = res.data.find((b) => b.id === stored);
          setSelectedBranch(found || res.data[0]);
        }
      })
      .catch((err) => {
        console.error("Error loading branches", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSelectBranch = (branch: Branch) => {
    setSelectedBranch(branch);
    localStorage.setItem("selected_branch_id", branch.id);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar selectedBranch={selectedBranch} />

      {/* Hero Section */}
      <section className="relative py-16 lg:py-24 px-4 overflow-hidden border-b border-slate-800/80">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/10 via-amber-600/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider">
              🔥 Multi-Branch Restaurant Network (6 Locations)
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              Culinary Excellence, <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-500">
                Delivered Real-Time.
              </span>
            </h1>

            <p className="text-slate-400 text-base sm:text-lg max-w-xl leading-relaxed">
              Order gourmet meals for dine-in, takeaway, or express delivery across our 6 branches with live kitchen status updates.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/menu"
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-sm shadow-xl shadow-orange-600/20 transition-all hover:scale-105"
              >
                Order Now <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dine-in"
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl glass-panel text-slate-200 font-bold text-sm hover:bg-slate-800 transition-all border border-slate-700"
              >
                Scan Table QR
              </Link>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80">
              <div>
                <span className="text-2xl font-black text-white">6</span>
                <span className="block text-xs text-slate-400 font-medium">Active Branches</span>
              </div>
              <div>
                <span className="text-2xl font-black text-orange-400">15m</span>
                <span className="block text-xs text-slate-400 font-medium">Avg Prep Time</span>
              </div>
              <div>
                <span className="text-2xl font-black text-amber-400">4.9★</span>
                <span className="block text-xs text-slate-400 font-medium">Customer Rating</span>
              </div>
            </div>
          </div>

          {/* Feature Highlight Graphic */}
          <div className="relative">
            <div className="glass-panel p-6 rounded-3xl border border-slate-700/80 shadow-2xl relative z-10 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-600/20 text-orange-400 flex items-center justify-center font-bold text-lg">
                    🍽️
                  </div>
                  <div>
                    <h4 className="text-white font-bold">Select Active Branch</h4>
                    <p className="text-xs text-slate-400">Each branch manages live menus & orders</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                  Real-time APIs
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-orange-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">Express Delivery</span>
                      <span className="text-[11px] text-slate-400">Hot food delivered in ~30 mins</span>
                    </div>
                  </div>
                  <span className="text-xs text-orange-400 font-bold">$3.50</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Utensils className="w-5 h-5 text-amber-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">Dine-In QR Ordering</span>
                      <span className="text-[11px] text-slate-400">Scan table QR & order directly to kitchen</span>
                    </div>
                  </div>
                  <span className="text-xs text-amber-400 font-bold">Instant</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Branch Selection Section */}
      <section className="py-12 px-4 max-w-7xl mx-auto w-full flex-grow">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Loading 6 official restaurant branches...</p>
          </div>
        ) : (
          <BranchSelector
            branches={branches}
            selectedBranch={selectedBranch}
            onSelectBranch={handleSelectBranch}
          />
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 px-4 text-center text-xs text-slate-500">
        Restaurant Management & Ordering System • Powered by Next.js & FastAPI Backend
      </footer>
    </div>
  );
}
