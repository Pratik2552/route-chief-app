import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Truck, Search, RefreshCw, MapPin } from "lucide-react";
import { AuthorityShell } from "@/components/authority/AuthorityShell";
import { useVehicleAuthority, API_BASE_URL } from "@/lib/vehicle-authority-store";

export const Route = createFileRoute("/authority/vehicles")({
  beforeLoad: ({ context }) => {
    const token = typeof window !== 'undefined' 
      ? window.localStorage.getItem('civicsync-vehicle-authority-auth')
      : null;
    
    if (!token) {
      throw new Error("Not authenticated");
    }
  },
  head: () => ({
    meta: [
      { title: "My Vehicles | Vehicle Authority" },
      { name: "description", content: "Manage your fleet of vehicles" },
    ],
  }),
  component: AuthorityVehicles,
});

interface Vehicle {
  id: string;
  license_plate: string;
  driver_name: string;
  driver_phone: string;
  status: string;
  capacity_kg: number;
  current_load_kg: number;
  territory_name: string;
  total_bins_collected: number;
  total_distance_km: number;
  route_efficiency_score: number;
  latitude?: number;
  longitude?: number;
}

function AuthorityVehicles() {
  const navigate = useNavigate();
  const { state } = useVehicleAuthority();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchVehicles = async () => {
    if (!state.access_token) {
      navigate({ to: "/authority/login" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/vehicle-authority/vehicles`, {
        headers: {
          Authorization: `Bearer ${state.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVehicles(data.vehicles || []);
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
    const interval = setInterval(fetchVehicles, 30000);
    return () => clearInterval(interval);
  }, [state.access_token]);

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.territory_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-success text-success-foreground";
      case "idle":
        return "bg-warning text-warning-foreground";
      case "maintenance":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <AuthorityShell title="My Vehicles" subtitle="Fleet Management">
      {/* Search & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by license plate, driver, or territory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border-4 border-border bg-background py-3 pl-12 pr-4 font-bold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <button
          onClick={fetchVehicles}
          disabled={isLoading}
          className="border-4 border-primary bg-primary px-6 py-3 font-extrabold uppercase text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <RefreshCw className={`inline h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
          <span className="ml-2">Refresh</span>
        </button>
      </div>

      {/* Vehicles Grid */}
      {filteredVehicles.length === 0 ? (
        <div className="border-4 border-border bg-card p-12 text-center">
          <Truck className="mx-auto h-16 w-16 text-muted-foreground" />
          <p className="mt-4 text-lg font-bold text-muted-foreground">
            {searchTerm ? "No vehicles match your search" : "No vehicles assigned"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVehicles.map((vehicle) => (
            <div key={vehicle.id} className="border-4 border-border bg-card p-4">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-extrabold uppercase text-foreground">
                    {vehicle.license_plate}
                  </h3>
                  <p className="text-sm font-bold text-muted-foreground">
                    {vehicle.driver_name || "Unassigned"}
                  </p>
                </div>
                <span
                  className={`border-2 border-current px-2 py-1 text-xs font-bold uppercase ${getStatusColor(
                    vehicle.status
                  )}`}
                >
                  {vehicle.status}
                </span>
              </div>

              <div className="space-y-2 border-t-2 border-border pt-3">
                <div className="flex justify-between">
                  <span className="text-sm font-bold uppercase text-muted-foreground">Load:</span>
                  <span className="font-bold text-foreground">
                    {vehicle.current_load_kg || 0} / {vehicle.capacity_kg} kg
                  </span>
                </div>
                <div className="h-2 w-full border-2 border-border bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${((vehicle.current_load_kg || 0) / vehicle.capacity_kg) * 100}%`,
                    }}
                  />
                </div>

                <div className="flex justify-between">
                  <span className="text-sm font-bold uppercase text-muted-foreground">
                    Territory:
                  </span>
                  <span className="font-bold text-foreground">
                    {vehicle.territory_name || "N/A"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm font-bold uppercase text-muted-foreground">
                    Bins Collected:
                  </span>
                  <span className="font-bold text-foreground">
                    {vehicle.total_bins_collected || 0}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm font-bold uppercase text-muted-foreground">
                    Distance:
                  </span>
                  <span className="font-bold text-foreground">
                    {Math.round(vehicle.total_distance_km || 0)} km
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm font-bold uppercase text-muted-foreground">
                    Efficiency:
                  </span>
                  <span className="font-bold text-foreground">
                    {vehicle.route_efficiency_score || 0}%
                  </span>
                </div>
              </div>

              {vehicle.latitude && vehicle.longitude && (
                <div className="mt-3 border-t-2 border-border pt-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {vehicle.latitude.toFixed(4)}, {vehicle.longitude.toFixed(4)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {filteredVehicles.length > 0 && (
        <div className="border-4 border-border bg-muted p-4 text-center">
          <p className="font-bold text-foreground">
            Showing {filteredVehicles.length} of {vehicles.length} vehicles
          </p>
        </div>
      )}
    </AuthorityShell>
  );
}
