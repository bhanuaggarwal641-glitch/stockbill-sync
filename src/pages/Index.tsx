import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { BarChart3, Package, ShoppingCart, TrendingUp, Shield, Zap } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
              <BarChart3 className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">BizFlow CRM</span>
          </div>
          <Button onClick={() => navigate("/auth")}>Get Started</Button>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Professional CRM & Billing for Your Business
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Streamline your sales, manage inventory, and handle GST compliance with ease. 
              Built for small to medium businesses.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8">
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="text-lg px-8">
                Sign In
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-6 shadow-elegant hover:shadow-glow transition-all">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <ShoppingCart className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Point of Sale</h3>
              <p className="text-muted-foreground">
                Fast billing with barcode scanning, customizable invoices, and multiple payment modes.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-elegant hover:shadow-glow transition-all">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <Package className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Inventory Management</h3>
              <p className="text-muted-foreground">
                Track stock levels, get low stock alerts, and manage products with detailed specifications.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-elegant hover:shadow-glow transition-all">
              <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-warning" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">GST Compliance</h3>
              <p className="text-muted-foreground">
                Separate GST and Non-GST workflows with automatic tax calculations and reports.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-elegant hover:shadow-glow transition-all">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Credit Management</h3>
              <p className="text-muted-foreground">
                Track customer and supplier credit, manage payments, and send automated reminders.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-elegant hover:shadow-glow transition-all">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Reports & Analytics</h3>
              <p className="text-muted-foreground">
                Detailed sales, purchase, and stock reports with export capabilities.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-elegant hover:shadow-glow transition-all">
              <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-warning" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Multi-User Access</h3>
              <p className="text-muted-foreground">
                Role-based permissions for admin, billing, purchase, and inventory users.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-20">
          <div className="bg-gradient-primary rounded-2xl p-12 text-center shadow-glow">
            <h2 className="text-4xl font-bold text-primary-foreground mb-4">
              Ready to Transform Your Business?
            </h2>
            <p className="text-primary-foreground/90 text-lg mb-8 max-w-2xl mx-auto">
              Join businesses that trust BizFlow CRM for their daily operations
            </p>
            <Button size="lg" variant="secondary" onClick={() => navigate("/auth")} className="text-lg px-8">
              Get Started Now
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t bg-card/50">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>© 2025 BizFlow CRM. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
