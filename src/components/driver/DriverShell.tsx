import { Link } from "@tanstack/react-router";
import { Home, Map, PackageCheck, User, QrCode, FileText } from "lucide-react";
import type { ReactNode } from "react";

const NAV = [
  { to: "/driver/home", label: "Home", icon: Home },
  { to: "/driver/navigation", label: "Territory", icon: Map },
  { to: "/driver/live-reports", label: "Reports", icon: FileText },
  { to: "/driver/qr-generator", label: "QR Code", icon: QrCode },
  { to: "/driver/profile", label: "Profile", icon: User },
] as const;

export function DriverShell({
  title,
  subtitle,
  children,
  nextBinId,
  flush,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  nextBinId: string | null;
  flush?: boolean;
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col bg-background">
      <header className="sticky top-0 z-[500] border-b-4 border-primary bg-primary px-4 py-3 text-primary-foreground">
        <p className="text-xs font-bold uppercase tracking-widest opacity-80">CivicSync Driver</p>
        <h1 className="text-2xl font-extrabold uppercase leading-tight">{title}</h1>
        {subtitle ? <p className="text-sm font-semibold opacity-90">{subtitle}</p> : null}
      </header>

      <main className={flush ? "flex-1" : "flex-1 space-y-4 p-4 pb-6"}>{children}</main>

      <nav className="sticky bottom-0 z-[500] grid grid-cols-5 border-t-4 border-border bg-card">
        {NAV.map(({ to, label, icon: Icon }) => {
          const common = {
            activeProps: { className: "bg-secondary text-secondary-foreground" },
            className: "flex flex-col items-center gap-1 py-3 text-foreground",
            children: (
              <>
                <Icon className="size-6" strokeWidth={2.4} />
                <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
              </>
            ),
          };
          return to === "/driver/collect/$binId" ? (
            <Link key={to} to={to} params={{ binId: nextBinId ?? "BIN-101" }} {...common} />
          ) : (
            <Link key={to} to={to} {...common} />
          );
        })}
      </nav>

    </div>
  );
}
