"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { api } from "@/lib/api";
import { Order } from "@/lib/types";
import { Bike, MapPin, Phone, CheckCircle, Navigation } from "lucide-react";

export default function RiderPortalPage() {
  const [deliveries, setDeliveries] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssigned = () => {
    api.get<Order[]>("/delivery/assigned")
      .then((res) => setDeliveries(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAssigned();
  }, []);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      await api.put(`/delivery/${orderId}/status?delivery_status=${status}`);
      fetchAssigned();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8 w-full flex-grow space-y-6">
        
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold">
            <Bike className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Rider Express Portal</h1>
            <p className="text-xs text-slate-400">View active delivery routes & update customer order status</p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Loading assigned deliveries...</p>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center">
            <Bike className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No active delivery assignments</h3>
            <p className="text-xs text-slate-400 mt-1">Check back soon for new dispatch orders.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {deliveries.map((order) => (
              <div key={order.id} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs text-cyan-400 font-bold uppercase block">Delivery Target</span>
                    <h3 className="text-lg font-extrabold text-white">{order.order_number}</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30 uppercase">
                    {order.delivery_status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-500 font-semibold block">Customer Details</span>
                    <span className="text-white font-bold block">{order.customer_name}</span>
                    <span className="text-slate-300 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-500" /> {order.customer_phone}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 font-semibold block">Delivery Address</span>
                    <span className="text-slate-200 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      {order.delivery_address || "N/A"}
                    </span>
                  </div>
                </div>

                {order.delivery_notes && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-amber-300">
                    📝 Notes: {order.delivery_notes}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
                  {order.delivery_status === "RIDER_ASSIGNED" && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, "PICKED_UP")}
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                    >
                      Confirm Pickup at Branch
                    </button>
                  )}
                  {order.delivery_status === "PICKED_UP" && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, "ON_THE_WAY")}
                      className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <Navigation className="w-4 h-4" /> Start Delivery Route
                    </button>
                  )}
                  {order.delivery_status === "ON_THE_WAY" && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, "DELIVERED")}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" /> Mark Order Delivered
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
