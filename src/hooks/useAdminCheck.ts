import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useAdminCheck = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null);

  // Ensure loading stays true until the role for the CURRENT user is resolved
  const effectiveLoading = authLoading || (!!user && checkedUserId !== user.id);

  useEffect(() => {
    let cancelled = false;
    let retries = 0;

    if (!user) {
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setCheckedUserId(null);
      setLoading(false);
      return;
    }

    // Reset state for new user
    setLoading(true);
    setIsAdmin(false);
    setIsSuperAdmin(false);

    const checkAdminRole = async () => {
      try {
        const { data, error } = await supabase.rpc("get_user_role", {
          _user_id: user.id,
        });

        if (cancelled) return;

        if (error) {
          console.error("Error checking admin role:", error);
          if (retries < 3) {
            retries++;
            setTimeout(checkAdminRole, 800 * retries);
            return; // Don't set loading=false during retry
          }
          setIsAdmin(false);
          setIsSuperAdmin(false);
        } else {
          const role = data as string;
          setIsSuperAdmin(role === "super_admin");
          setIsAdmin(role === "admin" || role === "super_admin");
        }

        // Only mark as resolved after successful check or final failure
        setCheckedUserId(user.id);
        setLoading(false);
      } catch (error) {
        if (cancelled) return;
        console.error("Error checking admin role:", error);
        if (retries < 3) {
          retries++;
          setTimeout(checkAdminRole, 800 * retries);
          return; // Don't set loading=false during retry
        }
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setCheckedUserId(user.id);
        setLoading(false);
      }
    };

    checkAdminRole();
    return () => { cancelled = true; };
  }, [user]);

  return { isAdmin, isSuperAdmin, loading: effectiveLoading };
};
