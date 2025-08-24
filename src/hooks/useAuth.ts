import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";

export function useAuth() {
  const { data: response, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user: response?.user as User | undefined,
    isLoading,
    isAuthenticated: !!response?.user,
    error,
  };
}
