import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User, Wallet } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  wallet: Wallet | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshWallet: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", { username, password });
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      setWallet(data.wallet);
      localStorage.setItem("whalex_user", JSON.stringify(data.user));
      localStorage.setItem("whalex_wallet", JSON.stringify(data.wallet));
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ username, email, password }: { username: string; email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/register", { username, email, password });
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      setWallet(data.wallet);
      localStorage.setItem("whalex_user", JSON.stringify(data.user));
      localStorage.setItem("whalex_wallet", JSON.stringify(data.wallet));
    },
  });

  const { data: walletData } = useQuery({
    queryKey: ["/api/wallet/" + user?.id],
    enabled: !!user?.id,
    refetchInterval: 5000, // Refresh wallet every 5 seconds
  });

  useEffect(() => {
    if (walletData) {
      setWallet(walletData);
      localStorage.setItem("whalex_wallet", JSON.stringify(walletData));
    }
  }, [walletData]);

  useEffect(() => {
    // Load user from localStorage on app start
    const savedUser = localStorage.getItem("whalex_user");
    const savedWallet = localStorage.getItem("whalex_wallet");
    
    if (savedUser && savedWallet) {
      setUser(JSON.parse(savedUser));
      setWallet(JSON.parse(savedWallet));
    }
  }, []);

  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ username, password });
  };

  const register = async (username: string, email: string, password: string) => {
    await registerMutation.mutateAsync({ username, email, password });
  };

  const logout = () => {
    setUser(null);
    setWallet(null);
    localStorage.removeItem("whalex_user");
    localStorage.removeItem("whalex_wallet");
    queryClient.clear();
  };

  const refreshWallet = () => {
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/" + user.id] });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshWallet,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
