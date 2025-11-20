import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Activity, BarChart3, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import UserManagement from "./admin/UserManagement";
import DonationsManagement from "./admin/DonationsManagement";
import ClaimsManagement from "./admin/ClaimsManagement";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeDonations: 0,
    totalClaims: 0,
    pendingClaims: 0
  });
  const [adminName, setAdminName] = useState<string>('Admin');

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', user.id)
            .single();
          
          if (profile?.full_name) {
            setAdminName(profile.full_name);
          }
        }
      } catch (error) {
        console.error('Error fetching admin profile:', error);
      }
    };

    const fetchStats = async () => {
      try {
        // Fetch total users
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Fetch active donations
        const { count: donationCount } = await supabase
          .from('food_donations')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'available');

        // Fetch total claims
        const { count: totalClaimsCount } = await supabase
          .from('donation_claims')
          .select('*', { count: 'exact', head: true });

        // Fetch pending claims
        const { count: pendingClaimsCount } = await supabase
          .from('donation_claims')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        setStats({
          totalUsers: userCount || 0,
          activeDonations: donationCount || 0,
          totalClaims: totalClaimsCount || 0,
          pendingClaims: pendingClaimsCount || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchAdminProfile();
    fetchStats();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <Badge variant="secondary" className="mb-4">
            <Shield className="h-4 w-4 mr-2" />
            Admin Dashboard
          </Badge>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {getGreeting()}, {adminName}!
          </h1>
          <p className="text-lg text-muted-foreground">
            Here's what's happening with FoodShare Kenya today
          </p>
        </div>

        {/* Quick Stats Summary */}
        <Card className="mb-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Quick Overview
            </CardTitle>
            <CardDescription>Real-time platform metrics at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">{stats.totalUsers}</div>
                <div className="text-sm text-muted-foreground mt-1">Total Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">{stats.activeDonations}</div>
                <div className="text-sm text-muted-foreground mt-1">Active Donations</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">{stats.totalClaims}</div>
                <div className="text-sm text-muted-foreground mt-1">Total Claims</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  {stats.pendingClaims > 0 ? (
                    <AlertTriangle className="h-5 w-5 text-warning" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-success" />
                  )}
                  <div className="text-3xl font-bold text-foreground">{stats.pendingClaims}</div>
                </div>
                <div className="text-sm text-muted-foreground mt-1">Pending Claims</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Management Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="donations" className="flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Donations
            </TabsTrigger>
            <TabsTrigger value="claims" className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Claims
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="donations" className="mt-6">
            <DonationsManagement />
          </TabsContent>

          <TabsContent value="claims" className="mt-6">
            <ClaimsManagement />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Impact Analytics
                </CardTitle>
                <CardDescription>
                  Track community impact and platform metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Food Waste Reduced</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-primary">
                        {stats.activeDonations * 2.5}kg
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Estimated food saved from waste
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">People Fed</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-primary">
                        {stats.totalClaims * 3}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Estimated meals provided
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">CO₂ Saved</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-primary">
                        {Math.round(stats.activeDonations * 2.5 * 2.3)}kg
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Carbon footprint reduction
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;