"use client";

import { useState } from "react";
import { Branch } from "@/lib/types";
import { MapPin, Phone, Clock, ChevronRight } from "lucide-react";

interface BranchSelectorProps {
  branches: Branch[];
  selectedBranch: Branch | null;
  onSelectBranch: (branch: Branch) => void;
}

export function BranchSelector({ branches, selectedBranch, onSelectBranch }: BranchSelectorProps) {
  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
        <MapPin className="w-6 h-6 text-orange-500" /> Select Your Nearest Branch
      </h2>
      <p className="text-slate-400 text-sm mb-6">
        Choose from our 6 official restaurant branches to view local menus, deals, and delivery availability.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {branches.map((branch) => {
          const isSelected = selectedBranch?.id === branch.id;
          return (
            <div
              key={branch.id}
              onClick={() => onSelectBranch(branch)}
              className={`cursor-pointer rounded-2xl p-5 border transition-all duration-300 relative overflow-hidden group ${
                isSelected
                  ? "bg-gradient-to-b from-slate-900 to-orange-950/40 border-orange-500 shadow-xl shadow-orange-500/10 ring-2 ring-orange-500/30"
                  : "glass-card hover:bg-slate-800/80 border-slate-800 hover:border-slate-700"
              }`}
            >
              {isSelected && (
                <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-orange-500 text-white text-[11px] font-bold shadow-md">
                  Active
                </span>
              )}

              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors">
                    {branch.name}
                  </h3>
                  <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2">
                    {branch.code} • {branch.city}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-300 mb-4 line-clamp-2">
                {branch.address}
              </p>

              <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{branch.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{branch.opening_time} - {branch.closing_time}</span>
                </div>
              </div>

              {/* Service Badges */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/80">
                {branch.delivery_enabled ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                    Delivery
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] font-semibold border border-red-500/20">
                    No Delivery
                  </span>
                )}
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-semibold border border-amber-500/20">
                  Dine-In
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-semibold border border-blue-500/20">
                  Takeaway
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
