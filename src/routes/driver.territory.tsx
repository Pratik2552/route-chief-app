import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { CheckCircle2, Check, X, Building2, MapPin, Truck, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { DriverShell } from "@/components/driver/DriverShell";

const RouteMap = lazy(() => import("@/components/driver/RouteMap"));
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export const Route = createFileRoute('/driver/territory')({
  head: () => ({
    meta: [
      { title: "My Territory Map | CivicSync Driver" },
      {
        name: "description",
        content: "View your assigned exclusive collection territory, marked route path, and mark bins as collected.",
      },
    ],
  }),
  component: DriverTerritoryPage,
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

function DriverTerritoryPage() {
  const [mounted, setMounted] = useState(false);
  const [kmlData, setKmlData] = useState<KMLMapResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Retrieve Driver Session Data
  const storedVehicleData = localStorage.getItem('civicsync_vehicle_data');
  const vehicleObj = storedVehicleData ? JSON.parse(storedVehicleData) : null;
  const driverName = vehicleObj?.driver_name || vehicleObj?.driverName || "Driver";
  const licensePlate = vehicleObj?.license_plate || "";

  const fetchDriverTerritory = async () => {
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
        setKmlData(data);
      }
    } catch (err) {
      console.error("Failed to fetch driver territory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchDriverTerritory();

    const interval = setInterval(fetchDriverTerritory, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleBinCollection = async (binName: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;

    // Obtain Driver Mobile GPS Location
    let driverLat: number | undefined = undefined;
    let driverLng: number | undefined = undefined;

    if (newStatus && typeof navigator !== 'undefined' && "geolocation" in navigator) {
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

    try {
      const res = await fetch(`${API_BASE_URL}/kml/mark-collected`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          binName,
          collected: newStatus,
          driverName,
          driverLat,
          driverLng,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Bin ${binName} set to ${newStatus ? 'COLLECTED (YES) ✅' : 'PENDING (NO) 🔴'}`);
        fetchDriverTerritory();
      } else {
        toast.error(data.error || `Verification failed for ${binName}`);
      }
    } catch (err: any) {
      toast.error(err.message || `Failed to update bin ${binName}`);
    }
  };

  const bins = kmlData?.bins || [];
  const isAllDone = kmlData?.isAllCollected || (bins.length > 0 && bins.every(b => b.isCollected));
  const depot = kmlData?.depot || { name: "CENTRAL DEPOT", lat: 19.89518, lng: 74.48668 };

  const truckPos = {
    lat: bins.find(b => !b.isCollected)?.lat || depot.lat,
    lng: bins.find(b => !b.isCollected)?.lng || depot.lng,
  };

  return (
    <DriverShell
      title={`Territory: ${kmlData?.driverZoneName || 'Zone A'}`}
      subtitle={`Driver: ${driverName} (${licensePlate || 'MH-15'})`}
      flush
    >
      {/* Driver Logged-in Header Badge */}
      <div className="bg-slate-900 text-white p-4 border-b-4 border-blue-600 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center font-black text-xl text-white">
            <Truck className="size-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase text-amber-400">👤 {driverName}</h2>
            <p className="text-xs text-slate-300 font-bold">Vehicle: {licensePlate || 'Assigned Vehicle'} • {kmlData?.driverZoneName || 'Zone A'}</p>
          </div>
        </div>
        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-extrabold uppercase px-3 py-1 rounded">
          Active On Duty
        </span>
      </div>

      {/* Map View displaying ONLY driver's territory */}
      <div className="h-[48vh] w-full border-b-4 border-border bg-muted relative">
        {mounted ? (
          <Suspense fallback={
            <div className="flex h-full w-full items-center justify-center bg-slate-100">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mr-2" />
              <span className="font-bold text-lg text-slate-700">Loading your assigned territory map…</span>
            </div>
          }>
            <RouteMap
              kmlData={kmlData}
              vehicle={truckPos}
              onToggleBin={(binName, currentStatus) => handleToggleBinCollection(binName, currentStatus)}
            />
          </Suspense>
        ) : null}

        <div className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-md border-2 border-slate-300 p-2.5 rounded-lg shadow-md text-xs font-bold">
          <span className="flex items-center gap-1.5 text-blue-900">
            <MapPin className="size-4 text-blue-600" /> {kmlData?.driverZoneName || 'Zone A'}
          </span>
          <span className="flex items-center gap-1.5 mt-1 text-emerald-700">
            <CheckCircle2 className="size-4 text-emerald-600" /> {kmlData?.progress?.collected || 0} / {bins.length} Collected
          </span>
        </div>
      </div>

      {/* Return to Depot Banner when all collected */}
      {isAllDone && (
        <div className="bg-emerald-600 text-white p-5 text-center border-b-4 border-emerald-800 animate-pulse">
          <div className="flex items-center justify-center gap-3 text-2xl font-extrabold uppercase">
            <Building2 className="size-8" /> Return to Central Depot
          </div>
          <p className="text-sm font-semibold mt-1 opacity-90">
            All garbage bins in your territory ({kmlData?.driverZoneName}) have been collected. Please follow the marked route back to Central Depot.
          </p>
        </div>
      )}

      {/* Bin Checklist & YES / NO Collection Controls */}
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between border-b-4 border-border pb-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Territory Bin Checklist
            </p>
            <h3 className="text-2xl font-black text-foreground">
              {kmlData?.driverZoneName || 'Zone A'} Pickups
            </h3>
          </div>
          <span className={`border-4 px-3 py-1.5 text-sm font-black uppercase ${
            isAllDone ? "border-emerald-600 bg-emerald-100 text-emerald-800" : "border-amber-500 bg-amber-100 text-amber-900"
          }`}>
            {isAllDone ? "Done" : `${kmlData?.progress?.percentage || 0}%`}
          </span>
        </div>

        <ol className="space-y-3">
          {bins.map((bin, i) => {
            const isCollected = bin.isCollected;
            return (
              <li
                key={bin.id || bin.name}
                className={`border-4 p-4 transition-all ${
                  isCollected
                    ? "border-emerald-500 bg-emerald-50/60"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-black text-white ${
                        isCollected ? "bg-emerald-600" : "bg-red-600"
                      }`}>
                        {i + 1}
                      </span>
                      <p className="text-xl font-extrabold text-foreground">
                        {bin.name}
                      </p>
                    </div>
                    <p className="mt-1 text-xs font-bold text-muted-foreground">
                      Coordinates: {bin.lat.toFixed(4)}, {bin.lng.toFixed(4)} | Zone: {bin.zone}
                    </p>
                  </div>

                  {/* YES / NO Bin Mark Controls */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="text-xs font-black uppercase text-muted-foreground mr-1">
                      Mark Bin:
                    </span>
                    <button
                      onClick={() => handleToggleBinCollection(bin.name, false)}
                      className={`flex items-center gap-1 border-3 px-3.5 py-1.5 text-sm font-black uppercase transition-all ${
                        isCollected
                          ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                          : "border-slate-300 bg-slate-100 text-slate-500 opacity-60"
                      }`}
                    >
                      <Check className="size-4" /> YES
                    </button>

                    <button
                      onClick={() => handleToggleBinCollection(bin.name, true)}
                      className={`flex items-center gap-1 border-3 px-3.5 py-1.5 text-sm font-black uppercase transition-all ${
                        !isCollected
                          ? "border-red-600 bg-red-600 text-white shadow-sm"
                          : "border-slate-300 bg-slate-100 text-slate-500 opacity-60"
                      }`}
                    >
                      <X className="size-4" /> NO
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </DriverShell>
  );
}
