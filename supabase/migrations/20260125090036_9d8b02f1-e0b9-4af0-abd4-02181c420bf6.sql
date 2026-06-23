-- Create puja_bookings table to store booking information
CREATE TABLE public.puja_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  puja_id UUID NOT NULL REFERENCES public.pujas(id),
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  devotee_name TEXT NOT NULL,
  devotee_gotra TEXT,
  special_instructions TEXT,
  amount NUMERIC NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_id TEXT,
  razorpay_order_id TEXT,
  razorpay_signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.puja_bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own bookings" 
ON public.puja_bookings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings" 
ON public.puja_bookings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" 
ON public.puja_bookings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_puja_bookings_updated_at
BEFORE UPDATE ON public.puja_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();