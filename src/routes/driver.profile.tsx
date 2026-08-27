import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Phone, User, Mail, MapPin, Truck, Save } from "lucide-react";
import { DriverShell } from "@/components/driver/DriverShell";
import { useDriver } from "@/lib/driver-store";
import { SHIFT_HISTORY } from "@/lib/driver-data";
import { toast } from "sonner";

export const Route = createFileRoute("/driver/profile")({
  beforeLoad: ({ location }) => {
    if (typeof window !== 'undefined') {
      const token = window.localStorage.getItem('civicsync-driver-auth');
      if (!token) {
        throw new Error("Redirecting to login");
      }
    }
  },
  errorComponent: () => {
    const navigate = useNavigate();
    useEffect(() => {
      navigate({ to: "/driver/login" });
    }, [navigate]);
    return null;
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
  
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address: "",
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

  const fetchDriverData = async () => {
    const rawAuth = window.localStorage.getItem('civicsync-driver-auth');
    if (!rawAuth) {
      navigate({ to: "/driver/login" });
      return;
    }

    try {
      const authData = JSON.parse(rawAuth);
      const token = authData.access_token;

      if (!token) {
        navigate({ to: "/driver/login" });
        return;
      }

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
        toast.error("Failed to load driver profile.");
      }
    } catch (error) {
      console.error("Error fetching driver profile:", error);
      toast.error("Network error while loading profile.");
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
      const rawAuth = window.localStorage.getItem('civicsync-driver-auth');
      if (!rawAuth) return;
      const authData = JSON.parse(rawAuth);

      const response = await fetch(`${API_BASE_URL}/auth/driver/profile`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${authData.access_token}`,
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
        const err = await response.json();
        toast.error(err.error || "Failed to update profile.");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !profile) {
    return (
      <DriverShell title="Profile" subtitle="Loading..." nextBinId={nextBinId}>
        <div className="border-4 border-border bg-card p-12 text-center">
          <p className="font-bold text-muted-foreground">Loading profile information...</p>
        </div>
      </DriverShell>
    );
  }

  return (
    <DriverShell title="Profile" subtitle={vehicle?.territory_name || "Driver Shift"} nextBinId={nextBinId}>
      <section className="border-4 border-border bg-card p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-3xl font-extrabold text-foreground">{profile.full_name}</p>
            <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{profile.email}</p>
            <span
              className={`mt-2 inline-block border-2 border-current px-2 py-1 text-xs font-bold uppercase ${
                profile.is_active
                  ? "bg-success text-success-foreground"
                  : "bg-destructive text-destructive-foreground"
              }`}
            >
              {profile.is_active ? "Active Driver" : "Inactive"}
            </span>
          </div>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="border-4 border-primary bg-primary px-4 py-2 text-sm font-extrabold uppercase text-primary-foreground hover:bg-primary/90"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    full_name: profile.full_name || "",
                    phone: profile.phone || "",
                    address: profile.address || "",
                  });
                }}
                disabled={isSaving}
                className="border-4 border-border bg-background px-3 py-2 text-sm font-extrabold uppercase text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1 border-4 border-success bg-success px-3 py-2 text-sm font-extrabold uppercase text-success-foreground"
              >
                <Save className="size-4" /> {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-bold uppercase text-muted-foreground">
              <User className="size-4" /> Full Name
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              disabled={!isEditing}
              className="w-full border-4 border-border bg-background px-3 py-2 font-bold text-foreground disabled:opacity-60"
            />
          </div>

          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-bold uppercase text-muted-foreground">
              <Phone className="size-4" /> Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={!isEditing}
              placeholder="Add contact number"
              className="w-full border-4 border-border bg-background px-3 py-2 font-bold text-foreground disabled:opacity-60"
            />
          </div>

          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-bold uppercase text-muted-foreground">
              <MapPin className="size-4" /> Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              disabled={!isEditing}
              rows={2}
              placeholder="Add your address"
              className="w-full border-4 border-border bg-background px-3 py-2 font-bold text-foreground disabled:opacity-60"
            />
          </div>
        </div>

        <div className="mt-6 border-t-4 border-border pt-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            <Truck className="size-4" /> Assigned Vehicle Information
          </p>
          {vehicle ? (
            <dl className="space-y-2 text-lg font-bold text-foreground">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">License Plate</dt>
                <dd className="font-extrabold uppercase">{vehicle.license_plate}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Territory</dt>
                <dd>{vehicle.territory_name || "N/A"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd className="uppercase">{vehicle.status}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm font-bold text-muted-foreground">No vehicle currently assigned to this account.</p>
          )}
        </div>
      </section>

      <section className="border-4 border-border bg-card p-4">
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Today's Live Metrics</p>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          <div className="border-4 border-border p-3">
            <p className="text-3xl font-extrabold text-foreground">{collectedCount}</p>
            <p className="text-sm font-bold uppercase text-muted-foreground">Stops</p>
          </div>
          <div className="border-4 border-border p-3">
            <p className="text-3xl font-extrabold text-foreground">{distanceDoneKm}</p>
            <p className="text-sm font-bold uppercase text-muted-foreground">Km</p>
          </div>
          <div className="border-4 border-border p-3">
            <p className="text-3xl font-extrabold text-foreground">
              {(state.loadKg / 1000).toFixed(2)}
            </p>
            <p className="text-sm font-bold uppercase text-muted-foreground">Tonnes</p>
          </div>
        </div>
      </section>

      <section className="border-4 border-border bg-card p-4">
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Shift History
        </p>
        <ul className="mt-3 divide-y-4 divide-border">
          {SHIFT_HISTORY.map((s) => (
            <li key={s.date} className="flex items-center justify-between py-3">
              <span className="text-xl font-extrabold text-foreground">{s.date}</span>
              <span className="text-lg font-bold text-muted-foreground">
                {s.routes} routes · {s.km} km · {s.tonnes} t
              </span>
            </li>
          ))}
        </ul>
      </section>

      <a
        href={`tel:${profile.phone?.replace(/\s/g, "") || ""}`}
        className="flex w-full items-center justify-center gap-3 border-4 border-foreground bg-card py-5 text-2xl font-extrabold uppercase text-foreground hover:bg-muted"
      >
        <Phone className="size-8" /> Call Control Room
      </a>
    </DriverShell>
  );
}