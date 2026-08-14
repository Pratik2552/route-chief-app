import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { AlertTriangle, Navigation } from "lucide-react";
import { toast } from "sonner";
import { DriverShell } from "@/components/driver/DriverShell";
import { useDriver } from "@/lib/driver-store";
import { BINS, DEPOT } from "@/lib/driver-data";

const RouteMap = lazy(() => import("@/components/driver/RouteMap"));

export const Route = createFileRoute("/driver/navigation")({
  head: () => ({
    meta: [
      { title: "Route Navigation | CivicSync Driver" },
      {
        name: "description",
        content: "Live map, stop-by-stop bin checklist and re-route requests for collection crews.",
      },
      { property: "og:title", content: "Route Navigation | CivicSync Driver" },
      {
        property: "og:description",
        content: "Follow the assigned collection route stop by stop on a large, clear map.",
      },
    ],
  }),
  component: DriverNavigation,
});

function DriverNavigation() {
  const { stopStatus, nextBinId } = useDriver();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const nextBin = BINS.find((b) => b.id === nextBinId);
  const vehicle = { lat: DEPOT.lat + 0.004, lng: DEPOT.lng + 0.004 };

  return (
    <DriverShell
      title="Navigation"
      subtitle={nextBin ? `Next: ${nextBin.id} — ${nextBin.address}` : "Return to depot"}
      nextBinId={nextBinId}
      flush
    >
      <div className="h-[45vh] w-full border-b-4 border-border bg-muted">
        {mounted ? (
          <Suspense fallback={<div className="p-4 text-lg font-bold">Loading map…</div>}>
            <RouteMap stopStatus={stopStatus} vehicle={vehicle} />
          </Suspense>
        ) : null}
      </div>

      <div className="space-y-3 p-4">
        <button
          onClick={() => toast.success("Re-route requested. Control room notified.")}
          className="flex w-full items-center justify-center gap-3 border-4 border-warning bg-warning py-5 text-2xl font-extrabold uppercase text-warning-foreground"
        >
          <AlertTriangle className="size-8" /> Request Re-route
        </button>

        <p className="pt-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Stops in order
        </p>

        <ol className="space-y-3">
          {BINS.map((bin, i) => {
            const status = stopStatus(bin.id);
            return (
              <li
                key={bin.id}
                className={`border-4 p-4 ${
                  status === "current"
                    ? "border-warning bg-card"
                    : status === "collected"
                      ? "border-border bg-muted"
                      : "border-border bg-card"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-2xl font-extrabold text-foreground">
                      {i + 1}. {bin.id}
                    </p>
                    <p className="text-lg font-semibold text-foreground">{bin.address}</p>
                    <p className="mt-1 text-base font-bold uppercase text-muted-foreground">
                      Priority: {bin.priority}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 border-4 px-3 py-2 text-base font-extrabold uppercase ${
                      status === "collected"
                        ? "border-success bg-success text-success-foreground"
                        : status === "current"
                          ? "border-warning bg-warning text-warning-foreground"
                          : "border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    {status}
                  </span>
                </div>
                {status === "current" ? (
                  <Link
                    to="/driver/collect/$binId"
                    params={{ binId: bin.id }}
                    className="mt-4 flex w-full items-center justify-center gap-3 border-4 border-primary bg-primary py-4 text-2xl font-extrabold uppercase text-primary-foreground"
                  >
                    <Navigation className="size-7" /> Go to stop
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </DriverShell>
  );
}
