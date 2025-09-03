import { useState } from "react";
import Hero from "@/components/Hero";
import UserRoleSelection from "@/components/UserRoleSelection";
import DonationForm from "@/components/DonationForm";
import BrowseDonations from "@/components/BrowseDonations";
import FoodAlerts from "@/components/FoodAlerts";
import AdminDashboard from "@/components/AdminDashboard";
import ImpactDashboard from "@/components/ImpactDashboard";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const [currentView, setCurrentView] = useState('home');
  const [userRole, setUserRole] = useState<'donor' | 'recipient' | 'admin' | null>(null);
  const { isAdmin, profile, loading } = useAuth();

  const handleRoleSelect = (role: 'donor' | 'recipient' | 'admin') => {
    setUserRole(role);
    if (role === 'donor') {
      setCurrentView('donate');
    } else if (role === 'recipient') {
      setCurrentView('browse');
    } else if (role === 'admin') {
      setCurrentView('admin');
    }
  };

  const renderContent = () => {
    // Show loading while checking authentication
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case 'home':
        return (
          <>
            <Hero onNavigate={setCurrentView} />
            <UserRoleSelection onRoleSelect={handleRoleSelect} />
          </>
        );
      case 'donate':
        return <DonationForm />;
      case 'browse':
        return <BrowseDonations onNavigateToAlerts={() => setCurrentView('alerts')} />;
      case 'alerts':
        return <FoodAlerts />;
      case 'admin':
        // Only allow admin users to access admin dashboard
        if (!isAdmin) {
          return (
            <div className="py-16 text-center">
              <h2 className="text-3xl font-bold text-foreground mb-4">Access Denied</h2>
              <p className="text-muted-foreground">You don't have permission to access this section.</p>
            </div>
          );
        }
        return <AdminDashboard />;
      case 'impact':
        return <ImpactDashboard />;
      default:
        return (
          <>
            <Hero onNavigate={setCurrentView} />
            <UserRoleSelection onRoleSelect={handleRoleSelect} />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
      <main>
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
