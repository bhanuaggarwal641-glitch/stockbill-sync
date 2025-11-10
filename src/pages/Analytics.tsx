import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, TrendingUp, Package, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const Analytics = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [timeRange, setTimeRange] = useState("30");
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [paymentModes, setPaymentModes] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalInvoices: 0,
    avgInvoiceValue: 0,
    topCategory: "",
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (user) {
      fetchAnalyticsData();
    }
  }, [user, loading, navigate, timeRange]);

  const fetchAnalyticsData = async () => {
    const daysAgo = parseInt(timeRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    try {
      // Fetch sales data
      const { data: salesData, error: salesError } = await supabase
        .from("sales_invoices")
        .select("*")
        .gte("invoice_date", startDate.toISOString());

      if (salesError) throw salesError;

      // Fetch sales items with product details
      const { data: itemsData, error: itemsError } = await supabase
        .from("sales_items")
        .select(`
          *,
          products (name, category),
          sales_invoices!inner (invoice_date)
        `)
        .gte("sales_invoices.invoice_date", startDate.toISOString());

      if (itemsError) throw itemsError;

      // Process revenue by day
      const revenueByDay: { [key: string]: number } = {};
      salesData?.forEach((sale) => {
        const date = new Date(sale.invoice_date).toLocaleDateString();
        revenueByDay[date] = (revenueByDay[date] || 0) + Number(sale.grand_total);
      });

      const revenueChartData = Object.entries(revenueByDay)
        .map(([date, revenue]) => ({
          date,
          revenue: Number(revenue.toFixed(2)),
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-14); // Last 14 days

      setRevenueData(revenueChartData);

      // Process top products
      const productSales: { [key: string]: { name: string; qty: number; revenue: number } } = {};
      itemsData?.forEach((item: any) => {
        const productName = item.products?.name || "Unknown";
        if (!productSales[productName]) {
          productSales[productName] = { name: productName, qty: 0, revenue: 0 };
        }
        productSales[productName].qty += Number(item.qty);
        productSales[productName].revenue += Number(item.line_total);
      });

      const topProductsData = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setTopProducts(topProductsData);

      // Process sales by category
      const categorySales: { [key: string]: number } = {};
      itemsData?.forEach((item: any) => {
        const category = item.products?.category || "Uncategorized";
        categorySales[category] = (categorySales[category] || 0) + Number(item.line_total);
      });

      const categoryChartData = Object.entries(categorySales).map(([category, revenue]) => ({
        category,
        revenue: Number(revenue.toFixed(2)),
      }));

      setCategoryData(categoryChartData);

      // Process payment modes
      const paymentModeCount: { [key: string]: number } = {};
      salesData?.forEach((sale) => {
        const mode = sale.payment_mode;
        paymentModeCount[mode] = (paymentModeCount[mode] || 0) + 1;
      });

      const paymentModeData = Object.entries(paymentModeCount).map(([mode, count]) => ({
        mode,
        count,
      }));

      setPaymentModes(paymentModeData);

      // Calculate stats
      const totalRevenue = salesData?.reduce((sum, sale) => sum + Number(sale.grand_total), 0) || 0;
      const totalInvoices = salesData?.length || 0;
      const avgInvoiceValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;
      const topCategory = categoryChartData.sort((a, b) => b.revenue - a.revenue)[0]?.category || "N/A";

      setStats({
        totalRevenue,
        totalInvoices,
        avgInvoiceValue,
        topCategory,
      });
    } catch (error: any) {
      toast.error("Failed to load analytics: " + error.message);
    }
  };

  const COLORS = ["hsl(221, 83%, 53%)", "hsl(142, 76%, 36%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)", "hsl(210, 40%, 96%)"];

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
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">Sales Analytics</h1>
                <p className="text-sm text-muted-foreground">Detailed insights and trends</p>
              </div>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <TrendingUp className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">₹{stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Last {timeRange} days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle>
              <CreditCard className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalInvoices}</div>
              <p className="text-xs text-muted-foreground mt-1">Invoices created</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Invoice Value</CardTitle>
              <TrendingUp className="w-4 h-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">₹{stats.avgInvoiceValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Per invoice</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Top Category</CardTitle>
              <Package className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.topCategory}</div>
              <p className="text-xs text-muted-foreground mt-1">Best performing</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Daily revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px"
                    }} 
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} name="Revenue (₹)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Payment Mode Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Mode Distribution</CardTitle>
              <CardDescription>Breakdown by payment method</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentModes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ mode, percent }) => `${mode}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {paymentModes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px"
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Products</CardTitle>
              <CardDescription>By revenue generated</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px"
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="hsl(var(--accent))" name="Revenue (₹)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Sales by Category</CardTitle>
              <CardDescription>Revenue breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px"
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue (₹)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Analytics;
