import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Truck, Activity, TrendingUp, MapPin, RefreshCw, AlertCircle } from "lucide-react";
import { AuthorityShell } from "@/components/authority/AuthorityShell";
import { useVehicleAuthority, API_BASE_URL } from "@/lib/vehicle-authority-store";

export const Route = createFileRoute("/authority/home")({
  beforeLoad: ({ context }) => {
    // Check authentication
    const token = typeof window !== 'undefined' 
      ? window.localStorage.getItem('civicsync-vehicle-authority-auth')
      : null;
    
    if (!token) {
      throw new Error("Not authenticated");
    }
  },
  head: () => ({
    meta: [
      { title: "Dashboard | Vehicle Authority" },
      { name: "description", content: "Vehicle Authority dashboard for fleet management" },
    ],
  }),
  component: AuthorityHome,
});

interface Stats {
  total_vehicles: number;
  active_vehicles: number;
  idle_vehicles: number;
  maintenance_vehicles: number;
  offline_vehicles: number;
  total_bins_collected: number;
  total_weight_collected_kg: number;
  total_distance_km: number;
}

interface Vehicle {
  id: string;
  license_plate: string;
  driver_name: string;
  status: string;
  capacity_kg: number;
  current_load_kg: number;
  territory_name: string;
  total_bins_collected: number;
}

function AuthorityHome() {
  const navigate = useNavigate();
  const { state } = useVehicleAuthority();
  const [stats, setStats] = useState<Stats>({
    total_vehicles: 0,
    active_vehicles: 0,
    idle_vehicles: 0,
    maintenance_vehicles: 0,
    offline_vehicles: 0,
    total_bins_collected: 0,
    total_weight_collected_kg: 0,
    total_distance_km: 0,
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = async () => {
    if (!state.access_token) {
      navigate({ to: "/authority/login" });
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const baseUrl = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;
      // Fetch stats
      const statsResponse = await fetch(`${baseUrl}/vehicle-authority/dashboard-stats`, {
        headers: {
          Authorization: `Bearer ${state.access_token}`,
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats || stats);
      }

      // Fetch vehicles
      const vehiclesResponse = await fetch(`${baseUrl}/vehicle-authority/vehicles`, {
        headers: {
          Authorization: `Bearer ${state.access_token}`,
        },
      });

      if (vehiclesResponse.ok) {
        const vehiclesData = await vehiclesResponse.json();
        setVehicles(vehiclesData.vehicles || []);
      }
    } catch (err) {
      setError("Failed to load dashboard data");
      console.error("Dashboard error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [state.access_token]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-success";
      case "idle":
        return "bg-warning";
      case "maintenance":
        return "bg-destructive";
      default:
        return "bg-muted";
    }
  };

  return (
    <AuthorityShell title="Dashboard" subtitle="Fleet Overview & Performance">
      {error && (
        <div className="border-4 border-destructive bg-destructive/10 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <p className="font-bold text-destructive">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="border-4 border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <Truck className="h-8 w-8 text-primary" />
            <div className="text-right">
              <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                Total Vehicles
              </p>
              <p className="text-3xl font-extrabold text-foreground">{stats.total_vehicles}</p>
            </div>
          </div>
        </div>

        <div className="border-4 border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <Activity className="h-8 w-8 text-success" />
            <div className="text-right">
              <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                Active
              </p>
              <p className="text-3xl font-extrabold text-foreground">{stats.active_vehicles}</p>
            </div>
          </div>
        </div>

        <div className="border-4 border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <TrendingUp className="h-8 w-8 text-warning" />
            <div className="text-right">
              <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                Bins Collected
              </p>
              <p className="text-3xl font-extrabold text-foreground">{stats.total_bins_collected}</p>
            </div>
          </div>
        </div>

        <div className="border-4 border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <MapPin className="h-8 w-8 text-primary" />
            <div className="text-right">
              <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                Distance (km)
              </p>
              <p className="text-3xl font-extrabold text-foreground">
                {Math.round(stats.total_distance_km)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fleet Status */}
      <section className="border-4 border-border bg-card p-4">
        <h2 className="mb-4 text-xl font-extrabold uppercase text-foreground">Fleet Status</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="border-l-4 border-success bg-muted p-3">
            <p className="text-sm font-bold uppercase text-muted-foreground">Active</p>
            <p className="text-2xl font-extrabold text-foreground">{stats.active_vehicles}</p>
          </div>
          <div className="border-l-4 border-warning bg-muted p-3">
            <p className="text-sm font-bold uppercase text-muted-foreground">Idle</p>
            <p className="text-2xl font-extrabold text-foreground">{stats.idle_vehicles}</p>
          </div>
          <div className="border-l-4 border-destructive bg-muted p-3">
            <p className="text-sm font-bold uppercase text-muted-foreground">Maintenance</p>
            <p className="text-2xl font-extrabold text-foreground">{stats.maintenance_vehicles}</p>
          </div>
          <div className="border-l-4 border-muted-foreground bg-muted p-3">
            <p className="text-sm font-bold uppercase text-muted-foreground">Offline</p>
            <p className="text-2xl font-extrabold text-foreground">{stats.offline_vehicles}</p>
          </div>
        </div>
      </section>

      {/* Recent Vehicles */}
      <section className="border-4 border-border bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold uppercase text-foreground">My Vehicles</h2>
          <button
            onClick={fetchDashboardData}
            className="border-2 border-border bg-background px-3 py-2 font-bold text-foreground hover:bg-muted"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {vehicles.length === 0 ? (
          <div className="py-8 text-center">
            <Truck className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 font-bold text-muted-foreground">No vehicles assigned</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="p-2 text-left text-sm font-bold uppercase">License Plate</th>
                  <th className="p-2 text-left text-sm font-bold uppercase">Driver</th>
                  <th className="p-2 text-left text-sm font-bold uppercase">Status</th>
                  <th className="p-2 text-left text-sm font-bold uppercase">Load</th>
                  <th className="p-2 text-left text-sm font-bold uppercase">Territory</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.slice(0, 5).map((vehicle) => (
                  <tr key={vehicle.id} className="border-b border-border">
                    <td className="p-2 font-bold">{vehicle.license_plate}</td>
                    <td className="p-2">{vehicle.driver_name || "Unassigned"}</td>
                    <td className="p-2">
                      <span
                        className={`inline-block border-2 border-current px-2 py-1 text-xs font-bold uppercase ${getStatusColor(
                          vehicle.status
                        )}`}
                      >
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="p-2">
                      {vehicle.current_load_kg || 0} / {vehicle.capacity_kg} kg
                    </td>
                    <td className="p-2">{vehicle.territory_name || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AuthorityShell>
  );
}
