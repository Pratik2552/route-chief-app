import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // Check if vehicle is logged in (NEW SYSTEM)
    const vehicleToken = typeof window !== 'undefined' 
      ? window.localStorage.getItem('civicsync_vehicle_token')
      : null;
    
    if (vehicleToken) {
      throw redirect({ to: "/vehicle/dashboard" });
    }
    
    // Check if vehicle authority is logged in (OLD SYSTEM)
    const authorityToken = typeof window !== 'undefined' 
      ? window.localStorage.getItem('civicsync-vehicle-authority-auth')
      : null;
    
    if (authorityToken) {
      throw redirect({ to: "/authority/home" });
    }
    
    // Default to NEW vehicle login
    throw redirect({ to: "/vehicle/login" });
  },
});
