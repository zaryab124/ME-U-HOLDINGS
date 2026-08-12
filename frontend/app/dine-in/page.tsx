"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { api } from "@/lib/api";
import { QrCode, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DineInPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validatedData, setValidatedData] = useState<any>(null);

  // Check URL query param for ?qr=...
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const qrParam = urlParams.get("qr");
      if (qrParam) {
        setToken(qrParam);
        verifyQR(qrParam);
      }
    }
  }, []);

  const verifyQR = async (tokenToVerify: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/qr/validate?token=${encodeURIComponent(tokenToVerify)}`);
      setValidatedData(res.data);
      // Store in localStorage for table order session
      localStorage.setItem("dine_in_table", JSON.stringify(res.data));
      localStorage.setItem("selected_branch_id", res.data.branch_id);
    } catch (err: any) {
      setError(err.message || "Invalid or expired table QR code.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token) {
      verifyQR(token);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="max-w-xl mx-auto px-4 py-12 w-full flex-grow flex items-center justify-center">
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-orange-600/20 text-orange-400 flex items-center justify-center mx-auto border border-orange-500/30">
            <QrCode className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white">Dine-In Table Ordering</h1>
            <p className="text-xs text-slate-400 mt-1">
              Scan the unique QR code on your restaurant table to place instant kitchen orders.
            </p>
          </div>

          {validatedData ? (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-left space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle className="w-5 h-5" /> Verified Table Location
              </div>
              <div className="text-xs text-slate-300 space-y-1 border-t border-emerald-500/20 pt-2">
                <p><strong className="text-white">Branch:</strong> {validatedData.branch_name}</p>
                <p><strong className="text-white">Table Number:</strong> {validatedData.table_number}</p>
                <p><strong className="text-white">Seating Capacity:</strong> {validatedData.seats} Seats</p>
              </div>

              <button
                onClick={() => router.push("/menu")}
                className="w-full py-3 mt-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20"
              >
                Proceed to Food Menu <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4 text-left">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4" /> {error}
                </div>
              )}

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Enter QR Code Token (or Scan with Camera)
                </label>
                <input
                  type="text"
                  placeholder="TBL-BR-MAIN-T01-1a2b3c4d"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "Verifying Token..." : "Validate Table Location"}
              </button>
            </form>
          )}

          <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-4">
            🔒 Backend verification prevents client-side table or branch forgery.
          </div>
        </div>
      </main>
    </div>
  );
}
