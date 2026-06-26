import { useAuth } from "./useAuth.js";

export function useAdmin() {
  const { user, isAdmin, loading } = useAuth();
  return { user, isAdmin, loading };
}
