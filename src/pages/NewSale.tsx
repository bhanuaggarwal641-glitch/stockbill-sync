import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface CartItem {
  product_id: string;
  product_name: string;
  qty: number;
  unit_price: number;
  discount: number;
  gst_rate: number;
  gst_applicability: "GST" | "NON-GST";
  line_total: number;
}

const NewSale = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("walk-in");
  const [paymentMode, setPaymentMode] = useState<"Cash" | "Online" | "Credit">("Cash");
  const [amountPaid, setAmountPaid] = useState("");

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from("products").select("*");
    if (error) {
      toast.error("Failed to load products");
    } else {
      setProducts(data || []);
    }
  };

  const fetchCustomers = async () => {
    const { data, error } = await supabase.from("customers").select("*");
    if (error) {
      toast.error("Failed to load customers");
    } else {
      setCustomers(data || []);
    }
  };

  const addToCart = (product: any) => {
    const existing = cart.find((item) => item.product_id === product.id);

    if (existing) {
      updateCartItem(product.id, existing.qty + 1);
    } else {
      const newItem: CartItem = {
        product_id: product.id,
        product_name: product.name,
        qty: 1,
        unit_price: product.price,
        discount: 0,
        gst_rate: product.default_gst_rate || 0,
        gst_applicability: product.gst_applicability,
        line_total: product.price,
      };
      setCart([...cart, newItem]);
    }
  };

  const updateCartItem = (productId: string, qty: number) => {
    setCart(
      cart.map((item) =>
        item.product_id === productId
          ? { ...item, qty, line_total: qty * item.unit_price - item.discount }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product_id !== productId));
  };

  const calculateTotals = () => {
    const subTotal = cart.reduce((sum, item) => sum + item.line_total, 0);
    const gstTotal = cart.reduce((sum, item) => {
      const taxableAmount = item.line_total;
      return sum + (taxableAmount * item.gst_rate) / 100;
    }, 0);
    const grandTotal = subTotal + gstTotal;
    
    return { subTotal, gstTotal, grandTotal };
  };

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.error("Please add items to the cart");
      return;
    }

    setLoading(true);

    try {
      const { subTotal, gstTotal, grandTotal } = calculateTotals();
      const paidAmount = parseFloat(amountPaid) || 0;
      const balanceDue = grandTotal - paidAmount;

      // Generate invoice number
      const invoiceNumber = `SB-${new Date().getFullYear()}-${Date.now()}`;

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from("sales_invoices")
        .insert([
          {
            invoice_number: invoiceNumber,
            customer_id: selectedCustomer === "walk-in" ? null : selectedCustomer,
            sub_total: subTotal,
            gst_total: gstTotal,
            grand_total: grandTotal,
            payment_mode: paymentMode,
            amount_paid: paidAmount,
            balance_due: balanceDue,
            payment_status: balanceDue > 0 ? "Pending" : balanceDue < 0 ? "Partially Paid" : "Paid",
            created_by_user_id: user?.id,
          },
        ])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const items = cart.map((item) => ({
        sales_invoice_id: invoice.id,
        product_id: item.product_id,
        qty: item.qty,
        unit_price: item.unit_price,
        discount: item.discount,
        gst_rate: item.gst_rate,
        line_total: item.line_total,
      }));

      const { error: itemsError } = await supabase.from("sales_items").insert(items);
      if (itemsError) throw itemsError;

      // Update stock
      for (const item of cart) {
        const product = products.find((p) => p.id === item.product_id);
        if (product) {
          await supabase
            .from("products")
            .update({ quantity_in_stock: product.quantity_in_stock - item.qty })
            .eq("id", item.product_id);
        }
      }

      toast.success("Sale created successfully");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to create sale");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { subTotal, gstTotal, grandTotal } = calculateTotals();

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
              <h1 className="text-xl font-bold text-foreground">New Sale</h1>
              <p className="text-sm text-muted-foreground">Create a new sales invoice</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Search */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Products</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, SKU, or barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {/* Group products by category */}
                {Object.entries(
                  filteredProducts.reduce((acc: Record<string, any[]>, product: any) => {
                    const category = product.category || "Uncategorized";
                    if (!acc[category]) acc[category] = [];
                    acc[category].push(product);
                    return acc;
                  }, {} as Record<string, any[]>)
                ).map(([category, categoryProducts]: [string, any[]]) => (
                  <div key={category}>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {categoryProducts.map((product) => (
                        <Card
                          key={product.id}
                          className="cursor-pointer hover:bg-accent transition-colors"
                          onClick={() => addToCart(product)}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium">{product.name}</p>
                                <p className="text-sm text-muted-foreground">{product.sku}</p>
                                <p className="text-sm text-muted-foreground">Stock: {product.quantity_in_stock}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">₹{product.price}</p>
                                <p className="text-xs text-muted-foreground">{product.gst_applicability}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cart */}
          <Card>
            <CardHeader>
              <CardTitle>Cart</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Customer (Optional)</Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Walk-in Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.product_id} className="flex items-center gap-2 p-2 border rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.product_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => updateCartItem(item.product_id, parseInt(e.target.value) || 1)}
                          className="w-16 h-7 text-xs"
                        />
                        <span className="text-xs">× ₹{item.unit_price}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.product_id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>₹{subTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>GST:</span>
                  <span>₹{gstTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
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

              <div className="space-y-2">
                <Label>Amount Paid</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <Button className="w-full" onClick={handleSubmit} disabled={loading || cart.length === 0}>
                {loading ? "Processing..." : "Complete Sale"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default NewSale;
