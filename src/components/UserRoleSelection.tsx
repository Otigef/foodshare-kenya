import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Store, Heart, Shield } from "lucide-react";

interface UserRoleSelectionProps {
  onRoleSelect: (role: 'donor' | 'recipient' | 'admin') => void;
}

const UserRoleSelection = ({ onRoleSelect }: UserRoleSelectionProps) => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Join FoodShare Kenya
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose your role and become part of Kenya's food sharing revolution. 
            Together, we can end hunger and reduce waste.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Donor Card */}
          <Card className="p-8 text-center space-y-6 shadow-card hover:shadow-glow transition-all duration-300 group cursor-pointer">
            <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto group-hover:bg-primary/20 transition-colors">
              <Store className="w-12 h-12 text-primary" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-foreground">I'm a Donor</h3>
              <p className="text-muted-foreground">
                Restaurant, supermarket, or household with surplus food to share
              </p>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2 text-left">
              <li>• Post surplus food donations</li>
              <li>• Set pickup times and locations</li>
              <li>• Track your impact on the community</li>
              <li>• Connect directly with recipients</li>
            </ul>
            <Button 
              variant="hero" 
              size="lg" 
              className="w-full"
              onClick={() => onRoleSelect('donor')}
            >
              Start Donating Food
            </Button>
          </Card>

          {/* Recipient Card */}
          <Card className="p-8 text-center space-y-6 shadow-card hover:shadow-glow transition-all duration-300 group cursor-pointer">
            <div className="p-4 bg-secondary/10 rounded-full w-fit mx-auto group-hover:bg-secondary/20 transition-colors">
              <Heart className="w-12 h-12 text-secondary" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-foreground">I'm a Recipient</h3>
              <p className="text-muted-foreground">
                Charity, community organization, or family in need
              </p>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2 text-left">
              <li>• Browse available food near you</li>
              <li>• Request pickups that fit your needs</li>
              <li>• Get real-time notifications</li>
              <li>• Help your community access food</li>
            </ul>
            <Button 
              variant="secondary" 
              size="lg" 
              className="w-full"
              onClick={() => onRoleSelect('recipient')}
            >
              Find Food Nearby
            </Button>
          </Card>

          {/* Admin Card */}
          <Card className="p-8 text-center space-y-6 shadow-card hover:shadow-glow transition-all duration-300 group cursor-pointer">
            <div className="p-4 bg-accent/10 rounded-full w-fit mx-auto group-hover:bg-accent/20 transition-colors">
              <Shield className="w-12 h-12 text-accent" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-foreground">I'm an Admin</h3>
              <p className="text-muted-foreground">
                Platform manager overseeing food sharing operations
              </p>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2 text-left">
              <li>• Monitor platform activity</li>
              <li>• Manage user accounts</li>
              <li>• View impact analytics</li>
              <li>• Ensure safe food sharing</li>
            </ul>
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full"
              onClick={() => onRoleSelect('admin')}
            >
              Access Admin Panel
            </Button>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Already have an account? 
            <Button variant="link" className="px-2">Sign in here</Button>
          </p>
        </div>
      </div>
    </section>
  );
};

export default UserRoleSelection;