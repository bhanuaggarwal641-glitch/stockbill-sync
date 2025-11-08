import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(!!id);
  
  const [formData, setFormData] = useState({
    sku: "",
    barcode: "",
    name: "",
    description: "",
    category: "",
    size: "",
    thickness: "",
    unit: "pcs",
    price: "",
    cost_price: "",
    quantity_in_stock: "",
    reorder_level: "",
    gst_applicability: "GST" as "GST" | "NON-GST",
    default_gst_rate: "",
  });

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoadingProduct(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          sku: data.sku || "",
          barcode: data.barcode || "",
          name: data.name || "",
          description: data.description || "",
          category: data.category || "",
          size: data.size || "",
          thickness: data.thickness || "",
          unit: data.unit || "pcs",
          price: data.price?.toString() || "",
          cost_price: data.cost_price?.toString() || "",
          quantity_in_stock: data.quantity_in_stock?.toString() || "",
          reorder_level: data.reorder_level?.toString() || "",
          gst_applicability: data.gst_applicability || "GST",
          default_gst_rate: data.default_gst_rate?.toString() || "",
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load product");
      navigate("/products");
    } finally {
      setLoadingProduct(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        cost_price: parseFloat(formData.cost_price) || 0,
        quantity_in_stock: parseFloat(formData.quantity_in_stock) || 0,
        reorder_level: parseFloat(formData.reorder_level) || 0,
        default_gst_rate: parseFloat(formData.default_gst_rate) || 0,
      };

      let error;
      
      if (id) {
        ({ error } = await supabase.from("products").update(productData).eq("id", id));
        if (error) throw error;
        toast.success("Product updated successfully");
      } else {
        ({ error } = await supabase.from("products").insert([productData]));
        if (error) throw error;
        toast.success("Product created successfully");
      }
      navigate("/products");
    } catch (error: any) {
      toast.error(error.message || `Failed to ${id ? 'update' : 'create'} product`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading product...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/products")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {id ? "Edit Product" : "Add New Product"}
              </h1>
              <p className="text-sm text-muted-foreground">Enter product details</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit *</Label>
                  <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pcs">Pieces</SelectItem>
                      <SelectItem value="kg">Kilograms</SelectItem>
                      <SelectItem value="m">Meters</SelectItem>
                      <SelectItem value="l">Liters</SelectItem>
                      <SelectItem value="box">Box</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Size</Label>
                  <Input
                    id="size"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thickness">Thickness</Label>
                  <Input
                    id="thickness"
                    value={formData.thickness}
                    onChange={(e) => setFormData({ ...formData, thickness: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Selling Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost_price">Cost Price</Label>
                  <Input
                    id="cost_price"
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity_in_stock">Stock Quantity</Label>
                  <Input
                    id="quantity_in_stock"
                    type="number"
                    step="0.01"
                    value={formData.quantity_in_stock}
                    onChange={(e) => setFormData({ ...formData, quantity_in_stock: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reorder_level">Reorder Level</Label>
                  <Input
                    id="reorder_level"
                    type="number"
                    step="0.01"
                    value={formData.reorder_level}
                    onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gst_applicability">GST Applicability *</Label>
                  <Select
                    value={formData.gst_applicability}
                    onValueChange={(value: "GST" | "NON-GST") =>
                      setFormData({ ...formData, gst_applicability: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GST">GST</SelectItem>
                      <SelectItem value="NON-GST">Non-GST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default_gst_rate">Default GST Rate (%)</Label>
                  <Input
                    id="default_gst_rate"
                    type="number"
                    step="0.01"
                    value={formData.default_gst_rate}
                    onChange={(e) => setFormData({ ...formData, default_gst_rate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Product"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/products")}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ProductForm;
