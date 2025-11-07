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

type PurchaseInvoice = {
  id: string;
  purchase_number: string;
  purchase_date: string;
  supplier_id: string;
  grand_total: number;
  payment_mode: string;
  payment_status: string;
  is_gst: boolean;
  suppliers: { name: string } | null;
};

const Purchases = () => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [gstFilter, setGstFilter] = useState<"all" | "gst" | "non-gst">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from("purchase_invoices")
        .select(`
          *,
          suppliers (name)
        `)
        .order("purchase_date", { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (error: any) {
      toast.error("Failed to load purchases");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = 
      purchase.purchase_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.suppliers?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesGST = 
      gstFilter === "all" ? true :
      gstFilter === "gst" ? purchase.is_gst :
      !purchase.is_gst;
    
    const purchaseDate = new Date(purchase.purchase_date);
    const matchesStartDate = !startDate || purchaseDate >= new Date(startDate);
    const matchesEndDate = !endDate || purchaseDate <= new Date(endDate);
    
    return matchesSearch && matchesGST && matchesStartDate && matchesEndDate;
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Purchase History</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Purchase Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by invoice or supplier..."
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
                    <SelectItem value="all">All Purchases</SelectItem>
                    <SelectItem value="gst">GST Purchases Only</SelectItem>
                    <SelectItem value="non-gst">Non-GST Purchases Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    type="date"
                    placeholder="Start Date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type="date"
                    placeholder="End Date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : filteredPurchases.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No purchases found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Purchase #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Mode</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">{purchase.purchase_number}</TableCell>
                      <TableCell>{new Date(purchase.purchase_date).toLocaleDateString()}</TableCell>
                      <TableCell>{purchase.suppliers?.name || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant={purchase.is_gst ? "default" : "secondary"}>
                          {purchase.is_gst ? "GST" : "Non-GST"}
                        </Badge>
                      </TableCell>
                      <TableCell>₹{purchase.grand_total.toFixed(2)}</TableCell>
                      <TableCell>{purchase.payment_mode}</TableCell>
                      <TableCell>
                        <Badge variant={purchase.payment_status === "Paid" ? "default" : "destructive"}>
                          {purchase.payment_status}
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

export default Purchases;
