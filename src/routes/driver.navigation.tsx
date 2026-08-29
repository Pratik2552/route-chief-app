import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { CheckCircle2, Navigation, Check, X, Building2, Truck, Maximize2, Minimize2, Compass, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { DriverShell } from "@/components/driver/DriverShell";

const RouteMap = lazy(() => import("@/components/driver/RouteMap"));
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export const Route = createFileRoute("/driver/navigation")({
  head: () => ({
    meta: [
      { title: "Territory Route Navigation | CivicSync Driver" },
      {
        name: "description",
        content: "Follow your assigned territory marked route, update bin collection (Yes/No), and return to depot.",
      },
    ],
  }),
  component: DriverNavigation,
});

interface KMLBin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  zone: string;
  isCollected: boolean;
}

interface KMLMapResponse {
  driverZone?: { name: string; coordinates: [number, number][] };
  driverZoneName?: string;
  route?: { name: string; coordinates: [number, number][] };
  bins?: KMLBin[];
  depot?: { name: string; lat: number; lng: number };
  isAllCollected?: boolean;
  progress?: { total: number; collected: number; percentage: number };
}

function DriverNavigation() {
  const [mounted, setMounted] = useState(false);
  const [kmlData, setKmlData] = useState<KMLMapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingBinName, setUpdatingBinName] = useState<string | null>(null);
  const [optimizedRoute, setOptimizedRoute] = useState<{ type: string; coordinates: [number, number][] } | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ totalDistanceKm: string; totalDurationMinutes: number; assignedBinCount: number; algorithm: string } | null>(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  // Fetch driver identity from stored session
  const storedVehicleData = typeof window !== 'undefined' ? localStorage.getItem('civicsync_vehicle_data') : null;
  const vehicleObj = storedVehicleData ? JSON.parse(storedVehicleData) : null;
  const driverName = vehicleObj?.driver_name || vehicleObj?.driverName || "Driver";
  const licensePlate = vehicleObj?.license_plate || "";
  const vehicleId = vehicleObj?.id || vehicleObj?.vehicle_id || vehicleObj?.vehicleId || null;

  const getMappedBinForDemoUser = () => {
    try {
      const savedUser = JSON.parse(localStorage.getItem('civicsync_user') || 'null');
      const email = (savedUser?.email || '').toLowerCase();
      if (email === 'zandu@gmail.com') {
        return { name: 'BIN-001', lat: 18.5308, lng: 73.8474, zone: 'Zone A' };
      }
    } catch (err) {
      console.warn('Demo bin mapping lookup failed:', err);
    }
    return null;
  };

  const getLastQrScanWithinHour = () => {
    try {
      const scan = JSON.parse(localStorage.getItem('civicsync_recent_bin_scan') || 'null');
      if (!scan) return null;
      if ((scan.email || '').toLowerCase() !== 'zandu@gmail.com') return null;
      const elapsedMs = Date.now() - new Date(scan.timestamp || Date.now()).getTime();
      if (elapsedMs > 60 * 60 * 1000) return null;
      return scan;
    } catch (err) {
      console.warn('Demo scan read failed:', err);
      return null;
    }
  };

  const getDriverDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const normalizeDemoBins = (data: KMLMapResponse | null): KMLMapResponse | null => {
    if (!data) return data;

    const mappedBin = getMappedBinForDemoUser();
    if (!mappedBin) return data;

    const normalizedBins = (data.bins || []).map((bin) => {
      const matchesMappedBin = bin.name.toLowerCase() === mappedBin.name.toLowerCase();
      return {
        ...bin,
        zone: matchesMappedBin ? mappedBin.zone : bin.zone,
        isCollected: matchesMappedBin ? !!bin.isCollected : false,
      };
    });

    const mappedExists = normalizedBins.some((bin) => bin.name.toLowerCase() === mappedBin.name.toLowerCase());
    const safeBins = mappedExists
      ? normalizedBins
      : [
          ...normalizedBins,
          {
            id: mappedBin.name,
            name: mappedBin.name,
            lat: mappedBin.lat,
            lng: mappedBin.lng,
            zone: mappedBin.zone,
            isCollected: false,
          },
        ];

    const collectedCount = safeBins.filter((bin) => bin.isCollected).length;

    return {
      ...data,
      bins: safeBins,
      isAllCollected: safeBins.length > 0 && collectedCount === safeBins.length,
      progress: {
        total: safeBins.length,
        collected: collectedCount,
        percentage: safeBins.length > 0 ? Math.round((collectedCount / safeBins.length) * 100) : 0,
      },
    };
  };

  const fetchDriverKMLMap = async () => {
    try {
      const token = localStorage.getItem('civicsync_vehicle_token');
      const queryParams = new URLSearchParams();
      if (licensePlate) queryParams.append('license_plate', licensePlate);
      if (driverName) queryParams.append('driver_name', driverName);

      const res = await fetch(`${API_BASE_URL}/kml/driver-map?${queryParams.toString()}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setKmlData(normalizeDemoBins(data));
      }
    } catch (err) {
      console.error("Failed to fetch driver KML map:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchDriverKMLMap();

    // Fetch optimized route from admin's last optimization run
    if (vehicleId) {
      fetch(`${API_BASE_URL}/routes/driver-route/${vehicleId}`)
        .then(r => r.json())
        .then(data => {
          if (data?.success && data.route?.geometry) {
            setOptimizedRoute(data.route.geometry);
            setRouteInfo({
              totalDistanceKm: data.route.totalDistanceKm,
              totalDurationMinutes: data.route.totalDurationMinutes,
              assignedBinCount: data.route.assignedBinCount,
              algorithm: data.route.algorithm || 'NN + 2-opt',
            });
          }
        })
        .catch(() => {});
    }

    const interval = setInterval(fetchDriverKMLMap, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMapExpanded) {
        setIsMapExpanded(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMapExpanded]);

  const handleToggleBinCollection = async (binName: string, targetStatus: boolean) => {
    setUpdatingBinName(binName);

    const mappedBin = getMappedBinForDemoUser();

    if (targetStatus && mappedBin && binName !== mappedBin.name) {
      toast.error(`Only ${mappedBin.name} is mapped for zandu@gmail.com in ${mappedBin.zone}.`);
      setUpdatingBinName(null);
      return;
    }

    let driverLat: number | undefined = undefined;
    let driverLng: number | undefined = undefined;

    if (targetStatus && typeof navigator !== 'undefined' && "geolocation" in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3500, enableHighAccuracy: true });
        }).catch(() => null);

        if (pos) {
          driverLat = pos.coords.latitude;
          driverLng = pos.coords.longitude;
        }
      } catch (e) {
        // Geolocation optional
      }
    }

    if (targetStatus && mappedBin && binName === mappedBin.name) {
      const recentScan = getLastQrScanWithinHour();
      if (!recentScan) {
        toast.error('No QR scan from zandu@gmail.com was found within the last 1 hour.');
        setUpdatingBinName(null);
        return;
      }

      if (driverLat === undefined || driverLng === undefined) {
        toast.error('Driver live location is required to validate BIN-001 collection.');
        setUpdatingBinName(null);
        return;
      }

      const driverDistanceKm = getDriverDistanceKm(driverLat, driverLng, recentScan.latitude, recentScan.longitude);
      if (driverDistanceKm > 0.25) {
        toast.error(`Location mismatch: driver is ${driverDistanceKm.toFixed(2)} km from the scanned BIN-001 location.`);
        setUpdatingBinName(null);
        return;
      }
    }

    try {
      const res = await fetch(`${API_BASE_URL}/kml/mark-collected`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          binName,
          collected: targetStatus,
          driverName,
          driverLat,
          driverLng,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Bin ${binName} set to ${targetStatus ? 'COLLECTED (YES)' : 'PENDING (NO)'}`);
        fetchDriverKMLMap();
      } else {
        toast.error(data.error || `Verification failed for bin ${binName}`);
      }
    } catch (err: any) {
      toast.error(err.message || `Failed to update status for bin ${binName}`);
    } finally {
      setUpdatingBinName(null);
    }
  };

  const bins = kmlData?.bins || [];
  const isAllDone = kmlData?.isAllCollected || (bins.length > 0 && bins.every(b => b.isCollected));
  const depot = kmlData?.depot || { name: "CENTRAL DEPOT", lat: 19.89518, lng: 74.48668 };

  const truckPos = {
    lat: bins.find(b => !b.isCollected)?.lat || depot.lat,
    lng: bins.find(b => !b.isCollected)?.lng || depot.lng,
  };

  const collectedCount = kmlData?.progress?.collected || bins.filter(b => b.isCollected).length;
  const progressPct = bins.length > 0 ? Math.round((collectedCount / bins.length) * 100) : 0;

  return (
    <DriverShell
      title={`Route Navigation: ${kmlData?.driverZoneName || 'Zone A'}`}
      subtitle={isAllDone ? "All Pickups Completed — Return to Depot" : `Follow marked path (${kmlData?.route?.name || 'ROUTE-TRUCK'})`}
      flush
    >
      <div className="p-6 space-y-6 max-w-[1700px] mx-auto">
        
        {/* Desktop 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT 8-COLS: Fullscreen/Expanded Map View */}
          <div className={`${isMapExpanded ? "fixed inset-0 z-[1000] bg-slate-950 p-4" : "lg:col-span-8 flex flex-col gap-4"}`}>
            
            <div className="relative rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col h-full">
              
              {/* Map Header Toolbar */}
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-5 py-3.5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30">
                    <Navigation className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-white tracking-wider">
                      Turn-by-Turn Route Navigation
                    </h3>
                    <p className="text-[11px] font-bold text-slate-300">
                      Destination: {isAllDone ? "Central Depot" : bins.find(b => !b.isCollected)?.name || "Next Dustbin"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsMapExpanded(!isMapExpanded)}
                  className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-extrabold uppercase text-slate-200 hover:bg-slate-700 hover:text-white transition-all"
                >
                  {isMapExpanded ? <Minimize2 className="h-4 w-4 text-amber-400" /> : <Maximize2 className="h-4 w-4 text-orange-400" />}
                  <span>{isMapExpanded ? "Normal View" : "Expand Map"}</span>
                </button>
              </div>

              {/* Optimized Route Ready Banner */}
              {optimizedRoute && routeInfo && !isAllDone && (
                <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-5 py-3 text-white flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-3">
                    <Navigation className="h-5 w-5 animate-pulse shrink-0" />
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider block">Shortest Path Calculated (NN + 2-opt)</span>
                      <span className="text-xs font-bold opacity-95">{routeInfo.assignedBinCount} stops · {routeInfo.totalDistanceKm} km · ~{routeInfo.totalDurationMinutes} min</span>
                    </div>
                  </div>
                  <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-black uppercase tracking-wider border border-white/30">
                    Follow Orange Path
                  </span>
                </div>
              )}

              {/* All Done Banner */}
              {isAllDone && (
                <div className="bg-emerald-600 px-5 py-3 text-white flex items-center justify-between shadow-md animate-pulse">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-6 w-6 shrink-0" />
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider block">Route Complete — All Bins Picked</span>
                      <span className="text-xs font-semibold opacity-95">Follow line back to Central Depot</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Map Canvas */}
              <div className={`${isMapExpanded ? "h-[calc(100vh-120px)]" : "h-[62vh] min-h-[480px]"} w-full relative bg-slate-950`}>
                {mounted ? (
                  <Suspense fallback={
                    <div className="flex h-full w-full items-center justify-center bg-slate-950 text-slate-400">
                      <RefreshCw className="h-8 w-8 animate-spin text-orange-500 mr-3" />
                      <span className="font-bold text-base">Loading Navigation Map…</span>
                    </div>
                  }>
                    <RouteMap
                      kmlData={kmlData}
                      vehicle={truckPos}
                      optimizedRoute={optimizedRoute}
                      isExpanded={isMapExpanded}
                      onToggleBin={(binName, currentStatus) => handleToggleBinCollection(binName, currentStatus)}
                    />
                  </Suspense>
                ) : null}

                {/* Floating Telemetry Overlay */}
                <div className="absolute top-4 right-4 z-[400] rounded-xl border border-slate-700 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md text-xs font-bold space-y-2 min-w-[200px]">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-300">Next Destination:</span>
                    <span className="font-black text-amber-400">
                      {isAllDone ? "Central Depot" : bins.find(b => !b.isCollected)?.name || "Bin"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Bins Collected:</span>
                    <span className="font-black text-emerald-400">{collectedCount} / {bins.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT 4-COLS: Bin Checklist & Controls */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Progress Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider">Route Progress</h3>
                  <div className="text-3xl font-black text-white mt-1">
                    {collectedCount} <span className="text-base font-bold text-slate-400">/ {bins.length} Stops</span>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border ${
                  isAllDone ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "bg-amber-500/20 text-amber-400 border-amber-500/40"
                }`}>
                  {isAllDone ? "Complete" : "In Progress"}
                </div>
              </div>

              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${isAllDone ? "bg-emerald-500" : "bg-gradient-to-r from-orange-600 to-amber-500"}`} 
                  style={{ width: `${progressPct}%` }} 
                />
              </div>
            </div>

            {/* Checklist */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl flex-1 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div>
                  <h3 className="text-base font-black text-white">Stops Checklist</h3>
                  <p className="text-xs font-semibold text-slate-300 mt-0.5">Toggle YES when emptied</p>
                </div>
                <span className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-extrabold text-slate-200 border border-slate-700">
                  {bins.length} Locations
                </span>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[550px] pr-1">
                {bins.map((bin, i) => {
                  const isCollected = bin.isCollected;
                  const isThisUpdating = updatingBinName === bin.name;

                  return (
                    <div
                      key={bin.id || bin.name}
                      className={`rounded-xl border p-4 transition-all duration-200 ${
                        isCollected
                          ? "border-emerald-500/40 bg-emerald-950/20"
                          : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white ${
                            isCollected ? "bg-emerald-600" : "bg-red-600 shadow-md shadow-red-600/30"
                          }`}>
                            {i + 1}
                          </span>
                          <div>
                            <h4 className="text-base font-black text-white leading-snug">{bin.name}</h4>
                            <p className="text-xs font-bold text-slate-300 mt-0.5">
                              Zone: {bin.zone} • ({bin.lat.toFixed(4)}, {bin.lng.toFixed(4)})
                            </p>
                          </div>
                        </div>

                        {/* Controls with Per-Bin Spinner */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => handleToggleBinCollection(bin.name, true)}
                            disabled={isThisUpdating}
                            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-black uppercase tracking-wider transition-all ${
                              isCollected
                                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                            } disabled:opacity-50`}
                          >
                            {isThisUpdating ? (
                              <RefreshCw className="h-4 w-4 animate-spin text-white" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            <span>YES</span>
                          </button>

                          <button
                            onClick={() => handleToggleBinCollection(bin.name, false)}
                            disabled={isThisUpdating}
                            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-black uppercase tracking-wider transition-all ${
                              !isCollected
                                ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                            } disabled:opacity-50`}
                          >
                            {isThisUpdating ? (
                              <RefreshCw className="h-4 w-4 animate-spin text-white" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                            <span>NO</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      </div>
    </DriverShell>
  );
}
