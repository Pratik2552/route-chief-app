import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Truck, Lock, Mail } from "lucide-react";
import { useVehicleAuthority } from "@/lib/vehicle-authority-store";

export const Route = createFileRoute("/authority/login")({
  head: () => ({
    meta: [
      { title: "Vehicle Authority Login | CivicSync" },
      {
        name: "description",
        content: "Login to the Vehicle Authority Portal to manage your fleet and operations.",
      },
      { property: "og:title", content: "Vehicle Authority Login | CivicSync" },
      {
        property: "og:description",
        content: "Secure login portal for vehicle authority personnel.",
      },
    ],
  }),
  component: AuthorityLogin,
});

function AuthorityLogin() {
  const navigate = useNavigate();
  const { login, state } = useVehicleAuthority();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  if (state.isAuthenticated && !state.isLoading) {
    navigate({ to: "/authority/home" });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate({ to: "/authority/home" });
    } else {
      setError(result.error || "Login failed");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center border-4 border-primary bg-primary">
            <Truck className="h-12 w-12 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-extrabold uppercase tracking-tight text-foreground">
            CivicSync
          </h1>
          <p className="mt-2 text-lg font-bold uppercase tracking-wide text-muted-foreground">
            Vehicle Authority Portal
          </p>
        </div>

        {/* Login Form */}
        <div className="border-4 border-border bg-card p-6">
          <h2 className="mb-6 text-2xl font-extrabold uppercase text-foreground">
            Login
          </h2>

          {error && (
            <div className="mb-4 border-4 border-destructive bg-destructive/10 p-3">
              <p className="text-sm font-bold text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-bold uppercase tracking-wide text-foreground"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border-4 border-border bg-background py-3 pl-12 pr-4 text-lg font-bold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  placeholder="authority@civicsync.com"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-bold uppercase tracking-wide text-foreground"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border-4 border-border bg-background py-3 pl-12 pr-4 text-lg font-bold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full border-4 border-primary bg-primary py-4 text-xl font-extrabold uppercase text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 border-t-4 border-border pt-4">
            <p className="text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Credentials provided by admin
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-4 text-center">
          <p className="text-sm font-bold text-muted-foreground">
            Need access? Contact your system administrator
          </p>
        </div>
      </div>
    </div>
  );
}
