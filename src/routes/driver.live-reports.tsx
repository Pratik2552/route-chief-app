import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { FileText, RefreshCw, Calendar, MapPin, User, Image as ImageIcon, CheckCircle2, Clock } from "lucide-react";
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
      // civicsync_vehicle_token is stored as a plain JWT string on vehicle login
      const directToken = window.localStorage.getItem('civicsync_vehicle_token');
      if (directToken && !directToken.startsWith('{')) return directToken;

      // Fallback: try authority auth JSON object
      const authData = window.localStorage.getItem('civicsync-vehicle-authority-auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.access_token || parsed.token || null;
      }
    } catch (e) {
      console.error('Failed to get access token:', e);
    }
    return null;
  };

  useEffect(() => {
    fetchScans();
    
    if (autoRefresh) {
      const interval = setInterval(fetchScans, 30000);
      return () => clearInterval(interval);
    }
  }, [filterDays, autoRefresh]);

  const fetchScans = async () => {
    const accessToken = getAccessToken();

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/qr-scan/scans/my-vehicle?days=${filterDays}&limit=50`,
        {
          headers: {
            ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setScans(data.scans || []);
      } else {
        setError(data.error || "Failed to fetch scan reports");
      }
    } catch (err) {
      setError("Network error while loading live scan reports.");
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
    <DriverShell title="Citizen Live Incident Reports" subtitle="Real-time QR verification scans logged by citizens" nextBinId={null}>
      <div className="p-6 space-y-6 max-w-[1700px] mx-auto">
        
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-black uppercase text-slate-300">Filter Horizon:</label>
              <select
                value={filterDays}
                onChange={(e) => setFilterDays(e.target.value)}
                className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs font-bold text-white"
              >
                <option value="1">Today</option>
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs font-black uppercase text-slate-300">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-orange-600 focus:ring-orange-500"
              />
              Auto-refresh Stream (30s)
            </label>
          </div>

          <button
            onClick={fetchScans}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-black uppercase text-white hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 text-orange-400 ${loading ? "animate-spin" : ""}`} />
            Refresh Feed
          </button>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-300">Total QR Scans</p>
                <p className="text-3xl font-black text-white mt-1">{scans.length}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600/10 border border-orange-500/30 text-orange-400">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-300">Verified Pickups</p>
                <p className="text-3xl font-black text-emerald-400 mt-1">
                  {scans.filter((s) => s.verified_by_admin).length}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-300">Pending Verification</p>
                <p className="text-3xl font-black text-amber-400 mt-1">
                  {scans.filter((s) => !s.verified_by_admin).length}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-500/40 bg-red-950/20 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-red-400">{error}</p>
              <button
                onClick={fetchScans}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black uppercase text-white hover:bg-red-500"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Scan Logs - Grouped by Date */}
        <div className="space-y-6">
          {loading && scans.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center">
              <RefreshCw className="mx-auto h-10 w-10 animate-spin text-orange-500" />
              <p className="mt-4 font-bold text-slate-300">Loading citizen scan feed...</p>
            </div>
          ) : scans.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center space-y-2">
              <FileText className="mx-auto h-12 w-12 text-slate-600" />
              <h3 className="text-lg font-black text-white">No Citizen Scans Recorded</h3>
              <p className="text-xs font-semibold text-slate-300">
                Citizen QR scans for your vehicle will appear live on this feed.
              </p>
            </div>
          ) : (
            Object.entries(groupedScans).map(([date, dateScans]) => (
              <div key={date} className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
                {/* Date Header */}
                <div className="border-b border-slate-800 bg-slate-950 px-6 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-black text-white uppercase tracking-wider">
                    <Calendar className="h-4 w-4 text-orange-400" /> {date}
                  </div>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-extrabold text-slate-200 border border-slate-700">
                    {dateScans.length} Scan{dateScans.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Scans list */}
                <div className="divide-y divide-slate-800/80">
                  {dateScans.map((scan) => (
                    <div key={scan.id} className="p-6 hover:bg-slate-950/40 transition-colors">
                      <div className="flex flex-col gap-5 md:flex-row md:items-start">
                        {/* Image proof */}
                        <div className="shrink-0">
                          <button
                            onClick={() => setSelectedImage(scan.garbage_image_url)}
                            className="group relative block h-32 w-32 rounded-xl overflow-hidden border border-slate-700 bg-slate-950"
                          >
                            <img
                              src={scan.garbage_image_url}
                              alt="Scan proof"
                              className="h-full w-full object-cover transition-transform group-hover:scale-110"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                              <ImageIcon className="h-6 w-6 text-white" />
                            </div>
                          </button>
                        </div>

                        {/* Details */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-orange-400" />
                                <span className="font-black text-white text-base">{scan.citizen_name}</span>
                                {scan.verified_by_admin && (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                )}
                              </div>
                              {scan.citizen_email && (
                                <p className="text-xs font-semibold text-slate-300">{scan.citizen_email}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-extrabold text-slate-200">
                                {formatDate(scan.scan_timestamp)}
                              </p>
                              <p className="text-[11px] font-bold text-slate-400">
                                {new Date(scan.scan_timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2 text-xs font-bold text-slate-300">
                            <MapPin className="h-4 w-4 shrink-0 text-orange-400" />
                            <div>
                              <p className="text-white font-extrabold">
                                GPS: {scan.scan_latitude.toFixed(6)}, {scan.scan_longitude.toFixed(6)}
                              </p>
                              {scan.scan_address && (
                                <p className="text-slate-300 mt-0.5">{scan.scan_address}</p>
                              )}
                            </div>
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

        {/* Modal */}
        {selectedImage && (
          <div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-h-[90vh] max-w-4xl rounded-2xl overflow-hidden border border-slate-700">
              <img
                src={selectedImage}
                alt="Full size scan proof"
                className="max-h-[85vh] max-w-full object-contain"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 rounded-xl bg-black/80 border border-slate-600 px-4 py-2 text-xs font-black uppercase text-white hover:bg-black"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </DriverShell>
  );
}
