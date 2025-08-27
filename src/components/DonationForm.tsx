import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, MapPin, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DonationForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    foodType: '',
    quantity: '',
    description: '',
    expiryTime: '',
    pickupLocation: '',
    contactPhone: '',
    specialInstructions: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!formData.foodType || !formData.quantity || !formData.pickupLocation) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Here you would typically send data to your backend
    toast({
      title: "Donation Posted Successfully! 🎉",
      description: "Your food donation is now available for pickup. Recipients will be notified.",
      variant: "default"
    });

    // Reset form
    setFormData({
      foodType: '',
      quantity: '',
      description: '',
      expiryTime: '',
      pickupLocation: '',
      contactPhone: '',
      specialInstructions: ''
    });
  };

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Share Your Surplus Food
          </h2>
          <p className="text-muted-foreground">
            Fill out the form below to make your food available to those who need it most.
          </p>
        </div>

        <Card className="p-8 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Food Type */}
            <div className="space-y-2">
              <Label htmlFor="foodType" className="text-foreground font-medium">
                Food Type *
              </Label>
              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, foodType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select food category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fruits">Fresh Fruits</SelectItem>
                  <SelectItem value="vegetables">Vegetables</SelectItem>
                  <SelectItem value="grains">Grains & Cereals</SelectItem>
                  <SelectItem value="dairy">Dairy Products</SelectItem>
                  <SelectItem value="meat">Meat & Poultry</SelectItem>
                  <SelectItem value="prepared">Prepared Meals</SelectItem>
                  <SelectItem value="baked">Baked Goods</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quantity and Description */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-foreground font-medium">
                  Quantity *
                </Label>
                <Input
                  id="quantity"
                  placeholder="e.g., 10 kg, 20 portions"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryTime" className="text-foreground font-medium">
                  Best Before
                </Label>
                <Input
                  id="expiryTime"
                  type="datetime-local"
                  value={formData.expiryTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiryTime: e.target.value }))}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the food items, condition, packaging..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            {/* Pickup Location */}
            <div className="space-y-2">
              <Label htmlFor="pickupLocation" className="text-foreground font-medium">
                <MapPin className="w-4 h-4 inline mr-2" />
                Pickup Location *
              </Label>
              <Input
                id="pickupLocation"
                placeholder="Enter address or landmark"
                value={formData.pickupLocation}
                onChange={(e) => setFormData(prev => ({ ...prev, pickupLocation: e.target.value }))}
              />
            </div>

            {/* Contact Information */}
            <div className="space-y-2">
              <Label htmlFor="contactPhone" className="text-foreground font-medium">
                Contact Phone
              </Label>
              <Input
                id="contactPhone"
                placeholder="+254 7XX XXX XXX"
                value={formData.contactPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
              />
            </div>

            {/* Special Instructions */}
            <div className="space-y-2">
              <Label htmlFor="specialInstructions" className="text-foreground font-medium">
                Special Instructions
              </Label>
              <Textarea
                id="specialInstructions"
                placeholder="Any special handling, pickup times, or other instructions..."
                rows={2}
                value={formData.specialInstructions}
                onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
              />
            </div>

            {/* Important Information */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-foreground flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Important Guidelines
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Ensure food is safe and hygienic</li>
                <li>• Food should be within expiry date</li>
                <li>• Be available for pickup coordination</li>
                <li>• Follow proper food handling practices</li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button type="submit" variant="hero" size="lg" className="w-full">
              <Package className="w-5 h-5 mr-2" />
              Post Food Donation
            </Button>
          </form>
        </Card>
      </div>
    </section>
  );
};

export default DonationForm;