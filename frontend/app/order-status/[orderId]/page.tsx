"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { api } from "@/lib/api";
import { Order } from "@/lib/types";
import { useWebSocket } from "@/lib/useWebSocket";
import { CheckCircle2, Clock, Truck, ChefHat, AlertCircle, FileText, Star, Radio } from "lucide-react";

export default function OrderStatusPage() {
  const params = useParams();
  const orderId = params?.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Feedback State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [foodRating, setFoodRating] = useState(5);
  const [serviceRating, setServiceRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [writtenFeedback, setWrittenFeedback] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const fetchOrder = () => {
    api.get<Order>(`/orders/${orderId}`)
      .then((res) => setOrder(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId]);

  // Real-Time WebSocket Hook for Live Status Updates
  const { isConnected } = useWebSocket("order", orderId, (data) => {
    if (data.event === "order_updated" || data.event === "delivery_status_updated") {
      fetchOrder();
    }
  });

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    try {
      await api.post("/feedback/", {
        branch_id: order.branch_id,
        order_id: order.id,
        rating,
        food_rating: foodRating,
        service_rating: serviceRating,
        delivery_rating: order.order_type === "DELIVERY" ? deliveryRating : undefined,
        written_feedback: writtenFeedback,
      });
      setFeedbackSubmitted(true);
      setShowFeedbackModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Fetching real-time order status...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="glass-panel p-8 rounded-3xl border border-slate-800 text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-white">Order Not Found</h2>
            <p className="text-xs text-slate-400 mt-1">Please verify your order ID or tracking link.</p>
          </div>
        </div>
      </div>
    );
  }

  const steps = ["PENDING", "ACCEPTED", "PREPARING", "READY", "DELIVERED", "COMPLETED"];
  const currentStepIndex = steps.indexOf(order.status);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8 w-full flex-grow space-y-8">
        
        {/* Live Status Header Card */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
            <div>
              <span className="text-xs text-orange-400 font-extrabold uppercase tracking-wider block">Real-Time Tracker</span>
              <h1 className="text-2xl font-black text-white">{order.order_number}</h1>
              <p className="text-xs text-slate-400 mt-0.5">Order Type: <strong className="text-slate-200">{order.order_type}</strong></p>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300">
                <Radio className={`w-3 h-3 ${isConnected ? "text-emerald-400 animate-ping" : "text-slate-600"}`} />
                {isConnected ? "Live Socket Active" : "Polling Mode"}
              </span>
              <span className="px-4 py-1.5 rounded-xl bg-orange-600/20 text-orange-400 text-xs font-bold border border-orange-500/30 uppercase tracking-wider">
                {order.status}
              </span>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="grid grid-cols-6 gap-2 mb-6">
            {steps.map((step, idx) => {
              const isDone = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div key={step} className="text-center">
                  <div
                    className={`h-2 rounded-full mb-2 transition-all ${
                      isDone
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 shadow-md shadow-orange-500/30"
                        : "bg-slate-800"
                    }`}
                  />
                  <span className={`text-[10px] font-bold uppercase block truncate ${isCurrent ? "text-orange-400" : isDone ? "text-slate-300" : "text-slate-600"}`}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Preparation & Delivery Timer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-400" />
              <div>
                <span className="text-xs text-slate-400 block font-medium">Estimated Preparation</span>
                <span className="text-sm font-bold text-white">{order.preparation_time_minutes} Minutes Target</span>
              </div>
            </div>
            {order.order_type === "DELIVERY" && (
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-cyan-400" />
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Rider Delivery Status</span>
                  <span className="text-sm font-bold text-cyan-300">{order.delivery_status || "WAITING_FOR_RIDER"}</span>
                </div>
              </div>
            )}
          </div>

          {/* Feedback Trigger */}
          {order.status === "COMPLETED" && !feedbackSubmitted && (
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-orange-500/20"
            >
              <Star className="w-4 h-4 fill-current" /> Leave Customer Feedback
            </button>
          )}

          {feedbackSubmitted && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold text-center">
              ✓ Thank you for giving your valuable feedback!
            </div>
          )}
        </div>

        {/* Itemized Official Bill */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
            <FileText className="w-5 h-5 text-orange-400" /> Official Digital Bill / Receipt
          </h2>

          <div className="space-y-3 mb-6">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-xs py-2 border-b border-slate-800/60">
                <div>
                  <span className="font-bold text-white">{item.quantity}x {item.product_name}</span>
                  {item.variant_name && <span className="text-slate-400 block">({item.variant_name})</span>}
                </div>
                <span className="font-extrabold text-orange-400">${item.item_total.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800 pt-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-slate-200">${order.subtotal.toFixed(2)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Discount</span>
                <span>-${order.discount_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax (5%)</span>
              <span className="text-slate-200">${order.tax_amount.toFixed(2)}</span>
            </div>
            {order.delivery_fee > 0 && (
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="text-slate-200">${order.delivery_fee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-800">
              <span>Grand Total</span>
              <span className="text-orange-400">${order.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </main>

      {/* Customer Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleFeedbackSubmit} className="glass-panel w-full max-w-md rounded-3xl p-6 border border-slate-700 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-white">Rate Your Experience</h3>
            <p className="text-xs text-slate-400">Your feedback helps us continuously improve quality & service.</p>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">Overall Rating (1-5)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`p-2 rounded-xl text-lg ${rating >= star ? "text-amber-400" : "text-slate-700"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">Written Feedback</label>
              <textarea
                placeholder="Share your thoughts on food taste, packaging, speed..."
                value={writtenFeedback}
                onChange={(e) => setWrittenFeedback(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs h-24 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowFeedbackModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Skip
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-500 shadow-lg shadow-orange-600/20"
              >
                Submit Feedback
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
