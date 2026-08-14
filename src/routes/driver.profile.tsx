import { createFileRoute } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import { DriverShell } from "@/components/driver/DriverShell";
import { useDriver } from "@/lib/driver-store";
import { DRIVER, SHIFT_HISTORY, VEHICLE } from "@/lib/driver-data";

export const Route = createFileRoute("/driver/profile")({
  head: () => ({
    meta: [
      { title: "Driver Profile & Shift History | CivicSync" },
      {
        name: "description",
        content: "Driver details, assigned vehicle and a simple summary of completed shifts.",
      },
      { property: "og:title", content: "Driver Profile & Shift History | CivicSync" },
      {
        property: "og:description",
        content: "See your vehicle assignment, routes completed, distance and tonnage cleared.",
      },
    ],
  }),
  component: DriverProfile,
});

function DriverProfile() {
  const { state, nextBinId, collectedCount, distanceDoneKm } = useDriver();

  return (
    <DriverShell title="Profile" subtitle={DRIVER.shift} nextBinId={nextBinId}>
      <section className="border-4 border-border bg-card p-4">
        <p className="text-3xl font-extrabold text-foreground">{DRIVER.name}</p>
        <p className="text-lg font-bold text-muted-foreground">Staff ID {DRIVER.staffId}</p>
        <dl className="mt-4 space-y-3 text-xl font-bold text-foreground">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Contact</dt>
            <dd>{DRIVER.phone}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Vehicle ID</dt>
            <dd>{VEHICLE.id}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">License plate</dt>
            <dd>{VEHICLE.plate}</dd>
          </div>
        </dl>
      </section>

      <section className="border-4 border-border bg-card p-4">
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Today</p>
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
          Shift history
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
        href={`tel:${DRIVER.phone.replace(/\s/g, "")}`}
        className="flex w-full items-center justify-center gap-3 border-4 border-foreground bg-card py-5 text-2xl font-extrabold uppercase text-foreground"
      >
        <Phone className="size-8" /> Call Control Room
      </a>
    </DriverShell>
  );
}
