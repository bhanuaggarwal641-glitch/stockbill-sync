import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type CreditCustomer = {
  customer_id: string;
  customer_name: string;
  total_credit: number;
  invoice_count: number;
};

const CreditOutstanding = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CreditCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCreditOutstanding();
  }, []);

  const fetchCreditOutstanding = async () => {
    try {
      const { data, error } = await supabase
        .from("sales_invoices")
        .select(`
          customer_id,
          balance_due,
          customers (name)
        `)
        .gt("balance_due", 0);

      if (error) throw error;

      // Group by customer
      const customerMap = new Map<string, CreditCustomer>();
      
      data?.forEach((invoice: any) => {
        const customerId = invoice.customer_id || "walk-in";
        const customerName = invoice.customers?.name || "Walk-in Customer";
        
        if (customerMap.has(customerId)) {
          const existing = customerMap.get(customerId)!;
          existing.total_credit += Number(invoice.balance_due);
          existing.invoice_count += 1;
        } else {
          customerMap.set(customerId, {
            customer_id: customerId,
            customer_name: customerName,
            total_credit: Number(invoice.balance_due),
            invoice_count: 1
          });
        }
      });

      setCustomers(Array.from(customerMap.values()));
    } catch (error: any) {
      toast.error("Failed to load credit data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const totalCredit = customers.reduce((sum, c) => sum + c.total_credit, 0);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Credit Outstanding</h1>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Credit Outstanding</p>
                <p className="text-3xl font-bold text-foreground">₹{totalCredit.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customers with Credit</p>
                <p className="text-3xl font-bold text-foreground">{customers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customers with Outstanding Credit</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No outstanding credits</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Outstanding Amount</TableHead>
                    <TableHead>Number of Invoices</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.customer_id}>
                      <TableCell className="font-medium">{customer.customer_name}</TableCell>
                      <TableCell className="text-warning font-semibold">
                        ₹{customer.total_credit.toFixed(2)}
                      </TableCell>
                      <TableCell>{customer.invoice_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreditOutstanding;
