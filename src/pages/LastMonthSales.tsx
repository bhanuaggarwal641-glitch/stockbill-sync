import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const LastMonthSales = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchLastMonthSales();
  }, []);

  const fetchLastMonthSales = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      lastMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("sales_invoices")
        .select(`
          *,
          customers (name)
        `)
        .gte("invoice_date", lastMonth.toISOString())
        .lt("invoice_date", today.toISOString())
        .order("invoice_date", { ascending: false });

      if (error) throw error;
      
      setSales(data || []);
      const totalAmount = data?.reduce((sum, sale) => sum + Number(sale.grand_total), 0) || 0;
      setTotal(totalAmount);
    } catch (error: any) {
      toast.error("Failed to load last month's sales");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Sales Last Month</h1>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sales Last Month</p>
                <p className="text-3xl font-bold text-foreground">₹{total.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Number of Invoices</p>
                <p className="text-3xl font-bold text-foreground">{sales.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Last Month's Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : sales.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No sales last month</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Mode</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.invoice_number}</TableCell>
                      <TableCell>{new Date(sale.invoice_date).toLocaleDateString()}</TableCell>
                      <TableCell>{sale.customers?.name || "Walk-in Customer"}</TableCell>
                      <TableCell>₹{Number(sale.grand_total).toFixed(2)}</TableCell>
                      <TableCell>{sale.payment_mode}</TableCell>
                      <TableCell>
                        <Badge variant={sale.payment_status === "Paid" ? "default" : "destructive"}>
                          {sale.payment_status}
                        </Badge>
                      </TableCell>
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

export default LastMonthSales;
