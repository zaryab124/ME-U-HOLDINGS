"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { api } from "@/lib/api";
import { Order, Branch } from "@/lib/types";
import { getStoredUser } from "@/lib/authStore";
import { useWebSocket } from "@/lib/useWebSocket";
import { ChefHat, Clock, CheckCircle, Flame, AlertTriangle, Radio } from "lucide-react";

export default function KitchenDisplayPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKitchenOrders = (bId: string) => {
    api.get<Order[]>(`/kitchen/display?branch_id=${bId}`)
      .then((res) => setOrders(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const user = getStoredUser();
    api.get<Branch[]>("/branches/").then((res) => {
      setBranches(res.data);
      const targetId = user?.branch_id || localStorage.getItem("selected_branch_id") || res.data[0]?.id;
      setSelectedBranchId(targetId);
      if (targetId) fetchKitchenOrders(targetId);
    });
  }, []);

  // WebSockets for Real-Time Kitchen Order Broadcasts
  const { isConnected } = useWebSocket("branch", selectedBranchId, (data) => {
    if (data.event === "new_order" || data.event === "order_updated") {
      if (selectedBranchId) fetchKitchenOrders(selectedBranchId);
    }
  });

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      fetchKitchenOrders(selectedBranchId);
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { title: "NEW", status: "PENDING", color: "border-orange-500/50 bg-orange-500/5 text-orange-400" },
    { title: "ACCEPTED", status: "ACCEPTED", color: "border-blue-500/50 bg-blue-500/5 text-blue-400" },
    { title: "PREPARING", status: "PREPARING", color: "border-amber-500/50 bg-amber-500/5 text-amber-400" },
    { title: "READY", status: "READY", color: "border-emerald-500/50 bg-emerald-500/5 text-emerald-400" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-6 w-full flex-grow space-y-6">
        
        {/* Header */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center font-bold">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Large-Screen Kitchen Display (KDS)</h1>
              <p className="text-xs text-slate-400">Real-time order dispatch powered by WebSockets</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Radio className={`w-3.5 h-3.5 ${isConnected ? "text-emerald-400 animate-pulse" : "text-slate-600"}`} />
              {isConnected ? "Kitchen WebSocket Live" : "Offline"}
            </span>

            <select
              value={selectedBranchId}
              onChange={(e) => {
                setSelectedBranchId(e.target.value);
                fetchKitchenOrders(e.target.value);
              }}
              className="bg-slate-900 border border-slate-800 text-white text-xs font-bold p-2.5 rounded-xl"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Kanban Board Columns */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Initializing Kitchen Kanban Board...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {columns.map((col) => {
              const colOrders = orders.filter((o) => o.status === col.status);
              return (
                <div key={col.status} className="glass-panel rounded-2xl border border-slate-800 p-4 space-y-3 min-h-[500px]">
                  <div className={`p-2.5 rounded-xl border font-bold text-xs flex justify-between items-center ${col.color}`}>
                    <span>{col.title}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-950 text-white font-extrabold text-[10px]">
                      {colOrders.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {colOrders.map((order) => {
                      const elapsedMins = Math.floor(
                        (new Date().getTime() - new Date(order.created_at).getTime()) / (1000 * 60)
                      );
                      const isLate = elapsedMins > order.preparation_time_minutes;

                      return (
                        <div
                          key={order.id}
                          className={`glass-card p-4 rounded-2xl border transition-all space-y-3 ${
                            isLate ? "border-red-500/50 bg-red-950/20" : "border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex justify-between items-start border-b border-slate-800 pb-2">
                            <div>
                              <span className="text-sm font-extrabold text-white">{order.order_number}</span>
                              <span className="block text-[10px] font-bold text-orange-400 uppercase">
                                {order.order_type} {order.table_id ? "• TABLE" : ""}
                              </span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isLate ? "bg-red-500/20 text-red-400" : "bg-slate-800 text-slate-300"}`}>
                              {elapsedMins}m / {order.preparation_time_minutes}m
                            </span>
                          </div>

                          {/* Customer & Special Notes */}
                          <div className="text-xs text-slate-300">
                            <span className="font-semibold">{order.customer_name}</span>
                            {order.special_instructions && (
                              <p className="text-[11px] text-amber-300 bg-amber-500/10 p-1.5 rounded mt-1 border border-amber-500/20">
                                ⚠️ Special: {order.special_instructions}
                              </p>
                            )}
                          </div>

                          {/* Order Items */}
                          <div className="space-y-1.5 border-t border-slate-800 pt-2">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex justify-between items-center text-xs font-bold text-slate-200">
                                <span>{item.quantity}x {item.product_name}</span>
                                {item.variant_name && <span className="text-[10px] text-slate-400">({item.variant_name})</span>}
                              </div>
                            ))}
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-2 border-t border-slate-800">
                            {order.status === "PENDING" && (
                              <button
                                onClick={() => handleStatusChange(order.id, "ACCEPTED")}
                                className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                              >
                                Accept Order
                              </button>
                            )}
                            {order.status === "ACCEPTED" && (
                              <button
                                onClick={() => handleStatusChange(order.id, "PREPARING")}
                                className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
                              >
                                Start Cooking
                              </button>
                            )}
                            {order.status === "PREPARING" && (
                              <button
                                onClick={() => handleStatusChange(order.id, "READY")}
                                className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                              >
                                Mark Ready
                              </button>
                            )}
                            {order.status === "READY" && (
                              <button
                                onClick={() => handleStatusChange(order.id, "COMPLETED")}
                                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                              >
                                Complete Order
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}
