import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface PurchaseItem {
  product_id: string;
  product_name: string;
  qty: number;
  unit_cost: number;
  line_total: number;
}

const NonGstPurchase = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState("");
  const [paymentMode, setPaymentMode] = useState<"Cash" | "Online" | "Credit">("Cash");

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("gst_applicability", "NON-GST");
    if (error) {
      toast.error("Failed to load products");
    } else {
      setProducts(data || []);
    }
  };

  const fetchSuppliers = async () => {
    const { data, error } = await supabase.from("suppliers").select("*");
    if (error) {
      toast.error("Failed to load suppliers");
    } else {
      setSuppliers(data || []);
    }
  };

  const addItem = () => {
    if (products.length === 0) {
      toast.error("No Non-GST products available");
      return;
    }
    
    const newItem: PurchaseItem = {
      product_id: products[0].id,
      product_name: products[0].name,
      qty: 1,
      unit_cost: products[0].cost_price || products[0].price,
      line_total: products[0].cost_price || products[0].price,
    };
    setItems([...items, newItem]);
  };

  const updateItem = (index: number, field: keyof PurchaseItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === "product_id") {
      const product = products.find((p) => p.id === value);
      if (product) {
        updated[index].product_name = product.name;
        updated[index].unit_cost = product.cost_price || product.price;
      }
    }
    
    if (field === "qty" || field === "unit_cost") {
      updated[index].line_total = updated[index].qty * updated[index].unit_cost;
    }
    
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.line_total, 0);
  };

  const handleSubmit = async () => {
    if (!selectedSupplier) {
      toast.error("Please select a supplier");
      return;
    }
    
    if (items.length === 0) {
      toast.error("Please add items to the purchase");
      return;
    }

    setLoading(true);

    try {
      const grandTotal = calculateTotal();
      const purchaseNumber = `NGP-${new Date().getFullYear()}-${Date.now()}`;

      const { data: purchase, error: purchaseError } = await supabase
        .from("purchase_invoices")
        .insert([
          {
            purchase_number: purchaseNumber,
            supplier_id: selectedSupplier,
            supplier_invoice_number: supplierInvoiceNumber,
            is_gst: false,
            sub_total: grandTotal,
            gst_total: 0,
            grand_total: grandTotal,
            payment_mode: paymentMode,
            payment_status: paymentMode === "Credit" ? "Pending" : "Paid",
            created_by_user_id: user?.id,
          },
        ])
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      const purchaseItems = items.map((item) => ({
        purchase_invoice_id: purchase.id,
        product_id: item.product_id,
        qty: item.qty,
        unit_cost: item.unit_cost,
        gst_rate: 0,
        line_total: item.line_total,
      }));

      const { error: itemsError } = await supabase.from("purchase_items").insert(purchaseItems);
      if (itemsError) throw itemsError;

      // Update stock
      for (const item of items) {
        const product = products.find((p) => p.id === item.product_id);
        if (product) {
          await supabase
            .from("products")
            .update({ quantity_in_stock: product.quantity_in_stock + item.qty })
            .eq("id", item.product_id);
        }
      }

      toast.success("Non-GST Purchase created successfully");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to create purchase");
    } finally {
      setLoading(false);
    }
  };

  const grandTotal = calculateTotal();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Non-GST Purchase</h1>
              <p className="text-sm text-muted-foreground">Create a new non-GST purchase invoice</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Purchase Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supplier *</Label>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Supplier Invoice Number</Label>
                <Input
                  value={supplierInvoiceNumber}
                  onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select value={paymentMode} onValueChange={(v: any) => setPaymentMode(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Online">Online</SelectItem>
                    <SelectItem value="Credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Items</h3>
                <Button onClick={addItem} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded">
                    <div className="col-span-5 space-y-1">
                      <Label className="text-xs">Product</Label>
                      <Select
                        value={item.product_id}
                        onValueChange={(v) => updateItem(index, "product_id", v)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Qty</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => updateItem(index, "qty", parseFloat(e.target.value) || 1)}
                        className="h-9"
                      />
                    </div>

                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Cost</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unit_cost}
                        onChange={(e) => updateItem(index, "unit_cost", parseFloat(e.target.value) || 0)}
                        className="h-9"
                      />
                    </div>

                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Total</Label>
                      <div className="text-sm font-medium h-9 flex items-center">
                        ₹{item.line_total.toFixed(2)}
                      </div>
                    </div>

                    <div className="col-span-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="h-9 w-9 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between font-bold text-lg">
                <span>Grand Total:</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Processing..." : "Save Purchase"}
              </Button>
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default NonGstPurchase;
