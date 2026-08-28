import { Link } from "@tanstack/react-router";
import { 
  Home, Map, User, QrCode, FileText, Navigation, Truck, 
  LogOut, Maximize2, Minimize2, Menu, X, CheckCircle2, ChevronRight, Activity 
} from "lucide-react";
import { useState, useEffect, useRef, type ReactNode } from "react";

const NAV = [
  { to: "/driver/home", label: "Dashboard", icon: Home, badge: "Live" },
  { to: "/driver/territory", label: "My Territory Map", icon: Map, badge: "GPS" },
  { to: "/driver/navigation", label: "Route Navigation", icon: Navigation, badge: "Optimized" },
  { to: "/driver/live-reports", label: "Incident Reports", icon: FileText },
  { to: "/driver/qr-generator", label: "QR Code Pass", icon: QrCode },
  { to: "/driver/profile", label: "Driver Profile", icon: User },
] as const;

export function DriverShell({
  title,
  subtitle,
  children,
  nextBinId,
  flush,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  nextBinId?: string | null;
  flush?: boolean;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);

  // Retrieve Driver Session Data
  const storedVehicleData = typeof window !== 'undefined' ? localStorage.getItem('civicsync_vehicle_data') : null;
  const vehicleObj = storedVehicleData ? JSON.parse(storedVehicleData) : null;
  const driverName = vehicleObj?.driver_name || vehicleObj?.driverName || "Driver";
  const licensePlate = vehicleObj?.license_plate || "MH-15-EX-4021";
  const territoryZone = vehicleObj?.territory_name || vehicleObj?.ward || "Zone A - North Nashik";

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Fullscreen request failed: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('civicsync_vehicle_token');
      localStorage.removeItem('civicsync_vehicle_data');
      window.location.href = '/vehicle/login';
    }
  };

  return (
    <div ref={shellRef} className="flex min-h-screen w-full bg-slate-950 text-slate-100 font-sans antialiased selection:bg-orange-600 selection:text-white">
      
      {/* LEFT SIDEBAR (Desktop Widescreen Layout) */}
      <aside 
        className={`fixed inset-y-0 left-0 z-[600] flex flex-col border-r border-slate-800 bg-slate-900/95 backdrop-blur-xl transition-all duration-300 ${
          sidebarOpen ? "w-72" : "w-20"
        } max-lg:${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:static lg:translate-x-0`}
      >
        {/* Sidebar Brand Header */}
        <div className="flex h-20 items-center justify-between border-b border-slate-800/80 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 shadow-lg shadow-orange-600/30">
              <Truck className="h-6 w-6 text-white" />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col">
                <span className="text-lg font-black uppercase tracking-wider text-white">CivicSync</span>
                <span className="text-xs font-bold tracking-widest text-orange-400">DRIVER PORTAL</span>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            <ChevronRight className={`h-4 w-4 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Driver Badge Card */}
        {sidebarOpen && (
          <div className="mx-4 mt-5 rounded-xl border border-orange-500/20 bg-gradient-to-b from-orange-950/20 to-slate-900/40 p-4 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
                </span>
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">ACTIVE ON DUTY</span>
              </div>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold tracking-widest text-slate-300">{licensePlate}</span>
            </div>
            
            <h4 className="mt-2 text-base font-black text-white truncate flex items-center gap-1.5">
              <User className="h-4 w-4 text-orange-400 shrink-0" /> {driverName}
            </h4>
            <p className="mt-0.5 text-xs font-semibold text-slate-400 truncate">{territoryZone}</p>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon, badge }) => {
            const isCollect = to === "/driver/collect/$binId";
            const targetTo = isCollect ? "/driver/territory" : to;

            return (
              <Link
                key={to}
                to={targetTo}
                activeProps={{
                  className: "bg-orange-600 text-white font-extrabold shadow-lg shadow-orange-600/25 border-l-4 border-amber-300",
                }}
                inactiveProps={{
                  className: "text-slate-300 hover:bg-slate-800/80 hover:text-white font-bold",
                }}
                className="flex items-center gap-3.5 rounded-xl px-4 py-3.5 text-sm transition-all duration-200"
              >
                <Icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && (
                  <div className="flex flex-1 items-center justify-between">
                    <span className="tracking-wide text-white">{label}</span>
                    {badge && (
                      <span className="rounded-full bg-orange-500/20 px-2.5 py-0.5 text-[10px] font-black text-orange-300 border border-orange-400/20">
                        {badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-800/80 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-red-500/30 bg-red-950/20 py-3 text-xs font-extrabold uppercase tracking-wider text-red-400 transition-colors hover:bg-red-900/40 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span>Sign Out Duty</span>}
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <div className="flex flex-1 flex-col min-w-0 bg-slate-950 overflow-y-auto">
        
        {/* Top Header Bar */}
        <header className="sticky top-0 z-[550] flex h-20 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black uppercase tracking-wide text-white">{title}</h1>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3" /> Live Telemetry
                </span>
              </div>
              {subtitle ? <p className="text-xs font-semibold text-slate-300">{subtitle}</p> : null}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Fullscreen Map Toggle */}
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-black uppercase tracking-wider text-white transition-all hover:bg-slate-700 hover:text-orange-400"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4 text-amber-400" /> : <Maximize2 className="h-4 w-4 text-orange-400" />}
              <span className="hidden md:inline">{isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}</span>
            </button>

            {/* Driver Quick Badge */}
            <div className="hidden sm:flex items-center gap-3 border-l border-slate-800 pl-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-600/30 border border-orange-500/40 text-orange-400 font-black text-sm">
                {driverName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-extrabold text-white">{driverName}</span>
                <span className="text-[10px] font-bold text-slate-400">{licensePlate}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main className={`flex-1 ${flush ? "p-0" : "p-6 space-y-6"}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
