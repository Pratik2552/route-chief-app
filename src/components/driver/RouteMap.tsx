import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polyline, Polygon, CircleMarker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
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
  /** GeoJSON LineString from the optimized route solver (NN + 2-opt) */
  optimizedRoute?: {
    type: string;
    coordinates: [number, number][]; // [lng, lat] format from GeoJSON
  } | null;
  onToggleBin?: (binName: string, currentStatus: boolean) => void;
  isExpanded?: boolean;
}

/** Auto-fit map view to fit driver's territory & assigned bins — only fits ONCE on first load */
function MapAutoBounds({
  zoneCoords,
  kmlRouteCoords,
  optimizedCoords,
  bins,
  depot,
  isExpanded,
}: {
  zoneCoords: [number, number][];
  kmlRouteCoords: [number, number][];
  optimizedCoords: [number, number][];
  bins: Array<{ lat: number; lng: number }>;
  depot?: { lat: number; lng: number };
  isExpanded?: boolean;
}) {
  const map = useMap();
  const hasFitRef = useRef(false);       // track if we've done the initial fit
  const prevExpandedRef = useRef(isExpanded); // track fullscreen toggle

  useEffect(() => {
    map.invalidateSize();

    const expandedChanged = prevExpandedRef.current !== isExpanded;
    prevExpandedRef.current = isExpanded;

    // Only fit bounds on first load OR when user explicitly toggles fullscreen
    if (hasFitRef.current && !expandedChanged) return;

    const points: L.LatLngTuple[] = [];

    if (zoneCoords && zoneCoords.length > 0) {
      zoneCoords.forEach(([lat, lng]) => points.push([lat, lng]));
    }

    if (kmlRouteCoords && kmlRouteCoords.length > 0) {
      kmlRouteCoords.forEach(([lat, lng]) => points.push([lat, lng]));
    }

    if (optimizedCoords && optimizedCoords.length > 0) {
      optimizedCoords.forEach(([lat, lng]) => points.push([lat, lng]));
    }

    if (bins && bins.length > 0) {
      bins.forEach((b) => points.push([b.lat, b.lng]));
    }

    if (depot) {
      points.push([depot.lat, depot.lng]);
    }

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: isExpanded ? [60, 60] : [35, 35],
          maxZoom: 16,
          animate: true,
        });
        hasFitRef.current = true; // mark as fitted — won't re-fit on next poll
      }
    }
  }, [map, zoneCoords, kmlRouteCoords, optimizedCoords, bins, depot, isExpanded]);

  return null;
}

export default function RouteMap({
  vehicle = { lat: 19.892379, lng: 74.484606 },
  kmlData,
  optimizedRoute,
  onToggleBin,
  isExpanded = false,
}: KMLDriverMapProps) {
  const center: [number, number] = kmlData?.depot
    ? [kmlData.depot.lat, kmlData.depot.lng]
    : [19.892379, 74.484606];

  const zoneCoords = kmlData?.driverZone?.coordinates || [];
  const kmlRouteCoords = kmlData?.route?.coordinates || [];

  // Convert GeoJSON [lng, lat] → Leaflet [lat, lng]
  const optimizedPolylineCoords: [number, number][] = optimizedRoute?.coordinates
    ? optimizedRoute.coordinates.map(([lng, lat]) => [lat, lng])
    : [];

  return (
    <MapContainer
      center={center}
      zoom={14}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />

      {/* Auto Fit Bounds to Driver's Territory */}
      <MapAutoBounds
        zoneCoords={zoneCoords}
        kmlRouteCoords={kmlRouteCoords}
        optimizedCoords={optimizedPolylineCoords}
        bins={kmlData?.bins || []}
        depot={kmlData?.depot}
        isExpanded={isExpanded}
      />

      {/* 1. Driver's Assigned Territory Polygon (Orange Accent) */}
      {zoneCoords.length > 0 && (
        <Polygon
          positions={zoneCoords}
          pathOptions={{
            color: "#f97316",
            weight: 3,
            fillColor: "#f97316",
            fillOpacity: 0.15,
            dashArray: "5,5",
          }}
        >
          <Tooltip direction="center">
            {kmlData?.driverZone?.name || "Territory Zone"}
          </Tooltip>
        </Polygon>
      )}

      {/* 2. KML Marked Collection Path (White Dashed Line) */}
      {kmlRouteCoords.length > 0 && (
        <Polyline
          positions={kmlRouteCoords}
          pathOptions={{
            color: "#ffffff",
            weight: 4,
            opacity: 0.7,
            dashArray: "8,6",
          }}
        >
          <Tooltip direction="top">Marked Territory Route</Tooltip>
        </Polyline>
      )}

      {/* 3. Shortest Path Route (Bright Orange Solid Line) */}
      {optimizedPolylineCoords.length > 1 && (
        <>
          {/* Contrast shadow stroke */}
          <Polyline
            positions={optimizedPolylineCoords}
            pathOptions={{ color: "#0a0e0b", weight: 9, opacity: 0.5 }}
          />
          {/* Main path */}
          <Polyline
            positions={optimizedPolylineCoords}
            pathOptions={{
              color: "#ea580c",
              weight: 6,
              opacity: 0.95,
            }}
          >
            <Tooltip direction="top" sticky>
              Shortest Path — Follow this route
            </Tooltip>
          </Polyline>
        </>
      )}

      {/* 4. Pickup Bins (Green = Collected, Red = Pending) */}
      {kmlData?.bins?.map((b, i) => {
        const isGreen = b.isCollected;
        const color = isGreen ? "#16a34a" : "#dc2626";

        return (
          <CircleMarker
            key={b.id || b.name}
            center={[b.lat, b.lng]}
            radius={12}
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
            {/* Non-permanent tooltip prevents clumsy label overlapping */}
            <Tooltip direction="top" offset={[0, -10]}>
              Stop {i + 1}: {b.name} {isGreen ? "[Collected]" : "[Pending]"}
            </Tooltip>
          </CircleMarker>
        );
      })}

      {/* 5. Central Depot Marker */}
      {kmlData?.depot && (
        <>
          <CircleMarker
            center={[kmlData.depot.lat, kmlData.depot.lng]}
            radius={14}
            pathOptions={{ color: "#ffffff", fillColor: "#121814", fillOpacity: 1, weight: 3 }}
          >
            <Tooltip direction="bottom">
              Central Depot (Start Location)
            </Tooltip>
          </CircleMarker>

          <CircleMarker
            center={[kmlData.depot.lat + 0.015, kmlData.depot.lng + 0.025]}
            radius={14}
            pathOptions={{ color: "#ffffff", fillColor: "#b91c1c", fillOpacity: 1, weight: 3 }}
          >
            <Tooltip direction="bottom">
              Dump Yard (Return Destination)
            </Tooltip>
          </CircleMarker>
        </>
      )}

      {/* 6. Driver Truck Position */}
      {vehicle && (
        <CircleMarker
          center={[vehicle.lat, vehicle.lng]}
          radius={10}
          pathOptions={{ color: "#ffffff", weight: 4, fillColor: "#ea580c", fillOpacity: 1 }}
        >
          <Tooltip direction="bottom">Your Vehicle</Tooltip>
        </CircleMarker>
      )}
    </MapContainer>
  );
}

