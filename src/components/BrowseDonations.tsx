import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, MapPin, Phone, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data for donations
const mockDonations = [
  {
    id: 1,
    foodType: "Fresh Fruits",
    quantity: "15 kg mixed fruits",
    description: "Apples, bananas, oranges in good condition",
    location: "Westlands, Nairobi",
    donor: "Fresh Mart Supermarket",
    timePosted: "2 hours ago",
    expiryTime: "Tomorrow 6 PM",
    contact: "+254 712 345 678",
    urgent: false
  },
  {
    id: 2,
    foodType: "Prepared Meals",
    quantity: "30 portions",
    description: "Rice, beans, and vegetables ready to serve",
    location: "Karen, Nairobi",
    donor: "Golden Spoon Restaurant",
    timePosted: "4 hours ago",
    expiryTime: "Today 8 PM",
    contact: "+254 723 456 789",
    urgent: true
  },
  {
    id: 3,
    foodType: "Baked Goods",
    quantity: "50 pieces",
    description: "Fresh bread and pastries from morning batch",
    location: "Kilimani, Nairobi",
    donor: "City Bakery",
    timePosted: "1 hour ago",
    expiryTime: "Tomorrow 10 AM",
    contact: "+254 734 567 890",
    urgent: false
  },
  {
    id: 4,
    foodType: "Vegetables",
    quantity: "20 kg assorted vegetables",
    description: "Tomatoes, onions, carrots, spinach",
    location: "Kasarani, Nairobi",
    donor: "Green Valley Farm",
    timePosted: "30 minutes ago",
    expiryTime: "Tomorrow 12 PM",
    contact: "+254 745 678 901",
    urgent: false
  }
];

const BrowseDonations = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filteredDonations, setFilteredDonations] = useState(mockDonations);

  const handleClaim = (donationId: number, donorName: string) => {
    toast({
      title: "Claim Request Sent! 📱",
      description: `Your request to claim food from ${donorName} has been sent. They will contact you soon.`,
      variant: "default"
    });
  };

  const handleFilter = () => {
    let filtered = mockDonations;
    
    if (searchTerm) {
      filtered = filtered.filter(donation => 
        donation.foodType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donation.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donation.donor.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterType !== "all") {
      filtered = filtered.filter(donation => 
        donation.foodType.toLowerCase().includes(filterType.toLowerCase())
      );
    }
    
    setFilteredDonations(filtered);
  };

  // Apply filters when search term or filter type changes
  useEffect(() => {
    handleFilter();
  }, [searchTerm, filterType]);

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Available Food Donations
          </h2>
          <p className="text-muted-foreground">
            Browse and claim food donations near you. Help reduce waste while feeding your community.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Search by food type, location, or donor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Filter by food type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Food Types</SelectItem>
                <SelectItem value="fruits">Fresh Fruits</SelectItem>
                <SelectItem value="vegetables">Vegetables</SelectItem>
                <SelectItem value="prepared">Prepared Meals</SelectItem>
                <SelectItem value="baked">Baked Goods</SelectItem>
                <SelectItem value="dairy">Dairy Products</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Donations Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {filteredDonations.map((donation) => (
            <Card key={donation.id} className="p-6 space-y-4 shadow-card hover:shadow-glow transition-all duration-300">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">{donation.foodType}</h3>
                  <p className="text-sm text-muted-foreground">{donation.donor}</p>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  {donation.urgent && (
                    <Badge variant="destructive" className="text-xs">Urgent</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{donation.timePosted}</span>
                </div>
              </div>

              {/* Quantity */}
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground">{donation.quantity}</span>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground">{donation.description}</p>

              {/* Location */}
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-secondary" />
                <span className="text-sm text-foreground">{donation.location}</span>
              </div>

              {/* Expiry Time */}
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-accent" />
                <span className="text-sm text-foreground">Best before: {donation.expiryTime}</span>
              </div>

              {/* Contact */}
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{donation.contact}</span>
              </div>

              {/* Action Button */}
              <Button 
                variant={donation.urgent ? "hero" : "default"} 
                className="w-full"
                onClick={() => handleClaim(donation.id, donation.donor)}
              >
                Claim This Donation
              </Button>
            </Card>
          ))}
        </div>

        {filteredDonations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No donations found matching your criteria. Try adjusting your search or filters.
            </p>
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center mt-12">
          <Card className="p-8 max-w-md mx-auto shadow-soft">
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Don't see what you need?
            </h3>
            <p className="text-muted-foreground mb-6">
              Set up alerts for specific food types in your area.
            </p>
            <Button variant="outline" size="lg">
              Create Food Alert
            </Button>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default BrowseDonations;