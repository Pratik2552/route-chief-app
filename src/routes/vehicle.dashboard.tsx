import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Truck, QrCode, List, LogOut, RefreshCw, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/vehicle/dashboard")({
  head: () => ({
    meta: [
      { title: "Vehicle Dashboard | CivicSync" },
      {
        name: "description",
        content: "View your vehicle information and QR code.",
      },
    ],
  }),
  component: VehicleDashboard,
});

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

interface VehicleData {
  id: string;
  license_plate: string;
  username: string;
  territory_name: string;
  status: string;
  qr_code: string;
}

function VehicleDashboard() {
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if logged in
    const token = localStorage.getItem('civicsync_vehicle_token');
    if (!token) {
      navigate({ to: "/vehicle/login" });
      return;
    }

    // Try to load cached vehicle data
    const cachedData = localStorage.getItem('civicsync_vehicle_data');
    if (cachedData) {
      try {
        setVehicle(JSON.parse(cachedData));
      } catch (e) {
        console.error('Failed to parse cached vehicle data');
      }
    }

    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('civicsync_vehicle_token');
    localStorage.removeItem('civicsync_vehicle_data');
    navigate({ to: "/vehicle/login" });
  };

  const goToQRCode = () => {
    navigate({ to: "/vehicle/qr-code" });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="font-bold text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md border-4 border-destructive bg-destructive/10 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
            <div>
              <p className="font-bold text-lg text-destructive mb-2">Error</p>
              <p className="text-destructive/80">{error || 'Vehicle data not found'}</p>
              <button
                onClick={handleLogout}
                className="mt-4 border-4 border-destructive bg-destructive px-4 py-2 font-bold uppercase text-destructive-foreground"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-4 border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center border-4 border-primary bg-primary">
                <Truck className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold uppercase">Vehicle Portal</h1>
                <p className="text-sm font-bold text-muted-foreground">
                  {vehicle.license_plate}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 border-4 border-border bg-background px-4 py-2 font-bold uppercase hover:bg-muted"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Vehicle Info */}
          <section className="border-4 border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-extrabold uppercase">
              <Truck className="h-6 w-6" />
              Vehicle Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-bold uppercase text-muted-foreground">
                  License Plate
                </p>
                <p className="text-2xl font-extrabold">{vehicle.license_plate}</p>
              </div>
              <div>
                <p className="text-sm font-bold uppercase text-muted-foreground">
                  Username
                </p>
                <p className="font-mono text-lg">{vehicle.username}</p>
              </div>
              <div>
                <p className="text-sm font-bold uppercase text-muted-foreground">
                  Territory
                </p>
                <p className="text-lg font-bold">
                  {vehicle.territory_name || 'Not assigned'}
                </p>
              </div>
              <div>
                <p className="text-sm font-bold uppercase text-muted-foreground">
                  Status
                </p>
                <span
                  className={`inline-block border-4 px-3 py-1 font-bold uppercase ${
                    vehicle.status === 'Active'
                      ? 'border-success bg-success text-success-foreground'
                      : 'border-muted bg-muted text-muted-foreground'
                  }`}
                >
                  {vehicle.status}
                </span>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="border-4 border-border bg-card p-6">
            <h2 className="mb-4 text-xl font-extrabold uppercase">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={goToQRCode}
                className="flex w-full items-center gap-3 border-4 border-primary bg-primary px-6 py-4 font-bold uppercase text-primary-foreground hover:bg-primary/90"
              >
                <QrCode className="h-6 w-6" />
                <span>View My QR Code</span>
              </button>

              <Link
                to="/driver/territory"
                className="flex w-full items-center gap-3 border-4 border-blue-600 bg-blue-600 px-6 py-4 font-bold uppercase text-white hover:bg-blue-700 shadow-md"
              >
                <Truck className="h-6 w-6" />
                <span>🗺️ View My Territory &amp; Route Map</span>
              </Link>

              <Link
                to="/vehicle/scan-reports"
                className="flex w-full items-center gap-3 border-4 border-border bg-background px-6 py-4 font-bold uppercase hover:bg-muted"
              >
                <List className="h-6 w-6" />
                <span>Scan Reports</span>
              </Link>

              <div className="border-4 border-muted bg-muted/50 p-4">
                <p className="text-sm font-bold text-muted-foreground mb-2">
                  📱 About Your QR Code
                </p>
                <p className="text-xs text-muted-foreground">
                  Your vehicle has a unique QR code. Display it on your vehicle so citizens can
                  scan it to verify garbage collection. The QR code is permanent and unique to
                  your vehicle only.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Info Banner */}
        <section className="mt-6 border-4 border-primary bg-primary/10 p-6">
          <h3 className="mb-2 font-bold text-primary">Welcome to Your Vehicle Portal</h3>
          <p className="text-sm text-primary/80">
            This portal is dedicated to your vehicle ({vehicle.license_plate}). You can view your
            vehicle's permanent QR code, which citizens use to verify garbage collection. Each
            vehicle in the system has its own unique credentials and QR code.
          </p>
        </section>
      </main>
    </div>
  );
}
