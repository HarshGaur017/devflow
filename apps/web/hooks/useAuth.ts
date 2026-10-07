import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/services/auth.service";

export function useAuth() {
  const query = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getCurrentUser,
    retry: false,
  });

  return {
    user: query.data,
    isLoading: query.isLoading,
    isAuthenticated: query.isSuccess,
  };
}
