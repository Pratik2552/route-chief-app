import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from "react-leaflet";
import { BINS, DEPOT } from "@/lib/driver-data";
import type { StopStatus } from "@/lib/driver-data";

export default function RouteMap({
  stopStatus,
  vehicle,
}: {
  stopStatus: (binId: string) => StopStatus;
  vehicle: { lat: number; lng: number };
}) {
  const path: [number, number][] = [
    [DEPOT.lat, DEPOT.lng],
    ...BINS.map((b) => [b.lat, b.lng] as [number, number]),
    [DEPOT.lat, DEPOT.lng],
  ];

  const color = (s: StopStatus) =>
    s === "collected" ? "#15803d" : s === "current" ? "#b45309" : "#334155";

  return (
    <MapContainer
      center={[12.9836, 77.6]}
      zoom={13}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline positions={path} pathOptions={{ color: "#1d4ed8", weight: 6, opacity: 0.8 }} />
      <CircleMarker
        center={[DEPOT.lat, DEPOT.lng]}
        radius={11}
        pathOptions={{ color: "#0f172a", fillColor: "#0f172a", fillOpacity: 1 }}
      >
        <Tooltip permanent direction="top">
          DEPOT
        </Tooltip>
      </CircleMarker>
      {BINS.map((b, i) => {
        const s = stopStatus(b.id);
        return (
          <CircleMarker
            key={b.id}
            center={[b.lat, b.lng]}
            radius={s === "current" ? 15 : 11}
            pathOptions={{ color: color(s), fillColor: color(s), fillOpacity: 1 }}
          >
            <Tooltip permanent direction="top">
              {i + 1}. {b.id}
            </Tooltip>
          </CircleMarker>
        );
      })}
      <CircleMarker
        center={[vehicle.lat, vehicle.lng]}
        radius={10}
        pathOptions={{ color: "#ffffff", weight: 4, fillColor: "#dc2626", fillOpacity: 1 }}
      >
        <Tooltip direction="bottom">Your truck</Tooltip>
      </CircleMarker>
    </MapContainer>
  );
}
