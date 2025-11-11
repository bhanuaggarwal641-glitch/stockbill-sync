-- Temporarily allow all operations for authenticated users (for testing)
DROP POLICY IF EXISTS "Sales invoices viewable by authenticated users" ON public.sales_invoices;
DROP POLICY IF EXISTS "Admins and billing users can manage sales invoices" ON public.sales_invoices;

-- Create a single policy that allows all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" 
ON public.sales_invoices 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Add a comment to remind us to lock this down later
COMMENT ON POLICY "Allow all operations for authenticated users" ON public.sales_invoices IS 
'Temporary policy to allow all operations. Should be replaced with proper role-based access control.';
