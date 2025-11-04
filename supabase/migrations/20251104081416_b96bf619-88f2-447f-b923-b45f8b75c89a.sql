-- Create sales_invoices table
CREATE TABLE public.sales_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers(id),
  invoice_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sub_total NUMERIC NOT NULL DEFAULT 0,
  gst_total NUMERIC NOT NULL DEFAULT 0,
  round_off NUMERIC NOT NULL DEFAULT 0,
  grand_total NUMERIC NOT NULL DEFAULT 0,
  payment_mode payment_mode NOT NULL DEFAULT 'Cash',
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  balance_due NUMERIC NOT NULL DEFAULT 0,
  payment_status payment_status NOT NULL DEFAULT 'Pending',
  created_by_user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sales_items table
CREATE TABLE public.sales_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_invoice_id UUID REFERENCES public.sales_invoices(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  qty NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  discount NUMERIC NOT NULL DEFAULT 0,
  gst_rate NUMERIC NOT NULL DEFAULT 0,
  is_tax_inclusive BOOLEAN NOT NULL DEFAULT false,
  line_total NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase_invoices table
CREATE TABLE public.purchase_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_number TEXT NOT NULL UNIQUE,
  supplier_id UUID REFERENCES public.suppliers(id) NOT NULL,
  purchase_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  supplier_invoice_number TEXT,
  is_gst BOOLEAN NOT NULL DEFAULT true,
  sub_total NUMERIC NOT NULL DEFAULT 0,
  gst_total NUMERIC NOT NULL DEFAULT 0,
  grand_total NUMERIC NOT NULL DEFAULT 0,
  payment_mode payment_mode NOT NULL DEFAULT 'Cash',
  payment_status payment_status NOT NULL DEFAULT 'Pending',
  created_by_user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase_items table
CREATE TABLE public.purchase_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_invoice_id UUID REFERENCES public.purchase_invoices(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  qty NUMERIC NOT NULL,
  unit_cost NUMERIC NOT NULL,
  gst_rate NUMERIC NOT NULL DEFAULT 0,
  line_total NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create credit_ledgers table
CREATE TABLE public.credit_ledgers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  party_type TEXT NOT NULL CHECK (party_type IN ('customer', 'supplier')),
  party_id UUID NOT NULL,
  invoice_id UUID NOT NULL,
  invoice_type TEXT NOT NULL CHECK (invoice_type IN ('sales', 'purchase')),
  total_amount NUMERIC NOT NULL,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  balance_amount NUMERIC NOT NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Settled', 'Partially Settled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activity_logs table
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_value_json JSONB,
  new_value_json JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sales_invoices
CREATE POLICY "Sales invoices viewable by authenticated users"
ON public.sales_invoices FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and billing users can manage sales invoices"
ON public.sales_invoices FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'billing_user'::app_role)
);

-- RLS Policies for sales_items
CREATE POLICY "Sales items viewable by authenticated users"
ON public.sales_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and billing users can manage sales items"
ON public.sales_items FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'billing_user'::app_role)
);

-- RLS Policies for purchase_invoices
CREATE POLICY "Purchase invoices viewable by authenticated users"
ON public.purchase_invoices FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and purchase users can manage purchase invoices"
ON public.purchase_invoices FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'purchase_user'::app_role)
);

-- RLS Policies for purchase_items
CREATE POLICY "Purchase items viewable by authenticated users"
ON public.purchase_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and purchase users can manage purchase items"
ON public.purchase_items FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'purchase_user'::app_role)
);

-- RLS Policies for credit_ledgers
CREATE POLICY "Credit ledgers viewable by authenticated users"
ON public.credit_ledgers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage all credit ledgers"
ON public.credit_ledgers FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Billing users can manage customer credits"
ON public.credit_ledgers FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'billing_user'::app_role) AND 
  party_type = 'customer'
);

CREATE POLICY "Purchase users can manage supplier credits"
ON public.credit_ledgers FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'purchase_user'::app_role) AND 
  party_type = 'supplier'
);

-- RLS Policies for activity_logs
CREATE POLICY "Activity logs viewable by admins"
ON public.activity_logs FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "All authenticated users can create activity logs"
ON public.activity_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_sales_invoices_updated_at
BEFORE UPDATE ON public.sales_invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_invoices_updated_at
BEFORE UPDATE ON public.purchase_invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_credit_ledgers_updated_at
BEFORE UPDATE ON public.credit_ledgers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();