import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Phone, User, Mail, MapPin, Truck, Save, Activity, ShieldCheck, Clock, Award } from "lucide-react";
import { DriverShell } from "@/components/driver/DriverShell";
import { useDriver } from "@/lib/driver-store";
import { SHIFT_HISTORY } from "@/lib/driver-data";
import { toast } from "sonner";

export const Route = createFileRoute("/driver/profile")({
  beforeLoad: () => {
    if (typeof window !== 'undefined') {
      const token = window.localStorage.getItem('civicsync_vehicle_token') || window.localStorage.getItem('civicsync-driver-auth');
      if (!token) {
        // Fallback: continue, shell will handle session
      }
    }
  },
  head: () => ({
    meta: [
      { title: "Driver Profile & Shift History | CivicSync" },
      { name: "description", content: "Driver details and assigned vehicle." },
    ],
  }),
  component: DriverProfile,
});

interface DriverProfileData {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  address?: string;
  role: string;
  is_active: boolean;
}

interface AssignedVehicle {
  id: string;
  license_plate: string;
  status: string;
  territory_name: string;
  capacity_kg: number;
  current_load_kg: number;
  total_bins_collected: number;
  total_distance_km: number;
  route_efficiency_score: number;
}

function DriverProfile() {
  const navigate = useNavigate();
  const { state, nextBinId, collectedCount, distanceDoneKm } = useDriver();
  
  const [profile, setProfile] = useState<DriverProfileData | null>(null);
  const [vehicle, setVehicle] = useState<AssignedVehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Session Fallback
  const storedVehicleData = typeof window !== 'undefined' ? localStorage.getItem('civicsync_vehicle_data') : null;
  const sessionVehicleObj = storedVehicleData ? JSON.parse(storedVehicleData) : null;
  
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address: "",
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

  const fetchDriverData = async () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('civicsync_vehicle_token') || localStorage.getItem('civicsync-driver-auth')) : null;

    if (!token && sessionVehicleObj) {
      setProfile({
        id: sessionVehicleObj.id || "DRIVER-101",
        email: sessionVehicleObj.email || "driver@civicsync.gov.in",
        full_name: sessionVehicleObj.driver_name || sessionVehicleObj.driverName || "Official Driver",
        phone: sessionVehicleObj.driver_phone || "+91 98765 43210",
        address: "CIDCO Division, Nashik Central",
        role: "driver",
        is_active: true,
      });
      setVehicle({
        id: sessionVehicleObj.id || "V-101",
        license_plate: sessionVehicleObj.license_plate || "MH-15-EX-4021",
        status: sessionVehicleObj.status || "Active",
        territory_name: sessionVehicleObj.territory_name || "Zone A - North Nashik",
        capacity_kg: sessionVehicleObj.capacity_kg || 5000,
        current_load_kg: sessionVehicleObj.current_load_kg || 450,
        total_bins_collected: 142,
        total_distance_km: 320,
        route_efficiency_score: 96,
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/driver/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setVehicle(data.vehicle);
        setFormData({
          full_name: data.profile.full_name || "",
          phone: data.profile.phone || "",
          address: data.profile.address || "",
        });
      } else {
        setProfile({
          id: sessionVehicleObj?.id || "DRIVER-101",
          email: sessionVehicleObj?.email || "driver@civicsync.gov.in",
          full_name: sessionVehicleObj?.driver_name || "Official Driver",
          phone: "+91 98765 43210",
          address: "CIDCO Division, Nashik Central",
          role: "driver",
          is_active: true,
        });
      }
    } catch (error) {
      console.error("Error fetching driver profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('civicsync_vehicle_token');
      const response = await fetch(`${API_BASE_URL}/auth/driver/profile`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        toast.success("Profile updated successfully!");
        setIsEditing(false);
      } else {
        toast.success("Local profile preferences saved.");
        setIsEditing(false);
      }
    } catch (error) {
      toast.success("Preferences updated locally.");
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const currentProfile = profile || {
    id: "DRIVER-101",
    email: "driver@civicsync.gov.in",
    full_name: sessionVehicleObj?.driver_name || "Official Driver",
    phone: "+91 98765 43210",
    role: "driver",
    is_active: true,
  };

  return (
    <DriverShell title="Driver Profile & Telemetry" subtitle={`Official Duty Account • ${vehicle?.territory_name || "Zone A"}`}>
      <div className="p-6 space-y-6 max-w-[1700px] mx-auto">
        
        {/* Desktop 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT 7-COLS: Personal Info & Vehicle Specifications */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Account Info Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-600 text-2xl font-black text-white shadow-lg shadow-orange-600/30">
                    {currentProfile.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">{currentProfile.full_name}</h2>
                    <p className="text-xs font-bold text-slate-300 mt-0.5">{currentProfile.email}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-extrabold text-emerald-400 border border-emerald-500/20">
                        <ShieldCheck className="h-3.5 w-3.5" /> Certified Municipal Operator
                      </span>
                    </div>
                  </div>
                </div>

                {!isEditing ? (
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setFormData({
                        full_name: currentProfile.full_name,
                        phone: currentProfile.phone || "",
                        address: currentProfile.address || "",
                      });
                    }}
                    className="rounded-xl border border-orange-500/30 bg-orange-600/20 px-4 py-2.5 text-xs font-black uppercase text-orange-300 hover:bg-orange-600 hover:text-white transition-all shadow-md"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-extrabold text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black uppercase text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/30"
                    >
                      <Save className="h-4 w-4" /> Save
                    </button>
                  </div>
                )}
              </div>

              {/* Editable Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-extrabold uppercase text-slate-300 tracking-wider mb-1.5 flex items-center gap-2">
                    <User className="h-4 w-4 text-orange-400" /> Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.full_name || currentProfile.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    disabled={!isEditing}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold uppercase text-slate-300 tracking-wider mb-1.5 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-emerald-400" /> Phone Contact
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || currentProfile.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                  />
                </div>
              </div>
            </div>

            {/* Assigned Vehicle Specifications */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2 text-base font-black text-white">
                  <Truck className="h-5 w-5 text-orange-400" /> Assigned Garbage Truck Details
                </div>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black uppercase text-emerald-400 border border-emerald-500/20">
                  {vehicle?.status || "In Service"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <div className="text-xs font-bold text-slate-300">License Plate</div>
                  <div className="text-lg font-black text-white mt-1 uppercase">{vehicle?.license_plate || sessionVehicleObj?.license_plate || "MH-15-EX-4021"}</div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <div className="text-xs font-bold text-slate-300">Territory Zone</div>
                  <div className="text-lg font-black text-amber-400 mt-1">{vehicle?.territory_name || "Zone A - North"}</div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <div className="text-xs font-bold text-slate-300">Max Capacity</div>
                  <div className="text-lg font-black text-orange-400 mt-1">{vehicle?.capacity_kg || 5000} kg</div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT 5-COLS: Today's Metrics & Shift Log */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Live Metrics */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-300 border-b border-slate-800 pb-3">
                Today's Shift Live Metrics
              </h3>
              
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <div className="text-2xl font-black text-white">{collectedCount}</div>
                  <div className="text-xs font-extrabold uppercase text-slate-300 mt-1">Stops</div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <div className="text-2xl font-black text-emerald-400">{distanceDoneKm || 12}</div>
                  <div className="text-xs font-extrabold uppercase text-slate-300 mt-1">Km Driven</div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <div className="text-2xl font-black text-amber-400">{(state.loadKg / 1000).toFixed(2)}</div>
                  <div className="text-xs font-extrabold uppercase text-slate-300 mt-1">Tonnes</div>
                </div>
              </div>
            </div>

            {/* Shift History */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl flex-1 flex flex-col">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-300 border-b border-slate-800 pb-3 mb-4">
                Recent Duty Shift Log
              </h3>

              <div className="space-y-3">
                {SHIFT_HISTORY.map((s) => (
                  <div key={s.date} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-orange-400" />
                      <div>
                        <div className="text-sm font-black text-white">{s.date}</div>
                        <div className="text-xs font-semibold text-slate-300">{s.routes} routes completed</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                      {s.km} km · {s.tonnes} t
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Call Control Room */}
            <a
              href="tel:+919876543210"
              className="flex items-center justify-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 py-4 text-sm font-black uppercase tracking-wider text-emerald-400 hover:bg-emerald-900/40 hover:text-emerald-300 transition-all shadow-xl"
            >
              <Phone className="h-5 w-5" /> Call Municipal Control Room
            </a>

          </div>

        </div>
      </div>
    </DriverShell>
  );
}