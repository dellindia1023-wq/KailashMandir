import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-divine">
      <SEOHead
        title="Page Not Found"
        description="The page you are looking for does not exist on Kailash Mahadev Temple Agra website."
        noindex
      />
      <div className="absolute inset-0 temple-pattern opacity-20" />
      <div className="relative z-10 text-center px-4">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gold/20 flex items-center justify-center">
          <span className="text-5xl font-heading text-gold">ॐ</span>
        </div>
        <h1 className="mb-2 text-6xl font-heading font-bold text-primary-foreground">404</h1>
        <p className="mb-2 text-xl text-primary-foreground/90 font-heading">Page Not Found</p>
        <p className="mb-8 text-primary-foreground/70 max-w-md mx-auto">
          The path you seek does not exist. Let us guide you back to the temple.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/">
            <Button size="lg" className="bg-gold hover:bg-gold-light text-accent-foreground font-semibold px-8 glow-gold">
              <Home className="mr-2 h-5 w-5" />
              Return Home
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            className="border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;