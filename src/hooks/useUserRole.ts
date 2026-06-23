import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "super_admin" | "admin" | "priest" | "user";

interface UserRoleResult {
  role: AppRole;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isPriest: boolean;
}

const VALID_ROLES: AppRole[] = ["super_admin", "admin", "priest", "user"];

export const useUserRole = (): UserRoleResult => {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole>("user");
  const [loading, setLoading] = useState(true);
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null);

  // Stay in loading until the role for the CURRENT user is resolved
  const effectiveLoading = authLoading || (!!user && checkedUserId !== user.id);

  useEffect(() => {
    let cancelled = false;
    let retries = 0;

    if (!user) {
      setRole("user");
      setCheckedUserId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setRole("user");

    const checkUserRole = async () => {
      try {
        const { data, error } = await supabase.rpc("get_user_role", {
          _user_id: user.id,
        });

        if (cancelled) return;

        if (error) {
          console.error("Error fetching user role:", error);
          if (retries < 3) {
            retries++;
            setTimeout(checkUserRole, 800 * retries);
            return; // Don't resolve during retry
          }
        }

        const resolvedRole = VALID_ROLES.includes(data as AppRole)
          ? (data as AppRole)
          : "user";
        setRole(resolvedRole);
        setCheckedUserId(user.id);
        setLoading(false);
      } catch (error) {
        if (cancelled) return;
        console.error("Error checking user role:", error);
        if (retries < 3) {
          retries++;
          setTimeout(checkUserRole, 800 * retries);
          return; // Don't resolve during retry
        }
        setRole("user");
        setCheckedUserId(user.id);
        setLoading(false);
      }
    };

    checkUserRole();
    return () => { cancelled = true; };
  }, [user]);

  return {
    role,
    loading: effectiveLoading,
    isAdmin: role === "admin" || role === "super_admin",
    isSuperAdmin: role === "super_admin",
    isPriest: role === "priest",
  };
};
