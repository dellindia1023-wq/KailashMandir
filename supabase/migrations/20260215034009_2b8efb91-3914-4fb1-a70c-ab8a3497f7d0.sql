
-- Create inventory/samagri table for pooja materials
CREATE TABLE public.pooja_samagri (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  unit TEXT NOT NULL DEFAULT 'pcs',
  current_stock NUMERIC NOT NULL DEFAULT 0,
  min_stock_level NUMERIC NOT NULL DEFAULT 5,
  price_per_unit NUMERIC NOT NULL DEFAULT 0,
  supplier TEXT,
  last_restocked_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pooja_samagri ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins can manage inventory"
ON public.pooja_samagri
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Priests can view inventory
CREATE POLICY "Priests can view inventory"
ON public.pooja_samagri
FOR SELECT
USING (has_role(auth.uid(), 'priest'::app_role));

-- Timestamp trigger
CREATE TRIGGER update_pooja_samagri_updated_at
BEFORE UPDATE ON public.pooja_samagri
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
