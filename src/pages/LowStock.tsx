import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const LowStock = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLowStock();
  }, []);

  const fetchLowStock = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .not("reorder_level", "is", null)
        .order("quantity_in_stock", { ascending: true });

      if (error) throw error;
      
      const lowStockProducts = data?.filter(
        p => Number(p.quantity_in_stock) <= Number(p.reorder_level || 0)
      ) || [];
      
      setProducts(lowStockProducts);
    } catch (error: any) {
      toast.error("Failed to load low stock items");
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
          <h1 className="text-3xl font-bold text-foreground">Low Stock Items</h1>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertCircle className="w-12 h-12 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Items Below Reorder Level</p>
                <p className="text-3xl font-bold text-foreground">{products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Products Requiring Restock</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>All products are adequately stocked</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Reorder Level</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const stock = Number(product.quantity_in_stock);
                    const reorder = Number(product.reorder_level);
                    const severity = stock === 0 ? "critical" : stock <= reorder / 2 ? "high" : "medium";
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.sku}</TableCell>
                        <TableCell className="font-semibold text-destructive">{stock}</TableCell>
                        <TableCell>{reorder}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={severity === "critical" ? "destructive" : "secondary"}
                          >
                            {severity === "critical" ? "Out of Stock" : severity === "high" ? "Very Low" : "Low Stock"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LowStock;
