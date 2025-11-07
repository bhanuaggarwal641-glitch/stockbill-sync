import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  AlertCircle,
  LogOut,
  Plus,
  Receipt,
  UserPlus,
  Truck
} from "lucide-react";

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [todaySales, setTodaySales] = useState({ total: 0, count: 0 });
  const [lastMonthSales, setLastMonthSales] = useState(0);
  const [creditOutstanding, setCreditOutstanding] = useState({ total: 0, count: 0 });
  const [lowStock, setLowStock] = useState(0);
  const [recentSales, setRecentSales] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (user) {
      fetchDashboardData();
    }
  }, [user, loading, navigate]);

  const fetchDashboardData = async () => {
    // Today's sales
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: todayData } = await supabase
      .from("sales_invoices")
      .select("grand_total")
      .gte("invoice_date", today.toISOString());
    
    if (todayData) {
      const total = todayData.reduce((sum, inv) => sum + Number(inv.grand_total), 0);
      setTodaySales({ total, count: todayData.length });
    }

    // Last month sales
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    lastMonth.setHours(0, 0, 0, 0);
    
    const { data: lastMonthData } = await supabase
      .from("sales_invoices")
      .select("grand_total")
      .gte("invoice_date", lastMonth.toISOString())
      .lt("invoice_date", today.toISOString());
    
    if (lastMonthData) {
      const total = lastMonthData.reduce((sum, inv) => sum + Number(inv.grand_total), 0);
      setLastMonthSales(total);
    }

    // Credit outstanding
    const { data: creditData } = await supabase
      .from("sales_invoices")
      .select("balance_due, customer_id")
      .gt("balance_due", 0);
    
    if (creditData) {
      const total = creditData.reduce((sum, inv) => sum + Number(inv.balance_due), 0);
      const uniqueCustomers = new Set(creditData.map(inv => inv.customer_id)).size;
      setCreditOutstanding({ total, count: uniqueCustomers });
    }

    // Low stock items
    const { data: stockData } = await supabase
      .from("products")
      .select("quantity_in_stock, reorder_level")
      .not("reorder_level", "is", null);
    
    if (stockData) {
      const lowStockCount = stockData.filter(
        p => Number(p.quantity_in_stock) <= Number(p.reorder_level || 0)
      ).length;
      setLowStock(lowStockCount);
    }

    // Recent sales
    const { data: salesData } = await supabase
      .from("sales_invoices")
      .select(`
        *,
        customers (name)
      `)
      .order("invoice_date", { ascending: false })
      .limit(5);
    
    if (salesData) {
      setRecentSales(salesData);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
                <BarChart3 className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">BizFlow CRM</h1>
                <p className="text-sm text-muted-foreground">Billing & Inventory</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">{user?.user_metadata?.name || user?.email}</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          <Button 
            className="h-20 text-lg font-semibold bg-gradient-primary shadow-elegant hover:shadow-glow transition-all"
            onClick={() => navigate("/sales/new")}
          >
            <Receipt className="w-6 h-6 mr-2" />
            New Sale
          </Button>
          <Button 
            variant="outline"
            className="h-20 text-lg font-semibold border-2"
            onClick={() => navigate("/sales")}
          >
            <Receipt className="w-6 h-6 mr-2" />
            All Sales
          </Button>
          <Button 
            variant="outline"
            className="h-20 text-lg font-semibold border-2"
            onClick={() => navigate("/products")}
          >
            <Package className="w-6 h-6 mr-2" />
            Products
          </Button>
          <Button 
            variant="outline"
            className="h-20 text-lg font-semibold border-2"
            onClick={() => navigate("/purchases/gst")}
          >
            <Plus className="w-6 h-6 mr-2" />
            GST Purchase
          </Button>
          <Button 
            variant="outline"
            className="h-20 text-lg font-semibold border-2"
            onClick={() => navigate("/purchases/non-gst")}
          >
            <Plus className="w-6 h-6 mr-2" />
            Non-GST
          </Button>
          <Button 
            variant="outline"
            className="h-20 text-lg font-semibold border-2"
            onClick={() => navigate("/users")}
          >
            <Users className="w-6 h-6 mr-2" />
            Users
          </Button>
          <Button 
            variant="outline"
            className="h-20 text-lg font-semibold border-2"
            onClick={() => navigate("/customers")}
          >
            <UserPlus className="w-6 h-6 mr-2" />
            Customers
          </Button>
          <Button 
            variant="outline"
            className="h-20 text-lg font-semibold border-2"
            onClick={() => navigate("/suppliers")}
          >
            <Truck className="w-6 h-6 mr-2" />
            Suppliers
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today's Sales
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">₹{todaySales.total.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">{todaySales.count} invoices</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sales Last Month
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">₹{lastMonthSales.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Previous month</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Credit Outstanding
              </CardTitle>
              <Users className="w-4 h-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">₹{creditOutstanding.total.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">{creditOutstanding.count} customers</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Low Stock Items
              </CardTitle>
              <AlertCircle className="w-4 h-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{lowStock}</div>
              <p className="text-xs text-muted-foreground mt-1">items below reorder level</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Sales</CardTitle>
              <CardDescription>Latest billing transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentSales.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No sales yet</p>
                  <p className="text-sm mt-1">Start creating invoices to see them here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentSales.map((sale) => (
                    <div key={sale.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{sale.invoice_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {sale.customers?.name || "Walk-in Customer"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{Number(sale.grand_total).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(sale.invoice_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Purchases</CardTitle>
              <CardDescription>Latest stock purchases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No purchases yet</p>
                <p className="text-sm mt-1">Record purchases to track inventory</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
