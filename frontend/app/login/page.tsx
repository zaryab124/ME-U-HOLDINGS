"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { api } from "@/lib/api";
import { setStoredSession } from "@/lib/authStore";
import { User, Lock, KeyRound, ArrowRight, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", {
        username_or_email: usernameOrEmail,
        password,
      });

      const userObj = {
        id: res.data.user_id,
        username: usernameOrEmail,
        email: usernameOrEmail.includes("@") ? usernameOrEmail : `${usernameOrEmail}@restaurant.com`,
        full_name: res.data.full_name,
        role: res.data.role,
        branch_id: res.data.branch_id,
        is_active: true,
      };

      setStoredSession(res.data.access_token, res.data.refresh_token, userObj);

      // Role-based portal redirection
      switch (res.data.role) {
        case "OWNER":
          router.push("/owner");
          break;
        case "ADMIN":
          router.push("/admin");
          break;
        case "BRANCH_MANAGER":
          router.push("/branch");
          break;
        case "KITCHEN_MANAGER":
        case "KITCHEN_STAFF":
          router.push("/kitchen");
          break;
        case "RIDER":
          router.push("/rider");
          break;
        default:
          router.push("/menu");
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (user: string, pass: string) => {
    setUsernameOrEmail(user);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="max-w-md mx-auto px-4 py-16 w-full flex-grow flex items-center justify-center">
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl w-full space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-orange-600/20 text-orange-400 flex items-center justify-center mx-auto border border-orange-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-white">Platform Staff Sign In</h1>
            <p className="text-xs text-slate-400">
              Access Owner, Admin, Branch, Kitchen, Cashier or Rider Portals.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">Username or Email</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="owner or manager.main@..."
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Authenticating..." : <>Sign In <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="border-t border-slate-800 pt-4 text-xs space-y-2">
            <span className="text-slate-500 font-semibold block text-center uppercase tracking-wider text-[10px]">
              Development Quick Logins
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button onClick={() => quickLogin("owner", "password123")} className="p-2 rounded-lg bg-purple-950/40 border border-purple-500/20 text-purple-300 hover:bg-purple-900/40 font-semibold">
                👑 Owner
              </button>
              <button onClick={() => quickLogin("admin", "password123")} className="p-2 rounded-lg bg-blue-950/40 border border-blue-500/20 text-blue-300 hover:bg-blue-900/40 font-semibold">
                🛡️ Admin
              </button>
              <button onClick={() => quickLogin("mgr_main", "password123")} className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-900/40 font-semibold">
                🏪 Branch Mgr
              </button>
              <button onClick={() => quickLogin("chef_main", "password123")} className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/20 text-amber-300 hover:bg-amber-900/40 font-semibold">
                👨‍🍳 Kitchen Chef
              </button>
              <button onClick={() => quickLogin("rider1", "password123")} className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-900/40 font-semibold col-span-2">
                🛵 Delivery Rider
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
