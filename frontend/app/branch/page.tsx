"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { api } from "@/lib/api";
import { Order, User, Branch } from "@/lib/types";
import { getStoredUser } from "@/lib/authStore";
import { Store, DollarSign, AlertCircle, ShoppingBag, Package, Plus } from "lucide-react";

export default function BranchManagerPage() {
  const [user, setUser] = useState<User | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Expense Form
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState("Utilities");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("");

  const loadBranchData = (bId: string) => {
    setLoading(true);
    Promise.all([
      api.get<Branch>(`/branches/${bId}`),
      api.get<Order[]>(`/orders/?branch_id=${bId}`),
      api.get(`/inventory/items?branch_id=${bId}`),
      api.get(`/inventory/expenses?branch_id=${bId}`),
    ]).then(([bRes, oRes, iRes, eRes]) => {
      setBranch(bRes.data);
      setOrders(oRes.data);
      setInventory(iRes.data);
      setExpenses(eRes.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    const u = getStoredUser();
    setUser(u);

    const targetBranchId = u?.branch_id || localStorage.getItem("selected_branch_id");
    if (targetBranchId) {
      loadBranchData(targetBranchId);
    } else {
      setLoading(false);
    }
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branch) return;
    try {
      await api.post("/inventory/expenses", {
        branch_id: branch.id,
        category: expenseCategory,
        amount: parseFloat(expenseAmount),
        description: expenseDesc,
        date: new Date().toISOString(),
      });
      setShowExpenseModal(false);
      setExpenseAmount("");
      setExpenseDesc("");
      loadBranchData(branch.id);
    } catch (err) {
      console.error(err);
    }
  };

  const todaySales = orders
    .filter((o) => o.status === "COMPLETED")
    .reduce((acc, o) => acc + o.total_amount, 0);

  const pendingOrders = orders.filter((o) => o.status === "PENDING" || o.status === "PREPARING");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8 w-full flex-grow space-y-8">
        
        {/* Header */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">Isolated Branch Scope</span>
              <h1 className="text-2xl font-black text-white">{branch?.name || "Branch Manager Portal"}</h1>
              <p className="text-xs text-slate-400">{branch?.address}, {branch?.city}</p>
            </div>
          </div>

          <button
            onClick={() => setShowExpenseModal(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Record Branch Expense
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Loading branch operations & inventory data...</p>
          </div>
        ) : (
          <>
            {/* Top Branch Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-semibold block">Branch Today's Sales</span>
                <span className="text-2xl font-black text-emerald-400">${todaySales.toFixed(2)}</span>
              </div>
              <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-semibold block">Active Orders</span>
                <span className="text-2xl font-black text-orange-400">{pendingOrders.length} Pending</span>
              </div>
              <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-semibold block">Total Orders Recorded</span>
                <span className="text-2xl font-black text-white">{orders.length} Orders</span>
              </div>
            </div>

            {/* Inventory & Expenses */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Branch Inventory Stock */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Package className="w-5 h-5 text-emerald-400" /> Branch Inventory & Low Stock Alerts
                </h3>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {inventory.map((item) => (
                    <div key={item.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-white block">{item.ingredient}</span>
                        <span className="text-slate-400">Min Threshold: {item.minimum_stock} {item.unit}</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-extrabold ${item.is_low_stock ? "text-red-400" : "text-emerald-400"}`}>
                          {item.quantity} {item.unit}
                        </span>
                        {item.is_low_stock && (
                          <span className="block text-[10px] text-red-400 font-bold">⚠️ LOW STOCK</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Branch Expenses */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <DollarSign className="w-5 h-5 text-purple-400" /> Operating Expenses
                </h3>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {expenses.map((exp) => (
                    <div key={exp.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-white block">{exp.category}</span>
                        <span className="text-slate-400">{exp.description}</span>
                      </div>
                      <span className="font-extrabold text-purple-400">${exp.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </>
        )}

      </main>

      {/* Record Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleAddExpense} className="glass-panel w-full max-w-md rounded-3xl p-6 border border-slate-700 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Record Branch Expense</h3>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">Expense Category</label>
              <select
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-bold focus:outline-none"
              >
                <option value="Rent">Rent</option>
                <option value="Utilities">Utilities (Electricity/Gas/Water)</option>
                <option value="Salaries">Staff Wages</option>
                <option value="Maintenance">Equipment Repairs</option>
                <option value="Packaging">Packaging & Supplies</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="250.00"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">Description / Notes</label>
              <input
                type="text"
                placeholder="Details of expense..."
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 shadow-lg shadow-emerald-600/20"
              >
                Save Expense
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
