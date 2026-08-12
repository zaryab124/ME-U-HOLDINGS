"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { api } from "@/lib/api";
import { Branch, SalesOverview } from "@/lib/types";
import { LayoutDashboard, TrendingUp, DollarSign, Download, Building2, ShoppingBag, Star, MessageSquare, AlertTriangle, ShieldCheck } from "lucide-react";

export default function OwnerDashboardPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("ALL");
  const [salesOverview, setSalesOverview] = useState<SalesOverview | null>(null);
  const [feedbackAnalytics, setFeedbackAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = (branchId: string) => {
    setLoading(true);
    const query = branchId !== "ALL" ? `?branch_id=${branchId}` : "";

    Promise.all([
      api.get<SalesOverview>(`/reports/sales-overview${query}`),
      api.get(`/feedback/analytics${query}`),
    ])
      .then(([salesRes, fbRes]) => {
        setSalesOverview(salesRes.data);
        setFeedbackAnalytics(fbRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get<Branch[]>("/branches/").then((res) => {
      setBranches(res.data);
    });
    loadMetrics(selectedBranchId);
  }, []);

  const handleBranchChange = (branchId: string) => {
    setSelectedBranchId(branchId);
    loadMetrics(branchId);
  };

  const handleExportCSV = () => {
    const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/reports/export/csv?branch_id=${selectedBranchId}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8 w-full flex-grow space-y-8">
        
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
          <div>
            <span className="text-xs text-purple-400 font-extrabold uppercase tracking-wider block">Executive Dashboard</span>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-purple-400" /> Owner Platform Analytics
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Branch Filter Selector */}
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
              <Building2 className="w-4 h-4 text-purple-400" />
              <select
                value={selectedBranchId}
                onChange={(e) => handleBranchChange(e.target.value)}
                className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="ALL">ALL BRANCHES (6 Active)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {loading || !salesOverview ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Aggregating financial metrics & feedback analytics...</p>
          </div>
        ) : (
          <>
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-semibold block">Today's Sales</span>
                <span className="text-2xl font-black text-emerald-400">${salesOverview.total_sales_today.toFixed(2)}</span>
                <span className="text-[11px] text-slate-500 block">Weekly: ${salesOverview.total_sales_week.toFixed(2)}</span>
              </div>

              <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-semibold block">Monthly Revenue</span>
                <span className="text-2xl font-black text-white">${salesOverview.total_sales_month.toFixed(2)}</span>
                <span className="text-[11px] text-slate-500 block">Total Orders: {salesOverview.total_orders}</span>
              </div>

              <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-semibold block">Net Profit</span>
                <span className="text-2xl font-black text-purple-400">${salesOverview.net_profit.toFixed(2)}</span>
                <span className="text-[11px] text-slate-500 block">Food Cost: ${salesOverview.total_cost.toFixed(2)}</span>
              </div>

              <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-semibold block">Avg Order Value</span>
                <span className="text-2xl font-black text-amber-400">${salesOverview.avg_order_value.toFixed(2)}</span>
                <span className="text-[11px] text-slate-500 block">Completed: {salesOverview.completed_orders}</span>
              </div>

            </div>

            {/* Order Type & Product Performance Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Order Channels */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <ShoppingBag className="w-4 h-4 text-orange-400" /> Order Fulfillment Channels
                </h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1">Dine-In</span>
                    <span className="text-xl font-bold text-amber-400">{salesOverview.dine_in_count}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1">Takeaway</span>
                    <span className="text-xl font-bold text-blue-400">{salesOverview.takeaway_count}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1">Delivery</span>
                    <span className="text-xl font-bold text-cyan-400">{salesOverview.delivery_count}</span>
                  </div>
                </div>
              </div>

              {/* Best & Worst Selling Items */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <TrendingUp className="w-4 h-4 text-emerald-400" /> Menu Performance Matrix
                </h3>
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center">
                    <div>
                      <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider block">Top Selling Item</span>
                      <span className="text-sm font-bold text-white">{salesOverview.best_selling_food}</span>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">Best Seller</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 flex justify-between items-center">
                    <div>
                      <span className="text-[11px] text-red-400 font-bold uppercase tracking-wider block">Lowest Performing Item</span>
                      <span className="text-sm font-bold text-white">{salesOverview.worst_selling_food}</span>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 font-bold">Low Demand</span>
                  </div>
                </div>
              </div>

            </div>

            {/* OWNER FEEDBACK ANALYTICS ENGINE SECTION */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Owner Feedback Analytics Engine</h3>
                    <p className="text-xs text-slate-400">Rule-based sentiment categorization & complaint extraction</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-current" />
                  <span className="text-2xl font-black text-white">{feedbackAnalytics?.average_rating || "0.0"}</span>
                  <span className="text-xs text-slate-400 font-medium">({feedbackAnalytics?.total_reviews || 0} Reviews)</span>
                </div>
              </div>

              {/* Sub Rating Scores */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                  <span className="text-xs text-slate-400 block mb-1">Food Taste & Quality</span>
                  <span className="text-xl font-bold text-amber-400">{feedbackAnalytics?.average_food_rating || 0} / 5</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                  <span className="text-xs text-slate-400 block mb-1">Table & Staff Service</span>
                  <span className="text-xl font-bold text-emerald-400">{feedbackAnalytics?.average_service_rating || 0} / 5</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                  <span className="text-xs text-slate-400 block mb-1">Delivery Speed</span>
                  <span className="text-xl font-bold text-cyan-400">{feedbackAnalytics?.average_delivery_rating || 0} / 5</span>
                </div>
              </div>

              {/* Common Complaints Extracted by Engine */}
              {feedbackAnalytics?.common_complaints?.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Detected Complaint Patterns
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {feedbackAnalytics.common_complaints.map((c: string, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                        • {c}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

      </main>
    </div>
  );
}
