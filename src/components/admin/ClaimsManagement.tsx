import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardCheck, User, Package, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Claim {
  id: string;
  status: string;
  message: string;
  created_at: string;
  food_donations: {
    title: string;
    food_type: string;
    quantity: string;
  };
  profiles: {
    full_name: string;
    organization_name: string;
  };
}

const ClaimsManagement = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      const { data, error } = await supabase
        .from('donation_claims')
        .select(`
          *,
          food_donations(title, food_type, quantity),
          profiles(full_name, organization_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClaims(data || []);
    } catch (error) {
      console.error('Error fetching claims:', error);
      toast({
        title: "Error",
        description: "Failed to load claims",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateClaimStatus = async (claimId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('donation_claims')
        .update({ status: newStatus })
        .eq('id', claimId);

      if (error) throw error;

      setClaims(claims.map(claim => 
        claim.id === claimId ? { ...claim, status: newStatus } : claim
      ));

      toast({
        title: "Success",
        description: "Claim status updated successfully",
      });
    } catch (error) {
      console.error('Error updating claim status:', error);
      toast({
        title: "Error",
        description: "Failed to update claim status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'destructive';
      case 'approved': return 'default';
      case 'completed': return 'outline';
      case 'cancelled': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ClipboardCheck className="h-5 w-5 mr-2" />
            Claims Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading claims...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ClipboardCheck className="h-5 w-5 mr-2" />
          Claims Management
        </CardTitle>
        <CardDescription>
          Review and manage donation claims from recipients
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recipient</TableHead>
              <TableHead>Donation</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Claimed</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {claims.map((claim) => (
              <TableRow key={claim.id}>
                <TableCell>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    <div className="flex flex-col">
                      <span className="font-medium">{claim.profiles?.full_name}</span>
                      {claim.profiles?.organization_name && (
                        <span className="text-sm text-muted-foreground">
                          {claim.profiles.organization_name}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Package className="h-4 w-4 mr-2" />
                    <div className="flex flex-col">
                      <span className="font-medium">{claim.food_donations?.title}</span>
                      <span className="text-sm text-muted-foreground">
                        {claim.food_donations?.food_type?.replace('_', ' ')} • {claim.food_donations?.quantity}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(claim.status)}>
                    {claim.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {claim.message && (
                    <div className="flex items-start max-w-xs">
                      <MessageSquare className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm truncate">{claim.message}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(claim.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Select
                    value={claim.status}
                    onValueChange={(value) => updateClaimStatus(claim.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
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

export default ClaimsManagement;