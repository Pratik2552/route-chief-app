import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Polyline, Polygon, CircleMarker, Tooltip } from "react-leaflet";
import type { StopStatus } from "@/lib/driver-data";

export interface KMLDriverMapProps {
  stopStatus?: (binId: string) => StopStatus;
  vehicle?: { lat: number; lng: number };
  kmlData?: {
    driverZone?: { name: string; coordinates: [number, number][] };
    route?: { name: string; coordinates: [number, number][] };
    bins?: Array<{ id: string; name: string; lat: number; lng: number; isCollected: boolean }>;
    depot?: { name: string; lat: number; lng: number };
    isAllCollected?: boolean;
  } | null;
  onToggleBin?: (binName: string, currentStatus: boolean) => void;
}

export default function RouteMap({
  vehicle = { lat: 19.892379, lng: 74.484606 },
  kmlData,
  onToggleBin,
}: KMLDriverMapProps) {
  // If KML data exists, use KML coordinates (mapping3.kml)
  const center: [number, number] = kmlData?.depot
    ? [kmlData.depot.lat, kmlData.depot.lng]
    : [19.892379, 74.484606];

  const zoneCoords = kmlData?.driverZone?.coordinates || [];
  const routeCoords = kmlData?.route?.coordinates || [];

  return (
    <MapContainer
      center={center}
      zoom={14}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />

      {/* 1. Driver's Assigned Territory Polygon */}
      {zoneCoords.length > 0 && (
        <Polygon
          positions={zoneCoords}
          pathOptions={{
            color: "#2563eb",
            weight: 3,
            fillColor: "#2563eb",
            fillOpacity: 0.15,
            dashArray: "5,5",
          }}
        >
          <Tooltip permanent direction="center">
            {kmlData?.driverZone?.name || "Your Territory Zone"}
          </Tooltip>
        </Polygon>
      )}

      {/* 2. Driver's Assigned Marked Collection Path */}
      {routeCoords.length > 0 && (
        <Polyline
          positions={routeCoords}
          pathOptions={{
            color: "#1d4ed8",
            weight: 5,
            opacity: 0.9,
          }}
        >
          <Tooltip direction="top">Marked Collection Route</Tooltip>
        </Polyline>
      )}

      {/* 3. Pickup Bins (Green = Collected YES, Red = Pending NO) */}
      {kmlData?.bins?.map((b, i) => {
        const isGreen = b.isCollected;
        const color = isGreen ? "#16a34a" : "#dc2626";

        return (
          <CircleMarker
            key={b.id || b.name}
            center={[b.lat, b.lng]}
            radius={13}
            pathOptions={{
              color: "#ffffff",
              fillColor: color,
              fillOpacity: 1,
              weight: 3,
            }}
            eventHandlers={{
              click: () => onToggleBin && onToggleBin(b.name, isGreen),
            }}
          >
            <Tooltip permanent direction="top">
              {i + 1}. {b.name} {isGreen ? "✅ (YES)" : "🔴 (NO)"}
            </Tooltip>
          </CircleMarker>
        );
      })}

      {/* 4. Central Depot Marker */}
      {kmlData?.depot && (
        <CircleMarker
          center={[kmlData.depot.lat, kmlData.depot.lng]}
          radius={14}
          pathOptions={{ color: "#ffffff", fillColor: "#0f172a", fillOpacity: 1, weight: 3 }}
        >
          <Tooltip permanent direction="bottom">
            🏢 DEPOT (Return Destination)
          </Tooltip>
        </CircleMarker>
      )}

      {/* 5. Driver Truck Position */}
      {vehicle && (
        <CircleMarker
          center={[vehicle.lat, vehicle.lng]}
          radius={10}
          pathOptions={{ color: "#ffffff", weight: 4, fillColor: "#ea580c", fillOpacity: 1 }}
        >
          <Tooltip direction="bottom">🚚 Your Truck</Tooltip>
        </CircleMarker>
      )}
    </MapContainer>
  );
}
