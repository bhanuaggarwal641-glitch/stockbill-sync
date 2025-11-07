import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Search, Pencil, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Products = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gstFilter, setGstFilter] = useState<"all" | "gst" | "non-gst">("all");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Failed to load products");
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const filteredProducts = products.filter(product => {
    const search = searchQuery.toLowerCase();
    const matchesSearch = (
      product.name.toLowerCase().includes(search) ||
      product.sku.toLowerCase().includes(search) ||
      (product.barcode && product.barcode.toLowerCase().includes(search))
    );

    const matchesGST = 
      gstFilter === "all" ? true :
      gstFilter === "gst" ? product.gst_applicability === "GST" :
      product.gst_applicability === "Non-GST";

    return matchesSearch && matchesGST;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">Products</h1>
                <p className="text-sm text-muted-foreground">Manage your inventory</p>
              </div>
            </div>
            <Button onClick={() => navigate("/products/new")}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Product Catalog</CardTitle>
                <CardDescription>Browse and manage all products</CardDescription>
              </div>
              <div className="flex gap-4">
                <Select value={gstFilter} onValueChange={(value: any) => setGstFilter(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="gst">GST Products</SelectItem>
                    <SelectItem value="non-gst">Non-GST Products</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No products found</p>
                <p className="text-sm mt-1">
                  {searchQuery ? "Try a different search term" : "Add your first product to get started"}
                </p>
                {!searchQuery && (
                  <Button className="mt-4" onClick={() => navigate("/products/new")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>GST</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.sku}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.description && (
                            <p className="text-xs text-muted-foreground">{product.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{product.category || "-"}</TableCell>
                      <TableCell>₹{product.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={product.quantity_in_stock <= (product.reorder_level || 0) ? "destructive" : "secondary"}>
                          {product.quantity_in_stock} {product.unit}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.gst_applicability === "GST" ? "default" : "outline"}>
                          {product.gst_applicability}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/products/${product.id}`)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Products;
