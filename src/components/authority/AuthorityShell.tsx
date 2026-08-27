import { Link, useNavigate } from "@tanstack/react-router";
import { Home, Truck, User, LogOut, Menu, X, QrCode, FileText } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useVehicleAuthority } from "@/lib/vehicle-authority-store";

const NAV = [
  { to: "/authority/home", label: "Dashboard", icon: Home },
  { to: "/authority/vehicles", label: "Vehicles", icon: Truck },
  { to: "/authority/qr-code", label: "QR Code", icon: QrCode },
  { to: "/authority/live-reports", label: "Live Reports", icon: FileText },
  { to: "/authority/profile", label: "Profile", icon: User },
] as const;

export function AuthorityShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { state, logout } = useVehicleAuthority();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate({ to: "/authority/login" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden w-72 border-r-4 border-border bg-card lg:flex lg:flex-col">
        <div className="border-b-4 border-border bg-primary p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center border-4 border-primary-foreground bg-primary-foreground">
              <Truck className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold uppercase text-primary-foreground">
                CivicSync
              </h1>
              <p className="text-xs font-bold uppercase tracking-wide text-primary-foreground/80">
                Authority Portal
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {NAV.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  activeProps={{
                    className:
                      "flex items-center gap-3 border-4 border-primary bg-primary px-4 py-3 text-primary-foreground font-extrabold",
                  }}
                  className="flex items-center gap-3 border-4 border-border bg-background px-4 py-3 font-bold text-foreground transition-colors hover:bg-muted"
                >
                  <Icon className="h-5 w-5" />
                  <span className="uppercase tracking-wide">{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t-4 border-border p-4">
          <div className="mb-3 rounded border-2 border-border bg-muted p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Logged in as
            </p>
            <p className="mt-1 truncate text-sm font-extrabold text-foreground">
              {state.user?.full_name || "User"}
            </p>
            <p className="truncate text-xs font-bold text-muted-foreground">
              {state.user?.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 border-4 border-destructive bg-destructive px-4 py-2 font-extrabold uppercase text-destructive-foreground transition-colors hover:bg-destructive/90"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="sticky top-0 z-50 border-b-4 border-border bg-primary p-4 lg:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border-4 border-primary-foreground bg-primary-foreground">
              <Truck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold uppercase text-primary-foreground">
                CivicSync
              </h1>
              <p className="text-xs font-bold uppercase text-primary-foreground/80">Authority</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="border-4 border-primary-foreground bg-primary-foreground p-2 text-primary"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute left-0 right-0 top-full border-b-4 border-border bg-card">
            <nav className="p-4">
              <ul className="space-y-2">
                {NAV.map(({ to, label, icon: Icon }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      onClick={() => setMobileMenuOpen(false)}
                      activeProps={{
                        className:
                          "flex items-center gap-3 border-4 border-primary bg-primary px-4 py-3 text-primary-foreground font-extrabold",
                      }}
                      className="flex items-center gap-3 border-4 border-border bg-background px-4 py-3 font-bold text-foreground"
                    >
                      <Icon className="h-5 w-5" />
                      <span className="uppercase">{label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t-4 border-border pt-4">
                <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">
                  {state.user?.full_name}
                </p>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 border-4 border-destructive bg-destructive px-4 py-2 font-extrabold uppercase text-destructive-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        <header className="border-b-4 border-border bg-card px-6 py-4">
          <h2 className="text-3xl font-extrabold uppercase text-foreground">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-sm font-bold uppercase tracking-wide text-muted-foreground">
              {subtitle}
            </p>
          )}
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
