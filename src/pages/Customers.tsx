import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Pencil, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BulkImport } from "@/components/BulkImport";

const Customers = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    gstin: "",
    address: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    // Fetch customers
    const { data: customersData, error: customersError } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (customersError) {
      toast.error("Failed to load customers");
      return;
    }

    // Fetch credit ledgers for each customer
    const { data: creditData, error: creditError } = await supabase
      .from("credit_ledgers")
      .select("party_id, balance_amount")
      .eq("party_type", "customer")
      .gt("balance_amount", 0);

    if (creditError) {
      console.error("Failed to load credit data:", creditError);
    }

    // Calculate total credit for each customer
    const customerCredits = creditData?.reduce((acc, credit) => {
      if (!acc[credit.party_id]) acc[credit.party_id] = 0;
      acc[credit.party_id] += parseFloat(credit.balance_amount as any);
      return acc;
    }, {} as Record<string, number>) || {};

    // Merge customers with their credit amounts
    const customersWithCredit = customersData?.map(customer => ({
      ...customer,
      creditAmount: customerCredits[customer.id] || 0
    })) || [];

    setCustomers(customersWithCredit);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingCustomer) {
        const { error } = await supabase
          .from("customers")
          .update(formData)
          .eq("id", editingCustomer.id);

        if (error) throw error;
        toast.success("Customer updated successfully");
      } else {
        const { error } = await supabase.from("customers").insert([formData]);
        if (error) throw error;
        toast.success("Customer created successfully");
      }

      setDialogOpen(false);
      resetForm();
      fetchCustomers();
    } catch (error: any) {
      toast.error(error.message || "Failed to save customer");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || "",
      email: customer.email || "",
      gstin: customer.gstin || "",
      address: customer.address || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;

    try {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
      toast.success("Customer deleted successfully");
      fetchCustomers();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete customer");
    }
  };

  const resetForm = () => {
    setEditingCustomer(null);
    setFormData({
      name: "",
      phone: "",
      email: "",
      gstin: "",
      address: "",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">Customers</h1>
                <p className="text-sm text-muted-foreground">Manage customer information</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Bulk Import
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Bulk Import Customers</DialogTitle>
                  </DialogHeader>
                  <BulkImport 
                    type="customers" 
                    onComplete={() => {
                      setShowBulkImport(false);
                      fetchCustomers();
                    }} 
                  />
                </DialogContent>
              </Dialog>
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Customer
                  </Button>
                </DialogTrigger>
                <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gstin">GSTIN</Label>
                    <Input
                      id="gstin"
                      value={formData.gstin}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" disabled={loading}>
                      {loading ? "Saving..." : editingCustomer ? "Update Customer" : "Add Customer"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Customer List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>GSTIN</TableHead>
                  <TableHead>Credit Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{customer.phone || "-"}</TableCell>
                    <TableCell>{customer.email || "-"}</TableCell>
                    <TableCell>{customer.gstin || "-"}</TableCell>
                    <TableCell>
                      <span className={customer.creditAmount > 0 ? "text-destructive font-medium" : ""}>
                        ₹{customer.creditAmount.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(customer)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(customer.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Customers;
