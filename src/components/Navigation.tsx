import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Heart, LogIn, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const Navigation = ({ currentView, onViewChange }: NavigationProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onViewChange('home');
  };

  const getNavItems = () => {
    const baseItems = [
      { id: 'home', label: 'Home' },
      { id: 'donate', label: 'Donate Food' },
      { id: 'browse', label: 'Find Food' },
      { id: 'alerts', label: 'Food Alerts' },
      { id: 'impact', label: 'Our Impact' }
    ];
    
    return baseItems;
  };
  
  const handleNavClick = (itemId: string) => {
    if (itemId === 'admin') {
      navigate('/admin');
    } else {
      onViewChange(itemId);
    }
  };

  const navItems = getNavItems();

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => onViewChange('home')}
          >
            <div className="p-2 bg-primary/10 rounded-full">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">FoodShare</h1>
              <p className="text-xs text-muted-foreground">Kenya</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={currentView === item.id ? "default" : "ghost"}
                onClick={() => handleNavClick(item.id)}
                className="font-medium"
              >
                {item.label}
              </Button>
            ))}
            {isAdmin && (
              <Button
                variant={currentView === 'admin' ? "default" : "ghost"}
                onClick={() => navigate('/admin')}
                className="font-medium"
              >
                Admin
              </Button>
            )}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <Button variant="ghost" onClick={handleSignOut} className="flex items-center space-x-2">
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => navigate('/auth')} className="flex items-center space-x-2">
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </Button>
                <Button variant="hero" onClick={() => navigate('/auth')}>Get Started</Button>
              </>
            )}
          </div>

          {/* Mobile Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col space-y-4 mt-8">
                <div className="pb-4 border-b border-border">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Heart className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h1 className="font-bold text-lg text-foreground">FoodShare Kenya</h1>
                      <p className="text-sm text-muted-foreground">Sharing food, sharing hope</p>
                    </div>
                  </div>
                </div>
                
                {navItems.map((item) => (
                  <Button
                    key={item.id}
                    variant={currentView === item.id ? "default" : "ghost"}
                    onClick={() => {
                      handleNavClick(item.id);
                      setIsOpen(false);
                    }}
                    className="justify-start font-medium"
                    size="lg"
                  >
                    {item.label}
                  </Button>
                ))}
                
                {isAdmin && (
                  <Button
                    variant={currentView === 'admin' ? "default" : "ghost"}
                    onClick={() => {
                      navigate('/admin');
                      setIsOpen(false);
                    }}
                    className="justify-start font-medium"
                    size="lg"
                  >
                    Admin
                  </Button>
                )}
                
                <div className="pt-4 space-y-3">
                  {user ? (
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center space-x-2"
                      onClick={() => {
                        handleSignOut();
                        setIsOpen(false);
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        className="w-full flex items-center space-x-2"
                        onClick={() => {
                          navigate('/auth');
                          setIsOpen(false);
                        }}
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Sign In</span>
                      </Button>
                      <Button 
                        variant="hero" 
                        className="w-full"
                        onClick={() => {
                          navigate('/auth');
                          setIsOpen(false);
                        }}
                      >
                        Get Started
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;