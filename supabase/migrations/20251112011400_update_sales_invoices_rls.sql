-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.sales_invoices;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.sales_invoices;

-- Create new policies
CREATE POLICY "Enable read access for all users" 
ON public.sales_invoices 
FOR SELECT 
TO authenticated, anon 
USING (true);

CREATE POLICY "Enable insert for authenticated users" 
ON public.sales_invoices 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Enable update for users based on created_by" 
ON public.sales_invoices 
FOR UPDATE 
TO authenticated 
USING (created_by_user_id = auth.uid() OR has_role('admin'::app_role));

CREATE POLICY "Enable delete for admins" 
ON public.sales_invoices 
FOR DELETE 
TO authenticated 
USING (has_role('admin'::app_role));
