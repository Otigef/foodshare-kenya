import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, MapPin, Package, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

interface BrowseDonationsProps {
  onNavigateToAlerts?: () => void;
}

type Donation = {
  id: string;
  donor_id: string;
  title: string;
  description: string | null;
  food_type: Database['public']['Enums']['food_category'];
  quantity: string;
  pickup_location: string;
  expiry_time: string | null;
  status: Database['public']['Enums']['donation_status'];
  special_instructions: string | null;
  created_at: string;
  updated_at: string;
  donor_profile?: {
    organization_name: string | null;
    role: string;
  };
};

const BrowseDonations = ({ onNavigateToAlerts }: BrowseDonationsProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDonations();
  }, []);

  useEffect(() => {
    handleFilter();
  }, [searchTerm, filterType, donations]);

  const fetchDonations = async () => {
    try {
      // Use the secure function to get public donations without contact info
      const { data: donationsData, error: donationsError } = await supabase
        .rpc('get_public_donations');

      if (donationsError) {
        toast({
          title: "Error Loading Donations",
          description: donationsError.message,
          variant: "destructive"
        });
        return;
      }

      // Check for existing claims for each donation
      const availableDonations = [];
      for (const donation of donationsData || []) {
        const { data: claims } = await supabase
          .from('donation_claims')
          .select('id')
          .eq('donation_id', donation.id);
        
        // Only include donations without any claims
        if (!claims || claims.length === 0) {
          availableDonations.push(donation);
        }
      }

      // Get donor profiles for available donations
      const donationsWithProfiles = await Promise.all(
        availableDonations.map(async (donation) => {
          const { data: profileData } = await supabase.rpc('get_public_profile_info', {
            profile_user_id: donation.donor_id
          });
          
          return {
            ...donation,
            donor_profile: profileData?.[0] || null
          };
        })
      );

      setDonations(donationsWithProfiles);
    } catch (error) {
      toast({
        title: "Unexpected Error",
        description: "Failed to load donations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (donationId: string, donorName: string) => {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to claim donations.",
          variant: "destructive"
        });
        window.location.href = '/auth';
        return;
      }

      // Check if user has made any claims in the last 12 hours
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
      const { data: recentClaims } = await supabase
        .from('donation_claims')
        .select('id, created_at')
        .eq('recipient_id', session.user.id)
        .gte('created_at', twelveHoursAgo);

      if (recentClaims && recentClaims.length > 0) {
        const lastClaimTime = new Date(recentClaims[0].created_at);
        const timeRemaining = 12 * 60 * 60 * 1000 - (Date.now() - lastClaimTime.getTime());
        const hoursRemaining = Math.ceil(timeRemaining / (60 * 60 * 1000));
        
        toast({
          title: "Claim Limit Reached",
          description: `You can only make one claim every 12 hours. Please wait ${hoursRemaining} more hour(s).`,
          variant: "destructive"
        });
        return;
      }

      // Check if user already has a claim for this donation
      const { data: existingClaim } = await supabase
        .from('donation_claims')
        .select('id')
        .eq('donation_id', donationId)
        .eq('recipient_id', session.user.id);

      if (existingClaim && existingClaim.length > 0) {
        toast({
          title: "Already Claimed",
          description: "You have already claimed this donation.",
          variant: "destructive"
        });
        return;
      }

      // Check if donation already has any claims
      const { data: allClaims } = await supabase
        .from('donation_claims')
        .select('id')
        .eq('donation_id', donationId);

      if (allClaims && allClaims.length > 0) {
        toast({
          title: "Already Claimed",
          description: "This donation has already been claimed by someone else.",
          variant: "destructive"
        });
        return;
      }

      // Create the claim
      const { error: claimError } = await supabase
        .from('donation_claims')
        .insert({
          donation_id: donationId,
          recipient_id: session.user.id,
          status: 'pending',
          message: 'I would like to claim this food donation.'
        });

      if (claimError) {
        throw claimError;
      }

      // Get recipient name for WhatsApp notification
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, organization_name')
        .eq('user_id', session.user.id)
        .single();

      const recipientName = profile?.organization_name || profile?.full_name || 'Anonymous Recipient';

      // Send email notification to donor
      const { error: notificationError } = await supabase.functions.invoke('notify-donor-email', {
        body: {
          donationId,
          recipientName,
          message: 'I would like to claim this food donation.'
        }
      });

      if (notificationError) {
        console.error('Email notification error:', notificationError);
        // Don't fail the claim if notification fails
      }

      toast({
        title: "Claim Request Sent! 📧",
        description: `Your request to claim food from ${donorName} has been sent. The donor will be notified via email.`,
        variant: "default"
      });

      // Refresh donations to reflect the change
      fetchDonations();

    } catch (error) {
      console.error('Error claiming donation:', error);
      toast({
        title: "Error",
        description: "Failed to claim donation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFilter = () => {
    let filtered = donations;
    
    if (searchTerm) {
      filtered = filtered.filter(donation => 
        donation.food_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donation.pickup_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        
        (donation.donor_profile?.organization_name && donation.donor_profile.organization_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (filterType !== "all") {
      filtered = filtered.filter(donation => 
        donation.food_type === filterType
      );
    }
    
    setFilteredDonations(filtered);
  };

  const formatExpiryTime = (expiryTime: string | null) => {
    if (!expiryTime) return "No expiry specified";
    
    const expiry = new Date(expiryTime);
    const now = new Date();
    const diffHours = Math.round((expiry.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 0) return "Expired";
    if (diffHours < 24) return `${diffHours} hours`;
    
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays} days`;
  };

  const formatTimePosted = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMinutes = Math.round((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays} days ago`;
  };

  const isUrgent = (expiryTime: string | null) => {
    if (!expiryTime) return false;
    
    const expiry = new Date(expiryTime);
    const now = new Date();
    const diffHours = Math.round((expiry.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    return diffHours <= 6; // Consider urgent if expires within 6 hours
  };

  if (loading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-muted-foreground">Loading donations...</p>
          </div>
        </div>
      </section>
    );
  }

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
                <SelectItem value="grains">Grains & Cereals</SelectItem>
                <SelectItem value="dairy">Dairy Products</SelectItem>
                <SelectItem value="meat">Meat & Poultry</SelectItem>
                <SelectItem value="prepared">Prepared Meals</SelectItem>
                <SelectItem value="baked">Baked Goods</SelectItem>
                <SelectItem value="other">Other</SelectItem>
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
                  <h3 className="font-semibold text-foreground">{donation.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {donation.donor_profile?.organization_name || "Anonymous Donor"}
                  </p>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  {isUrgent(donation.expiry_time) && (
                    <Badge variant="destructive" className="text-xs">Urgent</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{formatTimePosted(donation.created_at)}</span>
                </div>
              </div>

              {/* Food Type Badge */}
              <Badge variant="secondary" className="text-xs w-fit">
                {donation.food_type}
              </Badge>

              {/* Quantity */}
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground">{donation.quantity}</span>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground">
                {donation.description || "No description provided"}
              </p>

              {/* Location */}
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-secondary" />
                <span className="text-sm text-foreground">{donation.pickup_location}</span>
              </div>

              {/* Expiry Time */}
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-accent" />
                <span className="text-sm text-foreground">Best before: {formatExpiryTime(donation.expiry_time)}</span>
              </div>


              {/* Action Button */}
              <Button 
                variant={isUrgent(donation.expiry_time) ? "hero" : "default"} 
                className="w-full"
                onClick={() => handleClaim(donation.id, donation.donor_profile?.organization_name || "Anonymous Donor")}
              >
                Claim This Donation
              </Button>
            </Card>
          ))}
        </div>

        {filteredDonations.length === 0 && !loading && (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {donations.length === 0 ? "No donations available right now" : "No donations found matching your criteria"}
            </h3>
            <p className="text-muted-foreground">
              {donations.length === 0 
                ? "Check back later or encourage local businesses to start sharing!" 
                : "Try adjusting your search or filters."
              }
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
            <Button 
              variant="outline" 
              size="lg"
              onClick={onNavigateToAlerts}
            >
              Create Food Alert
            </Button>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default BrowseDonations;