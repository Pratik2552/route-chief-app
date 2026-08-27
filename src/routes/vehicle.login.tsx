import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Truck, Lock, User, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/vehicle/login")({
  head: () => ({
    meta: [
      { title: "Vehicle Portal Login | CivicSync" },
      {
        name: "description",
        content: "Login to the Vehicle Portal with your unique vehicle credentials.",
      },
      { property: "og:title", content: "Vehicle Portal Login | CivicSync" },
      {
        property: "og:description",
        content: "Secure login portal for vehicle operators.",
      },
    ],
  }),
  component: VehicleLogin,
});

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

function VehicleLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log('🔐 Vehicle Login - API URL:', `${API_BASE_URL}/auth/vehicle/login`);
      
      const response = await fetch(`${API_BASE_URL}/auth/vehicle/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Login failed:', data);
        setError(data.error || "Login failed. Please check your credentials.");
        setLoading(false);
        return;
      }

      console.log('✅ Login successful:', data.vehicle);

      // Store vehicle auth data
      localStorage.setItem('civicsync_vehicle_token', data.access_token);
      localStorage.setItem('civicsync_vehicle_data', JSON.stringify(data.vehicle));

      // Redirect to vehicle dashboard
      navigate({ to: "/vehicle/dashboard" });
    } catch (error) {
      console.error("Login error:", error);
      setError("Network error. Please check your connection and ensure the backend server is running.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Government-style Top Strip */}
      <div className="bg-slate-900 text-slate-100 border-b-4 border-amber-500 py-2 px-6 flex justify-between items-center text-xs tracking-wider uppercase">
        <div className="flex items-center space-x-2 font-semibold">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>CivicSync Official Fleet Governance Network</span>
        </div>
        <div className="hidden sm:block text-slate-400">
          Government & Municipal Operations Portal
        </div>
      </div>

      {/* Main Container */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          
          {/* Header Badge */}
          <div className="mb-6 text-center bg-white border border-slate-300 shadow-sm p-6 rounded-t-lg border-t-4 border-t-blue-900">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-900 text-amber-400 shadow-inner">
              <Truck className="h-8 w-8" />
            </div>
            <div className="flex items-center justify-center space-x-1.5 text-xs font-bold text-blue-900 uppercase tracking-widest mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Secure Authentication Gateway</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-blue-950 uppercase">
              CivicSync
            </h1>
            <p className="text-sm font-bold uppercase tracking-wider text-slate-600 mt-1">
              Municipal Fleet & Vehicle Portal
            </p>
          </div>

          {/* Login Card Body */}
          <div className="bg-white border border-slate-300 border-t-0 shadow-md p-8 rounded-b-lg">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <h2 className="text-xl font-extrabold uppercase text-slate-800 tracking-wide">
                Operator Login
              </h2>
              <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded border border-slate-200">
                AUTH_LEVEL_2
              </span>
            </div>

            {error && (
              <div className="mb-6 border-l-4 border-red-600 bg-red-50 p-4 rounded-r">
                <p className="text-sm font-semibold text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username Field */}
              <div>
                <label
                  htmlFor="username"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Email or Vehicle Username
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full rounded border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 focus:outline-none transition-all"
                    placeholder="operator@civicsync.gov or VEH-ABC-123"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 focus:outline-none transition-all"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded bg-blue-900 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow hover:bg-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:ring-offset-2 disabled:opacity-50 transition-all"
              >
                {loading ? "Authenticating Session..." : "Sign In to Fleet Terminal"}
              </button>
            </form>

            {/* Gov Instructions / Info Box */}
            <div className="mt-8 space-y-4">
              <div className="border-t border-slate-200 pt-4">
                <div className="rounded border border-blue-100 bg-blue-50/60 p-4">
                  <p className="text-xs font-bold text-blue-900 mb-2 flex items-center space-x-1.5 uppercase tracking-wide">
                    <span>📌 Operator Instructions</span>
                  </p>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                    <li>Use official credentials issued by the municipal transport admin</li>
                    <li>Vehicle identifier format: <code className="bg-white px-1 py-0.5 rounded border border-blue-200 text-blue-900 font-mono">VEH-{"{"}license plate{"}"}</code></li>
                    <li>All login sessions are logged for audit compliance</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-6 text-center">
            <p className="text-xs font-medium text-slate-500">
              Need assistance or password reset? Contact your regional system administrator.
            </p>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">
              CivicSync Enterprise Resource Planning • Secure Portal v2.4
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}