"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { api } from "@/lib/api";
import { Branch, Product, ProductVariant, ProductAddon } from "@/lib/types";
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag, Truck, Utensils, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CartItem {
  product: Product;
  variant?: ProductVariant;
  addons: ProductAddon[];
  quantity: number;
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEAWAY" | "DELIVERY">("DELIVERY");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch {}
    }

    api.get<Branch[]>("/branches/").then((res) => {
      setBranches(res.data);
      const storedId = localStorage.getItem("selected_branch_id");
      const found = res.data.find((b) => b.id === storedId);
      setSelectedBranch(found || res.data[0]);
    });
  }, []);

  const updateQuantity = (index: number, delta: number) => {
    const updated = [...cart];
    updated[index].quantity += delta;
    if (updated[index].quantity <= 0) {
      updated.splice(index, 1);
    }
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  const removeItem = (index: number) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  const subtotal = cart.reduce((acc, item) => {
    const pPrice = item.variant ? item.variant.price : item.product.price;
    const aPrice = item.addons.reduce((a, addon) => a + addon.price, 0);
    return acc + (pPrice + aPrice) * item.quantity;
  }, 0);

  const tax = subtotal * 0.05;
  const deliveryFee = orderType === "DELIVERY" ? 3.50 : 0.0;
  const total = subtotal + tax + deliveryFee;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!selectedBranch) {
      setErrorMessage("Please select a branch.");
      return;
    }

    if (orderType === "DELIVERY" && !selectedBranch.delivery_enabled) {
      setErrorMessage("Delivery is currently disabled for this branch. Please choose Dine-in or Takeaway.");
      return;
    }

    if (cart.length === 0) {
      setErrorMessage("Your cart is empty.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        branch_id: selectedBranch.id,
        order_type: orderType,
        customer_name: customerName,
        customer_phone: customerPhone,
        delivery_address: orderType === "DELIVERY" ? deliveryAddress : undefined,
        delivery_notes: orderType === "DELIVERY" ? deliveryNotes : undefined,
        special_instructions: specialInstructions,
        payment_method: paymentMethod,
        items: cart.map((item) => ({
          product_id: item.product.id,
          variant_id: item.variant?.id,
          quantity: item.quantity,
          addons: item.addons.map((a) => ({ name: a.name, price: a.price })),
        })),
      };

      const res = await api.post("/orders/", payload);
      // Clear cart
      localStorage.removeItem("cart");
      // Redirect to real-time order tracking
      router.push(`/order-status/${res.data.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed placing order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar selectedBranch={selectedBranch} cartCount={cart.length} />

      <main className="max-w-7xl mx-auto px-4 py-8 w-full flex-grow">
        <Link href="/menu" className="inline-flex items-center gap-1 text-xs text-orange-400 font-semibold mb-6 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Food Menu
        </Link>

        <h1 className="text-3xl font-black text-white mb-8 flex items-center gap-3">
          <ShoppingBag className="w-8 h-8 text-orange-500" /> Checkout & Order Review
        </h1>

        {cart.length === 0 ? (
          <div className="text-center py-20 glass-panel rounded-3xl border border-slate-800">
            <ShoppingBag className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Your cart is currently empty</h2>
            <p className="text-xs text-slate-400 mb-6">Explore our 6 branches and add your favorite meals.</p>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-500 shadow-lg shadow-orange-600/20"
            >
              Browse Food Menu
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Items List */}
            <div className="lg:col-span-7 space-y-4">
              <h2 className="text-lg font-bold text-white mb-2">Order Items ({cart.length})</h2>

              {cart.map((item, idx) => {
                const pPrice = item.variant ? item.variant.price : item.product.price;
                const aPrice = item.addons.reduce((a, addon) => a + addon.price, 0);
                const itemTotal = (pPrice + aPrice) * item.quantity;

                return (
                  <div key={idx} className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
                    <div className="flex-grow">
                      <h4 className="font-bold text-white text-sm">{item.product.name}</h4>
                      {item.variant && (
                        <span className="text-xs text-orange-400 font-medium block">
                          Size: {item.variant.name} (${item.variant.price.toFixed(2)})
                        </span>
                      )}
                      {item.addons.length > 0 && (
                        <p className="text-[11px] text-slate-400">
                          Addons: {item.addons.map((a) => a.name).join(", ")}
                        </p>
                      )}
                      <span className="text-xs font-bold text-slate-300 mt-1 block">
                        ${(pPrice + aPrice).toFixed(2)} each
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                        <button
                          onClick={() => updateQuantity(idx, -1)}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-white">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(idx, 1)}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-sm font-extrabold text-orange-400 min-w-[60px] text-right">
                        ${itemTotal.toFixed(2)}
                      </span>

                      <button
                        onClick={() => removeItem(idx)}
                        className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Special Instructions */}
              <div className="glass-panel p-4 rounded-2xl border border-slate-800 mt-6">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Kitchen Special Instructions
                </label>
                <textarea
                  placeholder="E.g., No onions, extra crispy fries, sauce on the side..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-orange-500 h-20"
                />
              </div>
            </div>

            {/* Order Details & Checkout Form */}
            <div className="lg:col-span-5">
              <form onSubmit={handleCheckout} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
                <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
                  Delivery & Contact Information
                </h3>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                    ⚠️ {errorMessage}
                  </div>
                )}

                {/* Branch Display */}
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Fulfilling Branch</label>
                  <select
                    value={selectedBranch?.id || ""}
                    onChange={(e) => {
                      const b = branches.find((item) => item.id === e.target.value);
                      if (b) {
                        setSelectedBranch(b);
                        localStorage.setItem("selected_branch_id", b.id);
                      }
                    }}
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-orange-500"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city}) {!b.delivery_enabled ? "- No Delivery" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Order Type Tabs */}
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-2">Order Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["DELIVERY", "TAKEAWAY", "DINE_IN"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setOrderType(type)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                          orderType === type
                            ? "bg-orange-600 border-orange-500 text-white shadow-md shadow-orange-600/20"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        {type.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Customer Details */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="David Beckham"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="+1-555-0199"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {orderType === "DELIVERY" && (
                    <>
                      <div>
                        <label className="text-xs text-slate-400 font-semibold block mb-1">Delivery Street Address</label>
                        <textarea
                          required
                          placeholder="Apt 4B, 250 Ocean Avenue, Downtown"
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-orange-500 h-16"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 font-semibold block mb-1">Rider Delivery Notes</label>
                        <input
                          type="text"
                          placeholder="Gate code 1234, ring doorbell..."
                          value={deliveryNotes}
                          onChange={(e) => setDeliveryNotes(e.target.value)}
                          className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Payment Method */}
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-orange-500"
                  >
                    <option value="CASH">Cash on Delivery / Pickup</option>
                    <option value="CARD">Credit / Debit Card</option>
                    <option value="ONLINE">Online Wallet Payment</option>
                  </select>
                </div>

                {/* Financial Summary */}
                <div className="border-t border-slate-800 pt-4 space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span>Items Subtotal</span>
                    <span className="font-semibold text-white">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (5%)</span>
                    <span className="font-semibold text-white">${tax.toFixed(2)}</span>
                  </div>
                  {orderType === "DELIVERY" && (
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span className="font-semibold text-white">${deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-800 pt-3 text-sm font-extrabold text-orange-400">
                    <span>Total Amount</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-sm shadow-xl shadow-orange-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Place Order (${total.toFixed(2)}) <CheckCircle className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
