import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, RefreshCw, AlertCircle, MapPin, User, Clock, CheckCircle, XCircle, Image } from "lucide-react";

export const Route = createFileRoute("/vehicle/scan-reports")({
  head: () => ({ meta: [{ title: "Scan Reports | CivicSync" }] }),
  component: ScanReportsPage,
});

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

interface ScanLog {
  id: string;
  citizen_name: string;
  citizen_email: string;
  garbage_image_url: string;
  scan_latitude: number;
  scan_longitude: number;
  scan_address: string;
  scan_timestamp: string;
  verified_by_admin: boolean;
  admin_notes: string;
}

function ScanReportsPage() {
  const navigate = useNavigate();
  const [scans, setScans] = useState<ScanLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [days, setDays] = useState(7);

  useEffect(() => {
    const token = localStorage.getItem("civicsync_vehicle_token");
    if (!token) { navigate({ to: "/vehicle/login" }); return; }
    fetchScans();
  }, [days]);

  const fetchScans = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("civicsync_vehicle_token");
      const res = await fetch(`${API_BASE_URL}/auth/vehicle/scan-logs?days=${days}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setScans(data.logs || []);
      } else {
        setError(data.error || "Failed to fetch scan logs");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-4 border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/vehicle/dashboard" className="flex items-center gap-2 font-bold uppercase hover:text-primary">
            <ArrowLeft className="h-5 w-5" /> Dashboard
          </Link>
          <h1 className="text-xl font-extrabold uppercase">Scan Reports</h1>
          <div className="flex items-center gap-2">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="border-4 border-border bg-background px-3 py-2 font-bold text-sm"
            >
              <option value={1}>Today</option>
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
            <button
              onClick={fetchScans}
              className="border-4 border-border bg-background p-2 hover:bg-muted"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats bar */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="border-4 border-border bg-card p-4 text-center">
            <p className="text-3xl font-extrabold">{scans.length}</p>
            <p className="text-sm font-bold uppercase text-muted-foreground">Total Scans</p>
          </div>
          <div className="border-4 border-success bg-success/10 p-4 text-center">
            <p className="text-3xl font-extrabold text-success">{scans.filter(s => s.verified_by_admin).length}</p>
            <p className="text-sm font-bold uppercase text-muted-foreground">Verified</p>
          </div>
          <div className="border-4 border-warning bg-warning/10 p-4 text-center">
            <p className="text-3xl font-extrabold text-warning">{scans.filter(s => !s.verified_by_admin).length}</p>
            <p className="text-sm font-bold uppercase text-muted-foreground">Pending</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 border-4 border-destructive bg-destructive/10 p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="font-bold text-destructive">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : scans.length === 0 ? (
          <div className="border-4 border-border bg-card p-12 text-center">
            <p className="text-xl font-extrabold uppercase text-muted-foreground">No scans found</p>
            <p className="mt-2 text-sm text-muted-foreground">No citizens have scanned your vehicle QR in this period.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {scans.map((scan) => (
              <div key={scan.id} className="border-4 border-border bg-card p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Image */}
                  <div
                    className="flex-shrink-0 cursor-pointer"
                    onClick={() => setSelectedImage(scan.garbage_image_url)}
                  >
                    {scan.garbage_image_url ? (
                      <img
                        src={scan.garbage_image_url}
                        alt="Scan"
                        className="h-32 w-32 object-cover border-4 border-border hover:border-primary transition-colors"
                      />
                    ) : (
                      <div className="h-32 w-32 border-4 border-border bg-muted flex items-center justify-center">
                        <Image className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <p className="text-xs text-center mt-1 text-muted-foreground font-bold">Click to enlarge</p>
                  </div>

                  {/* Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-bold">{formatTime(scan.scan_timestamp)}</span>
                      </div>
                      <span className={`flex items-center gap-1 border-4 px-3 py-1 text-xs font-extrabold uppercase ${
                        scan.verified_by_admin
                          ? "border-success bg-success/10 text-success"
                          : "border-warning bg-warning/10 text-warning"
                      }`}>
                        {scan.verified_by_admin
                          ? <><CheckCircle className="h-3 w-3" /> Verified</>
                          : <><XCircle className="h-3 w-3" /> Pending</>
                        }
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-bold">{scan.citizen_name || "Anonymous"}</span>
                      {scan.citizen_email && (
                        <span className="text-muted-foreground">({scan.citizen_email})</span>
                      )}
                    </div>

                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-muted-foreground">
                          {scan.scan_address || `${scan.scan_latitude?.toFixed(5)}, ${scan.scan_longitude?.toFixed(5)}`}
                        </p>
                        {scan.scan_latitude && (
                          <a
                            href={`https://maps.google.com/?q=${scan.scan_latitude},${scan.scan_longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-primary hover:underline"
                          >
                            View on Map →
                          </a>
                        )}
                      </div>
                    </div>

                    {scan.admin_notes && (
                      <div className="border-4 border-muted bg-muted/50 px-3 py-2 text-xs">
                        <span className="font-bold">Admin Note: </span>{scan.admin_notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Scan full view"
            className="max-h-[90vh] max-w-[90vw] border-4 border-white object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 border-4 border-white bg-black px-4 py-2 font-bold text-white"
            onClick={() => setSelectedImage(null)}
          >
            ✕ Close
          </button>
        </div>
      )}
    </div>
  );
}
