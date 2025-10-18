import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <nav className="w-full bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              SkinAI
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost">
              Sign In
            </Button>
            <Button>
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
