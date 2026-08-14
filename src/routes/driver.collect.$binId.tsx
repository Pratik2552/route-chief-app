import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Camera, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { DriverShell } from "@/components/driver/DriverShell";
import { useDriver } from "@/lib/driver-store";
import { BINS } from "@/lib/driver-data";

export const Route = createFileRoute("/driver/collect/$binId")({
  head: () => ({
    meta: [
      { title: "Bin Collection | CivicSync Driver" },
      {
        name: "description",
        content: "Record a bin collection with a mandatory photo proof in two taps.",
      },
      { property: "og:title", content: "Bin Collection | CivicSync Driver" },
      {
        property: "og:description",
        content: "Capture proof and mark a waste bin as collected on the field.",
      },
    ],
  }),
  component: CollectBin,
});

function CollectBin() {
  const { binId } = Route.useParams();
  const navigate = useNavigate();
  const { markCollected, stopStatus, nextBinId } = useDriver();
  const [photo, setPhoto] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const bin = BINS.find((b) => b.id === binId);
  if (!bin) {
    return (
      <DriverShell title="Bin not found" nextBinId={nextBinId}>
        <p className="text-xl font-bold">This bin is not on your route.</p>
      </DriverShell>
    );
  }

  const done = stopStatus(bin.id) === "collected";

  return (
    <DriverShell title={bin.id} subtitle={bin.address} nextBinId={nextBinId}>
      <section className="border-4 border-border bg-card p-4">
        <dl className="space-y-3 text-xl font-bold text-foreground">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Bin type</dt>
            <dd>{bin.type}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Fill level</dt>
            <dd>{bin.fill}%</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Priority</dt>
            <dd className="uppercase">{bin.priority}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Area</dt>
            <dd>{bin.area}</dd>
          </div>
        </dl>
      </section>

      <section className="border-4 border-border bg-card p-4">
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Photo proof (required)
        </p>
        {photo ? (
          <img src={photo} alt={`Proof of collection for ${bin.id}`} className="mt-3 w-full border-4 border-border" />
        ) : null}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setPhoto(URL.createObjectURL(file));
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="mt-3 flex w-full items-center justify-center gap-3 border-4 border-foreground bg-card py-5 text-2xl font-extrabold uppercase text-foreground"
        >
          <Camera className="size-8" /> {photo ? "Retake photo" : "Take photo"}
        </button>
      </section>

      {done ? (
        <p className="flex items-center justify-center gap-2 border-4 border-success bg-success py-5 text-2xl font-extrabold uppercase text-success-foreground">
          <CheckCircle2 className="size-8" /> Collected
        </p>
      ) : (
        <button
          disabled={!photo}
          onClick={() => {
            markCollected(bin.id, photo);
            toast.success(`${bin.id} marked collected`);
            navigate({ to: "/driver/navigation" });
          }}
          className="w-full border-4 border-primary bg-primary py-6 text-3xl font-extrabold uppercase text-primary-foreground disabled:border-border disabled:bg-muted disabled:text-muted-foreground"
        >
          Mark as Collected
        </button>
      )}
      {!photo && !done ? (
        <p className="text-center text-lg font-bold text-muted-foreground">
          Take the photo to enable this button
        </p>
      ) : null}
    </DriverShell>
  );
}
