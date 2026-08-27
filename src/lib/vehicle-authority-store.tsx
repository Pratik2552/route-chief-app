import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface VehicleAuthorityUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url?: string;
}

interface VehicleAuthorityState {
  user: VehicleAuthorityUser | null;
  access_token: string | null;
  refresh_token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const STORAGE_KEY = "civicsync-vehicle-authority-auth";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const initialState: VehicleAuthorityState = {
  user: null,
  access_token: null,
  refresh_token: null,
  isAuthenticated: false,
  isLoading: true,
};

type Ctx = {
  state: VehicleAuthorityState;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<VehicleAuthorityUser>) => void;
};

const VehicleAuthorityContext = createContext<Ctx | null>(null);

export function VehicleAuthorityProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<VehicleAuthorityState>(initialState);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        setState({
          ...saved,
          isAuthenticated: !!saved.access_token,
          isLoading: false,
        });
      } else {
        setState((s) => ({ ...s, isLoading: false }));
      }
    } catch {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  // Persist to localStorage on state change
  useEffect(() => {
    if (!state.isLoading) {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          user: state.user,
          access_token: state.access_token,
          refresh_token: state.refresh_token,
        })
      );
    }
  }, [state]);

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      try {
        console.log('🔐 Vehicle Authority Login - API URL:', `${API_BASE_URL}/auth/vehicle-authority/login`);
        
        const response = await fetch(`${API_BASE_URL}/auth/vehicle-authority/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error('❌ Login failed:', data);
          return {
            success: false,
            error: data.error || "Login failed. Please check your credentials.",
          };
        }

        console.log('✅ Login successful:', data.user);

        setState({
          user: data.user,
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          isAuthenticated: true,
          isLoading: false,
        });

        return { success: true };
      } catch (error) {
        console.error("Login error:", error);
        return {
          success: false,
          error: "Network error. Please check your connection and ensure the backend server is running at " + API_BASE_URL,
        };
      }
    },
    []
  );

  const logout = useCallback(() => {
    setState(initialState);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const updateProfile = useCallback((data: Partial<VehicleAuthorityUser>) => {
    setState((s) => ({
      ...s,
      user: s.user ? { ...s.user, ...data } : null,
    }));
  }, []);

  const value: Ctx = {
    state,
    login,
    logout,
    updateProfile,
  };

  return (
    <VehicleAuthorityContext.Provider value={value}>
      {children}
    </VehicleAuthorityContext.Provider>
  );
}

export function useVehicleAuthority() {
  const ctx = useContext(VehicleAuthorityContext);
  if (!ctx)
    throw new Error("useVehicleAuthority must be used inside VehicleAuthorityProvider");
  return ctx;
}

export { API_BASE_URL };
