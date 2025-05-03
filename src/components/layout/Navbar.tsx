
import React, { useContext, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { AuthContext } from "@/App";

const Navbar = () => {
  // Use the authentication context instead of local state
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Prevent going back to landing page on refresh when logged in
  useEffect(() => {
    if (isAuthenticated && location.pathname === '/') {
      navigate('/app');  // Navigate to home page instead of trace
    }
  }, [isAuthenticated, location.pathname, navigate]);

  return (
    <nav className="py-4 px-6 border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link to={isAuthenticated ? "/app" : "/"} className="font-bold text-xl text-traceMate">
            Trace<span className="text-foreground">Mate</span>
          </Link>
        </div>

        <div>
          {isAuthenticated ? (
            <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </Button>
          ) : (
            <Button variant="default" size="sm" asChild>
              <Link to="/auth">Log In</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
