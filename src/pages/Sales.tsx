import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Search, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type SalesInvoice = {
  id: string;
  invoice_number: string;
  invoice_date: string;
  customer_id: string | null;
  grand_total: number;
  payment_mode: string;
  payment_status: string;
  customers: { name: string } | null;
};

type SalesItem = {
  id: string;
  sales_invoice_id: string;
  product_id: string;
  qty: number;
  unit_price: number;
  gst_rate: number;
  line_total: number;
  products: {
    name: string;
    gst_applicability: string;
  };
};

const Sales = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState<SalesInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [gstFilter, setGstFilter] = useState<"all" | "gst" | "non-gst">("all");

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from("sales_invoices")
        .select(`
          *,
          customers (name)
        `)
        .order("invoice_date", { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error: any) {
      toast.error("Failed to load sales");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesItems = async (invoiceId: string): Promise<SalesItem[]> => {
    const { data, error } = await supabase
      .from("sales_items")
      .select(`
        *,
        products (name, gst_applicability)
      `)
      .eq("sales_invoice_id", invoiceId);

    if (error) {
      console.error(error);
      return [];
    }
    return data || [];
  };

  const filterSalesByGST = async (sale: SalesInvoice): Promise<boolean> => {
    if (gstFilter === "all") return true;

    const items = await fetchSalesItems(sale.id);
    
    if (gstFilter === "gst") {
      return items.some(item => item.products.gst_applicability === "GST");
    } else {
      return items.some(item => item.products.gst_applicability === "Non-GST");
    }
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.customers?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const [displaySales, setDisplaySales] = useState<SalesInvoice[]>([]);

  useEffect(() => {
    const filterSales = async () => {
      if (gstFilter === "all") {
        setDisplaySales(filteredSales);
      } else {
        const filtered = [];
        for (const sale of filteredSales) {
          if (await filterSalesByGST(sale)) {
            filtered.push(sale);
          }
        }
        setDisplaySales(filtered);
      }
    };
    
    filterSales();
  }, [filteredSales, gstFilter]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Sales History</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Sales Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by invoice or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={gstFilter} onValueChange={(value: any) => setGstFilter(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sales</SelectItem>
                  <SelectItem value="gst">GST Sales Only</SelectItem>
                  <SelectItem value="non-gst">Non-GST Sales Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : displaySales.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No sales found</p>
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
                  {displaySales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.invoice_number}</TableCell>
                      <TableCell>{new Date(sale.invoice_date).toLocaleDateString()}</TableCell>
                      <TableCell>{sale.customers?.name || "Walk-in Customer"}</TableCell>
                      <TableCell>₹{sale.grand_total.toFixed(2)}</TableCell>
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

export default Sales;
