"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UtensilsCrossed, ShoppingBag, User as UserIcon, ShieldAlert, LogOut, LayoutDashboard, QrCode, Bike, ChefHat, Store } from "lucide-react";
import { getStoredUser, clearStoredSession } from "@/lib/authStore";
import { User, Branch } from "@/lib/types";

interface NavbarProps {
  selectedBranch?: Branch | null;
  cartCount?: number;
}

export function Navbar({ selectedBranch, cartCount = 0 }: NavbarProps) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const handleLogout = () => {
    clearStoredSession();
    window.location.href = "/";
  };

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-slate-800 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-orange-400">
              ME-U Kitchens
            </span>
            {selectedBranch && (
              <span className="block text-xs text-orange-400 font-medium">
                📍 {selectedBranch.name} ({selectedBranch.city})
              </span>
            )}
          </div>
        </Link>

        {/* Center Nav Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <Link href="/menu" className="hover:text-orange-400 transition-colors flex items-center gap-1.5">
            <UtensilsCrossed className="w-4 h-4" /> Food Menu
          </Link>
          <Link href="/deals" className="hover:text-orange-400 transition-colors flex items-center gap-1.5">
            🔥 Deals & Combos
          </Link>
          <Link href="/dine-in" className="hover:text-orange-400 transition-colors flex items-center gap-1.5">
            <QrCode className="w-4 h-4" /> Table Ordering
          </Link>
        </div>

        {/* Right Action Icons & User Controls */}
        <div className="flex items-center gap-4">
          <Link href="/cart" className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 transition-all border border-slate-700">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-orange-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              {/* Role specific portal links */}
              {user.role === "OWNER" && (
                <Link href="/owner" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-semibold hover:bg-purple-600/30">
                  <LayoutDashboard className="w-3.5 h-3.5" /> Owner Portal
                </Link>
              )}
              {user.role === "ADMIN" && (
                <Link href="/admin" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 text-xs font-semibold hover:bg-blue-600/30">
                  <ShieldAlert className="w-3.5 h-3.5" /> Admin Portal
                </Link>
              )}
              {user.role === "BRANCH_MANAGER" && (
                <Link href="/branch" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-600/30">
                  <Store className="w-3.5 h-3.5" /> Branch Portal
                </Link>
              )}
              {(user.role === "KITCHEN_STAFF" || user.role === "KITCHEN_MANAGER") && (
                <Link href="/kitchen" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/20 text-amber-300 border border-amber-500/30 text-xs font-semibold hover:bg-amber-600/30">
                  <ChefHat className="w-3.5 h-3.5" /> Kitchen Screen
                </Link>
              )}
              {user.role === "RIDER" && (
                <Link href="/rider" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold hover:bg-cyan-600/30">
                  <Bike className="w-3.5 h-3.5" /> Rider Portal
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors border border-slate-800"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link href="/login" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white text-sm font-semibold hover:opacity-90 shadow-md shadow-orange-600/20 transition-all">
              <UserIcon className="w-4 h-4" /> Staff Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
