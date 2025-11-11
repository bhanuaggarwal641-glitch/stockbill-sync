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
    try {
      // First, try to fetch with the join to customers
      let { data, error } = await supabase
        .from("credit_ledgers")
        .select(`
          *,
          customers!inner(name)
        `)
        .eq("party_type", "customer")
        .gt("balance_amount", 0)
        .order("created_at", { ascending: false });

      // If join fails, fetch without the join and get customer names separately
      if (error) {
        console.warn("Join with customers table failed, falling back to separate queries:", error);
        
        // Fetch credit ledgers without the join
        const { data: ledgers, error: ledgerError } = await supabase
          .from("credit_ledgers")
          .select("*")
          .eq("party_type", "customer")
          .gt("balance_amount", 0)
          .order("created_at", { ascending: false });

        if (ledgerError) throw ledgerError;

        // Get unique customer IDs
        const customerIds = [...new Set(ledgers.map(l => l.party_id).filter(Boolean))];
        let customersMap: Record<string, any> = {};

        // Fetch customer names in batches if there are many
        if (customerIds.length > 0) {
          const { data: customers, error: customerError } = await supabase
            .from("customers")
            .select("id, name")
            .in("id", customerIds);

          if (!customerError && customers) {
            customersMap = customers.reduce((acc, curr) => ({
              ...acc,
              [curr.id]: curr
            }), {});
          }
        }

        // Combine the data
        data = ledgers.map(ledger => ({
          ...ledger,
          customers: ledger.party_id ? (customersMap[ledger.party_id] || {}) : {}
        }));
      }

      setCreditLedgers(data || []);
    } catch (error: any) {
      console.error("Failed to load credit ledgers:", error);
      toast.error("Failed to load credit information");
      setCreditLedgers([]);
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

      if (!selectedCustomer) {
        toast.error("Please select a customer");
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

      if (!ledgers || ledgers.length === 0) {
        toast.error("No outstanding credits found for this customer");
        return;
      }

      const totalOutstanding = ledgers.reduce(
        (sum, ledger) => sum + parseFloat(ledger.balance_amount as any), 0
      );

      if (amount > totalOutstanding) {
        toast.error(`Payment amount (₹${amount.toFixed(2)}) exceeds total outstanding (₹${totalOutstanding.toFixed(2)})`);
        return;
      }

      // Create a payment record
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert([
          {
            party_id: selectedCustomer,
            party_type: "customer",
            amount: amount,
            payment_date: new Date().toISOString(),
            payment_mode: "Cash",
            reference_number: `PYM-${Date.now()}`,
            notes: "Credit payment"
          }
        ])
        .select()
        .single();

      if (paymentError) throw paymentError;

      let remainingAmount = amount;
      const paymentAllocations: any[] = [];

      // Apply payment to each ledger in order
      for (const ledger of ledgers) {
        if (remainingAmount <= 0) break;

        const balanceAmount = parseFloat(ledger.balance_amount as any);
        const paymentForThisLedger = Math.min(remainingAmount, balanceAmount);
        const newBalance = balanceAmount - paymentForThisLedger;
        const newPaidAmount = parseFloat(ledger.paid_amount as any) + paymentForThisLedger;

        // Update credit ledger
        const { error: updateError } = await supabase
          .from("credit_ledgers")
          .update({
            paid_amount: newPaidAmount,
            balance_amount: newBalance,
            status: newBalance === 0 ? "Closed" : "Open",
            updated_at: new Date().toISOString()
          })
          .eq("id", ledger.id);

        if (updateError) throw updateError;

        // Record payment allocation
        paymentAllocations.push({
          payment_id: payment.id,
          credit_ledger_id: ledger.id,
          amount: paymentForThisLedger,
          created_at: new Date().toISOString()
        });

        remainingAmount -= paymentForThisLedger;
      }

      // Save payment allocations
      if (paymentAllocations.length > 0) {
        const { error: allocationError } = await supabase
          .from("payment_allocations")
          .insert(paymentAllocations);

        if (allocationError) throw allocationError;
      }

      // If there's any remaining amount, create a credit note
      if (remainingAmount > 0) {
        const { error: creditNoteError } = await supabase
          .from("credit_notes")
          .insert([
            {
              party_id: selectedCustomer,
              party_type: "customer",
              amount: remainingAmount,
              reference_number: `CN-${Date.now()}`,
              notes: "Credit note from overpayment"
            }
          ]);

        if (creditNoteError) throw creditNoteError;
      }

      toast.success("Payment recorded successfully");
      setDialogOpen(false);
      setSelectedCustomer("");
      setPaymentAmount("");
      fetchCreditLedgers();
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Failed to record payment. Please try again.");
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
