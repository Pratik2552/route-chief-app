import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { User, Mail, Phone, MapPin, Save } from "lucide-react";
import { AuthorityShell } from "@/components/authority/AuthorityShell";
import { useVehicleAuthority, API_BASE_URL } from "@/lib/vehicle-authority-store";
import { toast } from "sonner";

export const Route = createFileRoute("/authority/profile")({
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
      { title: "Profile | Vehicle Authority" },
      { name: "description", content: "Manage your account profile" },
    ],
  }),
  component: AuthorityProfile,
});

interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  address?: string;
  role: string;
  is_active: boolean;
}

function AuthorityProfile() {
  const navigate = useNavigate();
  const { state, updateProfile } = useVehicleAuthority();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address: "",
  });

  const fetchProfile = async () => {
    if (!state.access_token) {
      navigate({ to: "/authority/login" });
      return;
    }

    const baseUrl = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;
    try {
      const response = await fetch(`${baseUrl}/auth/vehicle-authority/profile`, {
        headers: {
          Authorization: `Bearer ${state.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setFormData({
          full_name: data.profile.full_name || "",
          phone: data.profile.phone || "",
          address: data.profile.address || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [state.access_token]);

  const handleSave = async () => {
    setIsSaving(true);
    const baseUrl = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

    try {
      const response = await fetch(`${baseUrl}/auth/vehicle-authority/profile`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${state.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        updateProfile({ full_name: data.profile.full_name });
        toast.success("Profile updated successfully!");
        setIsEditing(false);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update profile");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) {
    return (
      <AuthorityShell title="Profile" subtitle="Loading...">
        <div className="border-4 border-border bg-card p-12 text-center">
          <p className="font-bold text-muted-foreground">Loading profile...</p>
        </div>
      </AuthorityShell>
    );
  }

  return (
    <AuthorityShell title="My Profile" subtitle="Manage your account information">
      {/* Profile Header */}
      <div className="border-4 border-border bg-card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center border-4 border-primary bg-primary text-3xl font-extrabold uppercase text-primary-foreground">
              {profile.full_name?.charAt(0) || "U"}
            </div>
            <div>
              <h2 className="text-2xl font-extrabold uppercase text-foreground">
                {profile.full_name}
              </h2>
              <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                Vehicle Authority
              </p>
              <span
                className={`mt-2 inline-block border-2 border-current px-2 py-1 text-xs font-bold uppercase ${
                  profile.is_active
                    ? "bg-success text-success-foreground"
                    : "bg-destructive text-destructive-foreground"
                }`}
              >
                {profile.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="border-4 border-primary bg-primary px-6 py-3 font-extrabold uppercase text-primary-foreground hover:bg-primary/90"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-3">
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
                className="border-4 border-border bg-background px-6 py-3 font-extrabold uppercase text-foreground hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 border-4 border-success bg-success px-6 py-3 font-extrabold uppercase text-success-foreground hover:bg-success/90 disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Form */}
      <div className="border-4 border-border bg-card p-6">
        <h3 className="mb-6 text-xl font-extrabold uppercase text-foreground">
          Account Details
        </h3>

        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-foreground">
              <User className="h-4 w-4" />
              Full Name
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              disabled={!isEditing}
              className="w-full border-4 border-border bg-background px-4 py-3 font-bold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none disabled:opacity-60"
              placeholder="Enter your full name"
            />
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-foreground">
              <Mail className="h-4 w-4" />
              Email Address
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full border-4 border-border bg-muted px-4 py-3 font-bold text-muted-foreground"
            />
            <p className="mt-1 text-xs font-bold text-muted-foreground">
              Email cannot be changed
            </p>
          </div>

          {/* Phone */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-foreground">
              <Phone className="h-4 w-4" />
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={!isEditing}
              className="w-full border-4 border-border bg-background px-4 py-3 font-bold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none disabled:opacity-60"
              placeholder="Enter your phone number"
            />
          </div>

          {/* Address */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-foreground">
              <MapPin className="h-4 w-4" />
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              disabled={!isEditing}
              rows={3}
              className="w-full border-4 border-border bg-background px-4 py-3 font-bold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none disabled:opacity-60"
              placeholder="Enter your address"
            />
          </div>
        </div>
      </div>
    </AuthorityShell>
  );
}
