import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex items-center justify-between py-4">
          <a href="/" className="inline-flex items-center gap-2" aria-label="PointPulse home">
            <span className="text-xl sm:text-2xl font-bold text-gradient-brand">PointPulse</span>
          </a>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <div className="text-8xl font-bold text-primary mb-4">404</div>
            <div className="text-6xl mb-4">🤔</div>
          </div>
          
          <h1 className="text-3xl font-bold text-primary mb-4">Page Not Found</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
          </p>
          
          <div className="space-y-4">
            <Button asChild size="lg" className="w-full">
              <a href="/">
                <Home className="h-5 w-5 mr-2" />
                Return to Home
              </a>
            </Button>
            
            <div className="text-sm text-muted-foreground">
              <p>Looking for something specific?</p>
              <div className="flex items-center justify-center gap-4 mt-2">
                <a href="/" className="flex items-center gap-1 hover:text-primary transition-colors">
                  <Search className="h-4 w-4" />
                  Browse Home
                </a>
                <a href="/leaderboard" className="flex items-center gap-1 hover:text-primary transition-colors">
                  <Search className="h-4 w-4" />
                  View Leaderboard
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-muted/30 border-t">
        <div className="container py-6 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 PointPulse — Built for students, by students.</p>
        </div>
      </footer>
    </div>
  );
};

export default NotFound;
