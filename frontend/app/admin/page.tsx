"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { api } from "@/lib/api";
import { Branch, User, Product, Category, Table } from "@/lib/types";
import { ShieldAlert, Building2, Users, Utensils, QrCode, Plus, Edit, Trash2 } from "lucide-react";

export default function AdminPortalPage() {
  const [activeTab, setActiveTab] = useState<"branches" | "users" | "menu" | "tables">("branches");
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  
  const [loading, setLoading] = useState(true);

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      api.get<Branch[]>("/branches/"),
      api.get<User[]>("/users/"),
      api.get<Category[]>("/categories/"),
      api.get<Product[]>("/products/"),
    ]).then(([bRes, uRes, cRes, pRes]) => {
      setBranches(bRes.data);
      setUsers(uRes.data);
      setCategories(cRes.data);
      setProducts(pRes.data);
      if (bRes.data.length > 0) {
        api.get<Table[]>(`/tables/?branch_id=${bRes.data[0].id}`).then((tRes) => setTables(tRes.data));
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8 w-full flex-grow space-y-8">
        
        {/* Header */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">System Admin Control Center</h1>
              <p className="text-xs text-slate-400">Manage 6 branches, user roles, menu items, & dine-in tables</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab("branches")}
              className={`px-4 py-2 rounded-xl transition-all ${activeTab === "branches" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              Branches ({branches.length})
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 rounded-xl transition-all ${activeTab === "users" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab("menu")}
              className={`px-4 py-2 rounded-xl transition-all ${activeTab === "menu" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              Products ({products.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Loading admin system data...</p>
          </div>
        ) : (
          <div>
            {activeTab === "branches" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white">All 6 Branches</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {branches.map((b) => (
                    <div key={b.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-white">{b.name}</h4>
                        <span className="text-[10px] font-extrabold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">{b.code}</span>
                      </div>
                      <p className="text-xs text-slate-400">{b.address}, {b.city}</p>
                      <p className="text-xs text-slate-400">Phone: {b.phone}</p>
                      <div className="text-[11px] font-semibold text-emerald-400 pt-2 border-t border-slate-800">
                        Hours: {b.opening_time} - {b.closing_time}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="text-lg font-bold text-white">User RBAC Management</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold">
                        <th className="pb-3">Name</th>
                        <th className="pb-3">Email / Username</th>
                        <th className="pb-3">Role</th>
                        <th className="pb-3">Branch ID</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td className="py-3 font-bold text-white">{u.full_name}</td>
                          <td className="py-3">{u.email} ({u.username})</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-extrabold text-[10px] border border-purple-500/20">
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 text-slate-500">{u.branch_id || "GLOBAL"}</td>
                          <td className="py-3">
                            <span className="text-emerald-400 font-semibold">Active</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "menu" && (
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="text-lg font-bold text-white">Product Catalog & Cost Prices</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold">
                        <th className="pb-3">Product Name</th>
                        <th className="pb-3">Category</th>
                        <th className="pb-3">Selling Price</th>
                        <th className="pb-3">Cost Price (P&L)</th>
                        <th className="pb-3">Preparation Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {products.map((p) => (
                        <tr key={p.id}>
                          <td className="py-3 font-bold text-white">{p.name}</td>
                          <td className="py-3 text-slate-400">{p.category?.name || "Main"}</td>
                          <td className="py-3 text-orange-400 font-bold">${p.price.toFixed(2)}</td>
                          <td className="py-3 text-purple-400 font-semibold">${p.cost_price.toFixed(2)}</td>
                          <td className="py-3 text-slate-400">{p.preparation_time} Mins</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
