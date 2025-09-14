import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, MapPin, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Database } from "@/integrations/supabase/types";
import { donationFormSchema, type DonationFormData } from "@/lib/validation";
import { showErrorToast, showSuccessToast, withErrorHandling } from "@/lib/errorHandling";

const DonationForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    foodType: Database['public']['Enums']['food_category'] | '';
    title: string;
    quantity: string;
    description: string;
    expiryTime: string;
    pickupLocation: string;
    contactPhone: string;
    specialInstructions: string;
  }>({
    foodType: '',
    title: '',
    quantity: '',
    description: '',
    expiryTime: '',
    pickupLocation: '',
    contactPhone: '',
    specialInstructions: ''
  });

  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/auth');
        return;
      }
      setUser(session.user);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        navigate('/auth');
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Validate form data using schema
    const validationResult = donationFormSchema.safeParse(formData);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: "Invalid Input",
        description: firstError.message,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    const result = await withErrorHandling(async () => {
      const { error } = await supabase
        .from('food_donations')
        .insert({
          donor_id: user.id,
          food_type: validationResult.data.foodType as Database['public']['Enums']['food_category'],
          title: validationResult.data.title,
          description: validationResult.data.description,
          quantity: validationResult.data.quantity,
          expiry_time: validationResult.data.expiryTime || null,
          pickup_location: validationResult.data.pickupLocation,
          contact_phone: validationResult.data.contactPhone,
          special_instructions: validationResult.data.specialInstructions,
          status: 'available' as Database['public']['Enums']['donation_status']
        });

      if (error) throw error;

      showSuccessToast(
        "Donation Posted Successfully! 🎉",
        "Your food donation is now available for pickup. Recipients will be notified."
      );

      // Reset form
      setFormData({
        foodType: '',
        title: '',
        quantity: '',
        description: '',
        expiryTime: '',
        pickupLocation: '',
        contactPhone: '',
        specialInstructions: ''
      });

      return true;
    }, 'posting donation');

    setLoading(false);
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
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-foreground font-medium">
                Food Title *
              </Label>
              <Input
                id="title"
                placeholder="e.g., Fresh Vegetables, Cooked Rice"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            {/* Food Type */}
            <div className="space-y-2">
              <Label htmlFor="foodType" className="text-foreground font-medium">
                Food Type *
              </Label>
              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, foodType: value as Database['public']['Enums']['food_category'] }))}>
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
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              <Package className="w-5 h-5 mr-2" />
              {loading ? "Posting Donation..." : "Post Food Donation"}
            </Button>
          </form>
        </Card>
      </div>
    </section>
  );
};

export default DonationForm;