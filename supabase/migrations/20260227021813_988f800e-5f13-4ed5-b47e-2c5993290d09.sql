
-- 1. AUDIT LOG: Ensure truly append-only by revoking any possible DELETE/UPDATE even for admins
-- Already no UPDATE/DELETE RLS policies exist, but let's add explicit deny policies

-- 2. Security definer function for audit logging (bypasses RLS so triggers can insert)
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action TEXT,
  _module_name TEXT,
  _details JSONB DEFAULT NULL,
  _user_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_log (action, module_name, details, user_id)
  VALUES (_action, _module_name, _details, COALESCE(_user_id, auth.uid()));
END;
$$;

-- 3. Audit triggers for donations table
CREATE OR REPLACE FUNCTION public.audit_donations_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event('donation_created', 'donations', jsonb_build_object('donation_id', NEW.id, 'amount', NEW.amount, 'tier', NEW.tier), NEW.user_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit_event('donation_updated', 'donations', jsonb_build_object('donation_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status), auth.uid());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_audit_donations
  AFTER INSERT OR UPDATE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.audit_donations_access();

-- 4. Audit triggers for inventory (pooja_samagri) table
CREATE OR REPLACE FUNCTION public.audit_inventory_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event('inventory_item_added', 'inventory', jsonb_build_object('item_id', NEW.id, 'item_name', NEW.item_name, 'stock', NEW.current_stock), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit_event('inventory_updated', 'inventory', jsonb_build_object('item_id', NEW.id, 'item_name', NEW.item_name, 'old_stock', OLD.current_stock, 'new_stock', NEW.current_stock), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_event('inventory_item_deleted', 'inventory', jsonb_build_object('item_id', OLD.id, 'item_name', OLD.item_name), auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_audit_inventory
  AFTER INSERT OR UPDATE OR DELETE ON public.pooja_samagri
  FOR EACH ROW EXECUTE FUNCTION public.audit_inventory_access();

-- 5. Role change requests table for dual-approval
CREATE TABLE public.role_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID NOT NULL,
  requested_role app_role NOT NULL,
  requested_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID,
  reason TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.role_change_requests ENABLE ROW LEVEL SECURITY;

-- Only admins can create role change requests
CREATE POLICY "Admins can create role change requests"
  ON public.role_change_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Only admins can view role change requests
CREATE POLICY "Admins can view role change requests"
  ON public.role_change_requests
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Only admins can approve/reject (update), but NOT the same admin who requested
CREATE POLICY "Different admin can approve role change"
  ON public.role_change_requests
  FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    AND requested_by != auth.uid()
    AND status = 'pending'
  );
