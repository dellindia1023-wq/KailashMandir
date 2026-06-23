CREATE TABLE public.saved_kundlis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  birth_name TEXT,
  birth_date DATE NOT NULL,
  birth_time TIME NOT NULL,
  birth_place TEXT NOT NULL,
  kundli_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_kundlis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved kundlis"
ON public.saved_kundlis
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved kundlis"
ON public.saved_kundlis
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved kundlis"
ON public.saved_kundlis
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved kundlis"
ON public.saved_kundlis
FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_saved_kundlis_user_id_created_at
ON public.saved_kundlis (user_id, created_at DESC);

CREATE TRIGGER update_saved_kundlis_updated_at
BEFORE UPDATE ON public.saved_kundlis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();