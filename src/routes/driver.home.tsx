import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, MapPin, Route as RouteIcon, Truck } from "lucide-react";
import { DriverShell } from "@/components/driver/DriverShell";
import { useDriver } from "@/lib/driver-store";
import { BINS, VEHICLE } from "@/lib/driver-data";

export const Route = createFileRoute("/driver/home")({
  head: () => ({
    meta: [
      { title: "Driver Duty Dashboard | CivicSync" },
      {
        name: "description",
        content:
          "Start your shift, check vehicle load and view your assigned waste collection route.",
      },
      { property: "og:title", content: "Driver Duty Dashboard | CivicSync" },
      {
        property: "og:description",
        content: "Start duty, check vehicle capacity and see today's assigned collection route.",
      },
    ],
  }),
  component: DriverHome,
});

function DriverHome() {
  const { state, setOnDuty, startRoute, collectedCount, nextBinId } = useDriver();
  const navigate = useNavigate();
  const pct = Math.round((state.loadKg / VEHICLE.maxCapacityKg) * 100);

  return (
    <DriverShell title="Duty Dashboard" subtitle={VEHICLE.territory} nextBinId={nextBinId}>
      <section className="border-4 border-border bg-card p-4">
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Duty Status
        </p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span
            className={`flex-1 border-4 py-4 text-center text-2xl font-extrabold uppercase ${
              state.onDuty
                ? "border-success bg-success text-success-foreground"
                : "border-border bg-muted text-muted-foreground"
            }`}
          >
            {state.onDuty ? "On Duty" : "Off Duty"}
          </span>
          <button
            onClick={() => setOnDuty(!state.onDuty)}
            className="border-4 border-foreground px-4 py-4 text-lg font-extrabold uppercase text-foreground"
          >
            {state.onDuty ? "End" : "Go"}
          </button>
        </div>
      </section>

      <section className="border-4 border-border bg-card p-4">
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Vehicle Load
        </p>
        <p className="mt-1 text-4xl font-extrabold text-foreground">
          {state.loadKg} kg
          <span className="text-xl font-bold text-muted-foreground"> / {VEHICLE.maxCapacityKg} kg</span>
        </p>
        <div className="mt-3 h-10 w-full border-4 border-foreground bg-muted">
          <div
            className={`h-full ${pct >= 90 ? "bg-danger" : pct >= 60 ? "bg-warning" : "bg-success"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-lg font-bold text-foreground">
          {VEHICLE.maxCapacityKg - state.loadKg} kg space left
        </p>
      </section>

      <section className="border-4 border-border bg-card p-4">
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Assigned Route
        </p>
        <ul className="mt-3 space-y-3 text-xl font-bold text-foreground">
          <li className="flex items-center gap-3">
            <RouteIcon className="size-7" /> {BINS.length} stops ({collectedCount} done)
          </li>
          <li className="flex items-center gap-3">
            <Truck className="size-7" /> {VEHICLE.routeDistanceKm} km route
          </li>
          <li className="flex items-center gap-3">
            <MapPin className="size-7" /> {VEHICLE.territory}
          </li>
        </ul>
      </section>

      {state.onDuty ? (
        <button
          onClick={() => {
            startRoute();
            navigate({ to: "/driver/navigation" });
          }}
          className="w-full border-4 border-primary bg-primary py-6 text-3xl font-extrabold uppercase text-primary-foreground"
        >
          Start Route
        </button>
      ) : (
        <button
          onClick={() => setOnDuty(true)}
          className="w-full border-4 border-success bg-success py-6 text-3xl font-extrabold uppercase text-success-foreground"
        >
          Start Duty
        </button>
      )}

      {collectedCount === BINS.length ? (
        <p className="flex items-center justify-center gap-2 text-lg font-bold text-success">
          <CheckCircle2 className="size-6" /> All stops collected — return to depot
        </p>
      ) : null}
    </DriverShell>
  );
}
