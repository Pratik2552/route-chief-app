import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Truck, ShieldCheck, User, Lock } from "lucide-react";
import { useVehicleAuthority, API_BASE_URL } from "@/lib/vehicle-authority-store";

export const Route = createFileRoute("/vehicle/login")({
  head: () => ({
    meta: [
      { title: "Vehicle Operator Login | CivicSync" },
      { name: "description", content: "Secure login portal for vehicle operators." },
    ],
  }),
  component: VehicleLoginPage,
});

function VehicleLoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useVehicleAuthority();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const baseUrl = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;
      const response = await fetch(`${baseUrl}/auth/vehicle/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          identifier: username.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        localStorage.setItem("civicsync_vehicle_token", data.access_token);
        localStorage.setItem("civicsync_vehicle_data", JSON.stringify(data.vehicle));
        window.location.href = "/driver/territory";
      } else {
        setError(data.error || "Login failed. Please check credentials.");
      }
    } catch (err: any) {
      console.error("Vehicle login frontend error:", err);
      setError(err?.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans antialiased">
      {/* Top Banner */}
      <div className="border-b border-slate-800 bg-slate-900/90 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white font-black">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <span className="text-lg font-black uppercase text-white tracking-wider">CivicSync</span>
            <span className="block text-[10px] font-bold text-orange-400 uppercase tracking-widest">Driver &amp; Vehicle Operations</span>
          </div>
        </div>
        <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
          Municipal Operations Gateway
        </div>
      </div>

      {/* Main Container */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          
          {/* Header Badge */}
          <div className="mb-6 text-center bg-slate-900 border border-slate-800 shadow-2xl p-6 rounded-t-2xl border-t-4 border-t-orange-600">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-600/20 text-orange-400 border border-orange-500/30">
              <Truck className="h-8 w-8" />
            </div>
            <div className="flex items-center justify-center space-x-1.5 text-xs font-extrabold text-emerald-400 uppercase tracking-widest mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Secure Authentication Gateway</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase">
              CivicSync
            </h1>
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mt-1">
              Municipal Fleet &amp; Vehicle Portal
            </p>
          </div>

          {/* Login Card Body */}
          <div className="bg-slate-900 border border-slate-800 border-t-0 shadow-2xl p-8 rounded-b-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <h2 className="text-lg font-black uppercase text-white tracking-wide">
                Operator Login
              </h2>
              <span className="text-xs font-mono bg-slate-950 text-orange-400 px-3 py-1 rounded-lg border border-slate-800 font-bold">
                AUTH_LEVEL_2
              </span>
            </div>

            {error && (
              <div className="mb-6 border-l-4 border-red-500 bg-red-950/40 p-4 rounded-r-xl">
                <p className="text-xs font-bold text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="username"
                  className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-300"
                >
                  Email or Vehicle License Plate
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3.5 pl-11 pr-4 text-sm font-bold text-white placeholder:text-slate-600 focus:border-orange-500 focus:outline-none transition-all"
                    placeholder="operator@civicsync.gov or MH-15-EX-4021"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-300"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3.5 pl-11 pr-4 text-sm font-bold text-white placeholder:text-slate-600 focus:border-orange-500 focus:outline-none transition-all"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-orange-600 py-4 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-orange-600/30 hover:bg-orange-500 disabled:opacity-50 transition-all"
              >
                {loading ? "Authenticating Session..." : "Sign In to Driver Terminal"}
              </button>
            </form>

            <div className="mt-8 space-y-4">
              <div className="border-t border-slate-800 pt-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-xs font-extrabold text-orange-400 mb-2 uppercase tracking-wide">
                    Operator Instructions
                  </p>
                  <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside font-semibold">
                    <li>Use official credentials issued by the municipal transport admin</li>
                    <li>Vehicle identifier format: <code className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-amber-400 font-mono">MH-15-EX-4021</code></li>
                    <li>All login sessions are logged for audit compliance</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs font-semibold text-slate-500">
              Need assistance or password reset? Contact your regional system administrator.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800 bg-slate-900 px-6 py-4 text-center text-xs font-semibold text-slate-500">
        CivicSync Waste Management System &copy; 2026. All rights reserved.
      </div>
    </div>
  );
}