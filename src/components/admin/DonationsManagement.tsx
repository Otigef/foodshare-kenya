import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Clock, MapPin, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Donation {
  id: string;
  title: string;
  description: string;
  food_type: string;
  quantity: string;
  pickup_location: string;
  expiry_time: string;
  status: string;
  contact_phone: string;
  created_at: string;
  profiles: {
    full_name: string;
    organization_name: string;
  };
}

const DonationsManagement = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const { data, error } = await supabase
        .from('food_donations')
        .select(`
          *,
          profiles(full_name, organization_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDonations(data || []);
    } catch (error) {
      console.error('Error fetching donations:', error);
      toast({
        title: "Error",
        description: "Failed to load donations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateDonationStatus = async (donationId: string, newStatus: 'available' | 'claimed' | 'completed' | 'expired') => {
    try {
      const { error } = await supabase
        .from('food_donations')
        .update({ status: newStatus })
        .eq('id', donationId);

      if (error) throw error;

      setDonations(donations.map(donation => 
        donation.id === donationId ? { ...donation, status: newStatus } : donation
      ));

      toast({
        title: "Success",
        description: "Donation status updated successfully",
      });
    } catch (error) {
      console.error('Error updating donation status:', error);
      toast({
        title: "Error",
        description: "Failed to update donation status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'available': return 'default';
      case 'claimed': return 'secondary';
      case 'completed': return 'outline';
      case 'expired': return 'destructive';
      default: return 'outline';
    }
  };

  const getFoodTypeBadgeVariant = (foodType: string) => {
    switch (foodType) {
      case 'fresh_produce': return 'default';
      case 'prepared_meals': return 'secondary';
      case 'baked_goods': return 'outline';
      case 'dairy': return 'destructive';
      case 'other': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Donations Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading donations...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Package className="h-5 w-5 mr-2" />
          Donations Management
        </CardTitle>
        <CardDescription>
          Monitor and manage all food donations on the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Donation</TableHead>
              <TableHead>Donor</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {donations.map((donation) => (
              <TableRow key={donation.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{donation.title}</span>
                    <span className="text-sm text-muted-foreground">
                      {donation.quantity}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{donation.profiles?.full_name}</span>
                    {donation.profiles?.organization_name && (
                      <span className="text-sm text-muted-foreground">
                        {donation.profiles.organization_name}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getFoodTypeBadgeVariant(donation.food_type)}>
                    {donation.food_type.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(donation.status)}>
                    {donation.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="flex items-center text-sm">
                    <MapPin className="h-3 w-3 mr-1" />
                    {donation.pickup_location}
                  </span>
                  {donation.contact_phone && (
                    <span className="flex items-center text-sm text-muted-foreground">
                      <Phone className="h-3 w-3 mr-1" />
                      {donation.contact_phone}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {donation.expiry_time && (
                    <span className="flex items-center text-sm">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(donation.expiry_time).toLocaleDateString()}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Select
                    value={donation.status}
                    onValueChange={(value) => updateDonationStatus(donation.id, value as 'available' | 'claimed' | 'completed' | 'expired')}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="claimed">Claimed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default DonationsManagement;