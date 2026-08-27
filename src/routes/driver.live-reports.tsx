import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { FileText, RefreshCw, Calendar, MapPin, User, Image as ImageIcon, CheckCircle, XCircle, Clock } from "lucide-react";
import { DriverShell } from "@/components/driver/DriverShell";

export const Route = createFileRoute("/driver/live-reports")({
  head: () => ({
    meta: [
      { title: "Live Reports | Driver Portal" },
      { name: "description", content: "Real-time QR scan reports from citizens" },
    ],
  }),
  component: DriverLiveReportsPage,
});

interface ScanLog {
  id: string;
  vehicle_id: string;
  vehicle_qr_code: string;
  citizen_id: string | null;
  citizen_name: string;
  citizen_email: string | null;
  garbage_image_url: string;
  scan_latitude: number;
  scan_longitude: number;
  scan_address: string | null;
  scan_timestamp: string;
  device_info: string | null;
  verified_by_admin: boolean;
  admin_notes: string | null;
  verification_timestamp: string | null;
  vehicles?: {
    id: string;
    license_plate: string;
    driver_name: string | null;
    territory_name: string | null;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

function DriverLiveReportsPage() {
  const [scans, setScans] = useState<ScanLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [filterDays, setFilterDays] = useState("7");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Get access token from localStorage
  const getAccessToken = () => {
    try {
      const authData = window.localStorage.getItem('civicsync-vehicle-authority-auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.access_token;
      }
    } catch (e) {
      console.error('Failed to get access token:', e);
    }
    return null;
  };

  useEffect(() => {
    fetchScans();
    
    // Auto-refresh every 30 seconds
    if (autoRefresh) {
      const interval = setInterval(fetchScans, 30000);
      return () => clearInterval(interval);
    }
  }, [filterDays, autoRefresh]);

  const fetchScans = async () => {
    const accessToken = getAccessToken();
    
    if (!accessToken) {
      setError("Not authenticated. Please login again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      console.log('🔍 Fetching scans from:', `${API_BASE_URL}/qr-scan/scans/my-vehicle`);

      const response = await fetch(
        `${API_BASE_URL}/qr-scan/scans/my-vehicle?days=${filterDays}&limit=50`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Scans loaded:', data.scans?.length || 0);
        setScans(data.scans || []);
      } else {
        console.error('❌ Failed to fetch scans:', response.status, data);
        
        if (response.status === 401) {
          setError("Your session has expired. Please login again.");
        } else {
          setError(data.error || "Failed to fetch scan reports");
        }
      }
    } catch (err) {
      console.error("❌ Error fetching scans:", err);
      setError("Network error. Please check your connection and ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const groupScansByDate = () => {
    const grouped: { [key: string]: ScanLog[] } = {};
    
    scans.forEach((scan) => {
      const date = new Date(scan.scan_timestamp).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(scan);
    });

    return grouped;
  };

  const groupedScans = groupScansByDate();

  return (
    <DriverShell title="Live Reports" subtitle="Real-time QR Scan Reports" nextBinId={null}>
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-4 border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-bold uppercase">Filter:</label>
          <select
            value={filterDays}
            onChange={(e) => setFilterDays(e.target.value)}
            className="border-4 border-border bg-background px-3 py-2 font-bold"
          >
            <option value="1">Today</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>

          <label className="flex items-center gap-2 text-sm font-bold uppercase">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4"
            />
            Auto-refresh
          </label>
        </div>

        <button
          onClick={fetchScans}
          disabled={loading}
          className="flex items-center gap-2 border-4 border-border bg-background px-4 py-2 font-bold uppercase hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <div className="border-4 border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <FileText className="h-8 w-8 text-primary" />
            <div className="text-right">
              <p className="text-sm font-bold uppercase text-muted-foreground">Total Scans</p>
              <p className="text-3xl font-extrabold">{scans.length}</p>
            </div>
          </div>
        </div>

        <div className="border-4 border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <CheckCircle className="h-8 w-8 text-success" />
            <div className="text-right">
              <p className="text-sm font-bold uppercase text-muted-foreground">Verified</p>
              <p className="text-3xl font-extrabold">
                {scans.filter((s) => s.verified_by_admin).length}
              </p>
            </div>
          </div>
        </div>

        <div className="border-4 border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <Clock className="h-8 w-8 text-warning" />
            <div className="text-right">
              <p className="text-sm font-bold uppercase text-muted-foreground">Pending</p>
              <p className="text-3xl font-extrabold">
                {scans.filter((s) => !s.verified_by_admin).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 border-4 border-destructive bg-destructive/10 p-4">
          <div className="flex items-center justify-between">
            <p className="font-bold text-destructive">{error}</p>
            <button
              onClick={fetchScans}
              className="border-4 border-border bg-background px-4 py-2 font-bold uppercase hover:bg-muted"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Scan Logs - Grouped by Date */}
      <div className="space-y-4">
        {loading && scans.length === 0 ? (
          <div className="border-4 border-border bg-card p-8 text-center">
            <RefreshCw className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 font-bold text-muted-foreground">Loading scan reports...</p>
          </div>
        ) : scans.length === 0 ? (
          <div className="border-4 border-border bg-card p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 font-bold text-muted-foreground">No scans found</p>
            <p className="text-sm text-muted-foreground">
              Citizens will appear here when they scan your vehicle's QR code
            </p>
          </div>
        ) : (
          Object.entries(groupedScans).map(([date, dateScans]) => (
            <div key={date} className="border-4 border-border bg-card">
              {/* Date Header */}
              <div className="border-b-4 border-border bg-muted px-4 py-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h3 className="font-extrabold uppercase">{date}</h3>
                  <span className="ml-auto rounded border-2 border-border bg-background px-2 py-1 text-xs font-bold">
                    {dateScans.length} scan{dateScans.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Scans for this date */}
              <div className="divide-y-4 divide-border">
                {dateScans.map((scan) => (
                  <div key={scan.id} className="p-4 hover:bg-muted/50">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start">
                      {/* Photo */}
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => setSelectedImage(scan.garbage_image_url)}
                          className="group relative block h-32 w-32 overflow-hidden border-4 border-border bg-muted"
                        >
                          <img
                            src={scan.garbage_image_url}
                            alt="Scan proof"
                            className="h-full w-full object-cover transition-transform group-hover:scale-110"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                            <ImageIcon className="h-8 w-8 text-white" />
                          </div>
                        </button>
                      </div>

                      {/* Details */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-bold">{scan.citizen_name}</span>
                              {scan.verified_by_admin ? (
                                <CheckCircle className="h-4 w-4 text-success" />
                              ) : (
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            {scan.citizen_email && (
                              <p className="text-xs text-muted-foreground">{scan.citizen_email}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-muted-foreground">
                              {formatDate(scan.scan_timestamp)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(scan.scan_timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                          <div>
                            <p className="font-bold">
                              {scan.scan_latitude.toFixed(6)}, {scan.scan_longitude.toFixed(6)}
                            </p>
                            {scan.scan_address && (
                              <p className="text-muted-foreground">{scan.scan_address}</p>
                            )}
                          </div>
                        </div>

                        {scan.admin_notes && (
                          <div className="rounded border-2 border-warning bg-warning/10 p-2 text-sm">
                            <p className="font-bold text-warning">Admin Note:</p>
                            <p className="text-warning/80">{scan.admin_notes}</p>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block border-2 px-2 py-1 text-xs font-bold uppercase ${
                              scan.verified_by_admin
                                ? "border-success bg-success text-success-foreground"
                                : "border-muted bg-muted text-muted-foreground"
                            }`}
                          >
                            {scan.verified_by_admin ? "Verified" : "Pending"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-4xl">
            <img
              src={selectedImage}
              alt="Full size"
              className="max-h-[90vh] max-w-full border-8 border-white"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute right-2 top-2 border-4 border-white bg-black px-4 py-2 font-bold uppercase text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </DriverShell>
  );
}
