export type Priority = "high" | "medium" | "low";
export type StopStatus = "pending" | "current" | "collected";

export type Bin = {
  id: string;
  address: string;
  area: string;
  type: "General" | "Organic" | "Recyclable";
  fill: number;
  weightKg: number;
  priority: Priority;
  lat: number;
  lng: number;
};

export const DEPOT = {
  name: "Ward 12 Depot",
  lat: 12.9716,
  lng: 77.5946,
};

export const VEHICLE = {
  id: "CS-VH-042",
  plate: "KA 01 MG 3312",
  maxCapacityKg: 1000,
  territory: "Ward 12 — North Sector",
  routeDistanceKm: 14.2,
};

export const DRIVER = {
  name: "Ramesh Kumar",
  staffId: "DRV-2291",
  phone: "+91 98450 11223",
  shift: "Morning · 06:00 – 14:00",
};

export const BINS: Bin[] = [
  {
    id: "BIN-101",
    address: "Kempegowda Circle, Market Road",
    area: "Sector A",
    type: "General",
    fill: 92,
    weightKg: 140,
    priority: "high",
    lat: 12.9784,
    lng: 77.5998,
  },
  {
    id: "BIN-118",
    address: "5th Cross, Gandhi Nagar",
    area: "Sector A",
    type: "Organic",
    fill: 88,
    weightKg: 120,
    priority: "high",
    lat: 12.9825,
    lng: 77.5885,
  },
  {
    id: "BIN-124",
    address: "Public Health Centre Gate",
    area: "Sector B",
    type: "General",
    fill: 74,
    weightKg: 110,
    priority: "medium",
    lat: 12.9889,
    lng: 77.5951,
  },
  {
    id: "BIN-137",
    address: "Sri Ram School, Back Lane",
    area: "Sector B",
    type: "Recyclable",
    fill: 61,
    weightKg: 85,
    priority: "medium",
    lat: 12.9932,
    lng: 77.6042,
  },
  {
    id: "BIN-145",
    address: "Bus Stand Rear Yard",
    area: "Sector C",
    type: "General",
    fill: 55,
    weightKg: 95,
    priority: "low",
    lat: 12.9861,
    lng: 77.6118,
  },
  {
    id: "BIN-152",
    address: "Housing Board Colony, Block D",
    area: "Sector C",
    type: "Organic",
    fill: 40,
    weightKg: 70,
    priority: "low",
    lat: 12.9772,
    lng: 77.6089,
  },
];

export const SHIFT_HISTORY = [
  { date: "Yesterday", routes: 2, km: 27.4, tonnes: 1.9 },
  { date: "Wed, 12 Aug", routes: 2, km: 24.1, tonnes: 1.7 },
  { date: "Tue, 11 Aug", routes: 1, km: 13.8, tonnes: 0.9 },
];
