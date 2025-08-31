import { useState } from "react";
import Hero from "@/components/Hero";
import UserRoleSelection from "@/components/UserRoleSelection";
import DonationForm from "@/components/DonationForm";
import BrowseDonations from "@/components/BrowseDonations";
import FoodAlerts from "@/components/FoodAlerts";
import AdminDashboard from "@/components/AdminDashboard";
import Navigation from "@/components/Navigation";

const Index = () => {
  const [currentView, setCurrentView] = useState('home');
  const [userRole, setUserRole] = useState<'donor' | 'recipient' | 'admin' | null>(null);

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
    switch (currentView) {
      case 'home':
        return (
          <>
            <Hero />
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
        return <AdminDashboard />;
      case 'impact':
        return (
          <div className="py-16 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">Impact Dashboard</h2>
            <p className="text-muted-foreground">Coming soon - Track the community impact of food sharing</p>
          </div>
        );
      default:
        return (
          <>
            <Hero />
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
