-- Create credit_ledgers table
CREATE TABLE public.credit_ledgers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL,
  invoice_type TEXT NOT NULL, -- 'sale' or 'purchase'
  party_id UUID NOT NULL, -- customer_id or supplier_id
  party_type TEXT NOT NULL, -- 'customer' or 'supplier'
  total_amount DECIMAL(10, 2) NOT NULL,
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  balance_amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL, -- 'Open' or 'Closed'
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_credit_ledgers_party ON public.credit_ledgers(party_id, party_type);
CREATE INDEX idx_credit_ledgers_status ON public.credit_ledgers(status);

-- Add RLS policies
ALTER TABLE public.credit_ledgers ENABLE ROW LEVEL SECURITY;

-- Admin can do anything
CREATE POLICY "Enable all for admin" 
ON public.credit_ledgers 
FOR ALL 
USING (auth.role() = 'authenticated' AND public.has_role(auth.uid(), 'admin'::app_role));

-- Billing users can manage customer credit
CREATE POLICY "Billing users can manage customer credit"
ON public.credit_ledgers 
FOR ALL 
USING (
  auth.role() = 'authenticated' AND 
  public.has_role(auth.uid(), 'billing_user'::app_role) AND
  party_type = 'customer'
);

-- Purchase users can manage supplier credit
CREATE POLICY "Purchase users can manage supplier credit"
ON public.credit_ledgers 
FOR ALL 
USING (
  auth.role() = 'authenticated' AND 
  public.has_role(auth.uid(), 'purchase_user'::app_role) AND
  party_type = 'supplier'
);