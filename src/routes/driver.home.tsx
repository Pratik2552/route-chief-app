import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, MapPin, Route as RouteIcon, Truck, Zap, Navigation, ArrowRight, Activity, ShieldCheck } from "lucide-react";
import { DriverShell } from "@/components/driver/DriverShell";
import { useDriver } from "@/lib/driver-store";
import { BINS, VEHICLE } from "@/lib/driver-data";

export const Route = createFileRoute("/driver/home")({
  head: () => ({
    meta: [
      { title: "Driver Duty Dashboard | CivicSync" },
      {
        name: "description",
        content:
          "Start your shift, check vehicle load and view your assigned waste collection route.",
      },
    ],
  }),
  component: DriverHome,
});

function DriverHome() {
  const { state, setOnDuty, startRoute, collectedCount, nextBinId } = useDriver();
  const navigate = useNavigate();
  const pct = Math.round((state.loadKg / VEHICLE.maxCapacityKg) * 100);

  // Retrieve Driver Session Data
  const storedVehicleData = typeof window !== 'undefined' ? localStorage.getItem('civicsync_vehicle_data') : null;
  const vehicleObj = storedVehicleData ? JSON.parse(storedVehicleData) : null;
  const driverName = vehicleObj?.driver_name || vehicleObj?.driverName || "Driver";
  const licensePlate = vehicleObj?.license_plate || "MH-15-EX-4021";
  const territoryZone = vehicleObj?.territory_name || vehicleObj?.ward || "Zone A - North Nashik";

  return (
    <DriverShell title="Driver Operations Center" subtitle={`Active Shift Control • ${territoryZone}`}>
      <div className="p-6 space-y-6 max-w-[1700px] mx-auto">
        
        {/* Top Hero Banner */}
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-orange-950/30 to-slate-900 p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-orange-600/10 blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-extrabold text-orange-400 border border-orange-500/20">
                <Activity className="h-3.5 w-3.5" /> Fleet Telemetry Live
              </div>
              <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight">
                Welcome Back, <span className="text-orange-400">{driverName}</span>
              </h2>
              <p className="text-sm font-semibold text-slate-300 max-w-2xl">
                Assigned Vehicle: <span className="text-white font-extrabold">{licensePlate}</span> • Territory: <span className="text-amber-400 font-extrabold">{territoryZone}</span>
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => setOnDuty(!state.onDuty)}
                className={`flex items-center gap-2.5 rounded-2xl px-6 py-4 text-sm font-black uppercase tracking-wider transition-all duration-200 shadow-xl ${
                  state.onDuty
                    ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/30"
                    : "bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <Zap className="h-5 w-5" />
                {state.onDuty ? "Shift Active (End Shift)" : "Start Duty Shift"}
              </button>

              <button
                onClick={() => {
                  startRoute();
                  navigate({ to: "/driver/territory" as any });
                }}
                className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 px-7 py-4 text-sm font-black uppercase tracking-wider text-white hover:from-orange-500 hover:to-amber-500 shadow-xl shadow-orange-600/30 transition-all"
              >
                <Navigation className="h-5 w-5" />
                Launch Fullscreen Map <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 3 Telemetry Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Shift Status */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <span className="text-xs font-black uppercase tracking-widest text-slate-300">Shift Duty Status</span>
              <span className={`rounded-full px-3 py-1 text-xs font-black uppercase border ${
                state.onDuty ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-slate-800 text-slate-400 border-slate-700"
              }`}>
                {state.onDuty ? "On Duty" : "Off Duty"}
              </span>
            </div>
            <div className="text-3xl font-black text-white">
              {state.onDuty ? "Active Duty Shift" : "Standby Mode"}
            </div>
            <p className="text-xs font-semibold text-slate-300">
              {state.onDuty ? "GPS telemetry streaming active. All pickups logged live." : "Press 'Start Duty Shift' to begin recording bin pickups."}
            </p>
          </div>

          {/* Card 2: Vehicle Payload Meter */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <span className="text-xs font-black uppercase tracking-widest text-slate-300">Truck Load Capacity</span>
              <span className="text-xs font-extrabold text-orange-400">{pct}% Full</span>
            </div>
            <div>
              <div className="text-3xl font-black text-white">
                {state.loadKg} <span className="text-base font-bold text-slate-400">/ {VEHICLE.maxCapacityKg} kg</span>
              </div>
              <p className="text-xs font-bold text-slate-300 mt-1">
                {VEHICLE.maxCapacityKg - state.loadKg} kg payload margin available
              </p>
            </div>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${pct >= 90 ? "bg-red-500" : pct >= 60 ? "bg-amber-500" : "bg-emerald-500"}`} 
                style={{ width: `${pct}%` }} 
              />
            </div>
          </div>

          {/* Card 3: Route Progress */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <span className="text-xs font-black uppercase tracking-widest text-slate-300">Assigned Route</span>
              <span className="text-xs font-extrabold text-amber-400">{BINS.length} Total Bins</span>
            </div>
            <div className="text-3xl font-black text-white">
              {collectedCount} <span className="text-base font-bold text-slate-400">/ {BINS.length} Picked</span>
            </div>
            <p className="text-xs font-semibold text-slate-300">
              Territory Zone: <span className="text-white font-bold">{territoryZone}</span>
            </p>
          </div>

        </div>

        {/* Quick Launch Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div 
            onClick={() => navigate({ to: "/driver/territory" as any })}
            className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl hover:border-orange-500/50 hover:bg-slate-900/80 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-600/20 text-orange-400 border border-orange-500/30 group-hover:scale-110 transition-transform">
                <MapPin className="h-7 w-7" />
              </div>
              <ArrowRight className="h-6 w-6 text-slate-500 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-xl font-black text-white mt-6">My Territory Map View</h3>
            <p className="text-sm font-semibold text-slate-300 mt-2">
              View your exclusive geofenced zone, interactive Leaflet map, and updated shortest collection route.
            </p>
          </div>

          <div 
            onClick={() => navigate({ to: "/driver/navigation" as any })}
            className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl hover:border-amber-500/50 hover:bg-slate-900/80 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-600/20 text-amber-400 border border-amber-500/30 group-hover:scale-110 transition-transform">
                <Navigation className="h-7 w-7" />
              </div>
              <ArrowRight className="h-6 w-6 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-xl font-black text-white mt-6">Route Navigation Engine</h3>
            <p className="text-sm font-semibold text-slate-300 mt-2">
              Follow turn-by-turn navigation paths (NN + 2-opt shortest route), update YES/NO collection status live.
            </p>
          </div>

        </div>

      </div>
    </DriverShell>
  );
}
