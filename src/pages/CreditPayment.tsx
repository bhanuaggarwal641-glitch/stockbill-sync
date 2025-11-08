import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CreditPayment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [creditLedgers, setCreditLedgers] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");

  useEffect(() => {
    fetchCustomers();
    fetchCreditLedgers();
  }, []);

  const fetchCustomers = async () => {
    const { data, error } = await supabase.from("customers").select("*");
    if (error) {
      toast.error("Failed to load customers");
    } else {
      setCustomers(data || []);
    }
  };

  const fetchCreditLedgers = async () => {
    const { data, error } = await supabase
      .from("credit_ledgers")
      .select("*, customers(name)")
      .eq("party_type", "customer")
      .gt("balance_amount", 0)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load credit ledgers");
    } else {
      setCreditLedgers(data || []);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      // Get all open credit ledgers for the customer
      const { data: ledgers, error: fetchError } = await supabase
        .from("credit_ledgers")
        .select("*")
        .eq("party_id", selectedCustomer)
        .eq("party_type", "customer")
        .gt("balance_amount", 0)
        .order("created_at", { ascending: true });

      if (fetchError) throw fetchError;

      let remainingAmount = amount;

      // Apply payment to each ledger in order
      for (const ledger of ledgers || []) {
        if (remainingAmount <= 0) break;

        const balanceAmount = parseFloat(ledger.balance_amount as any);
        const paymentForThisLedger = Math.min(remainingAmount, balanceAmount);
        const newBalance = balanceAmount - paymentForThisLedger;
        const newPaidAmount = parseFloat(ledger.paid_amount as any) + paymentForThisLedger;

        const { error: updateError } = await supabase
          .from("credit_ledgers")
          .update({
            paid_amount: newPaidAmount,
            balance_amount: newBalance,
            status: newBalance === 0 ? "Closed" : "Open",
          })
          .eq("id", ledger.id);

        if (updateError) throw updateError;

        remainingAmount -= paymentForThisLedger;
      }

      toast.success("Payment recorded successfully");
      setDialogOpen(false);
      setSelectedCustomer("");
      setPaymentAmount("");
      fetchCreditLedgers();
    } catch (error: any) {
      toast.error(error.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
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
                <h1 className="text-xl font-bold text-foreground">Credit Payment</h1>
                <p className="text-sm text-muted-foreground">Record customer payments</p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Payment</DialogTitle>
                </DialogHeader>
                <form onSubmit={handlePayment} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer">Customer *</Label>
                    <Select value={selectedCustomer} onValueChange={setSelectedCustomer} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Payment Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      required
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" disabled={loading}>
                      {loading ? "Recording..." : "Record Payment"}
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
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Outstanding Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Invoice Type</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Paid Amount</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creditLedgers.map((ledger) => (
                  <TableRow key={ledger.id}>
                    <TableCell>{ledger.customers?.name || "N/A"}</TableCell>
                    <TableCell className="capitalize">{ledger.invoice_type}</TableCell>
                    <TableCell>₹{parseFloat(ledger.total_amount).toFixed(2)}</TableCell>
                    <TableCell>₹{parseFloat(ledger.paid_amount).toFixed(2)}</TableCell>
                    <TableCell className="text-destructive font-medium">
                      ₹{parseFloat(ledger.balance_amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {ledger.due_date ? new Date(ledger.due_date).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded ${
                          ledger.status === "Open" ? "bg-destructive/10 text-destructive" : "bg-muted"
                        }`}
                      >
                        {ledger.status}
                      </span>
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

export default CreditPayment;
