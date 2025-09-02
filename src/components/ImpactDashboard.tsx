import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Utensils, Users, Building2, Leaf, TrendingUp, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

interface ImpactMetrics {
  totalDonations: number;
  totalClaims: number;
  totalUsers: number;
  totalOrganizations: number;
  recentActivity: any[];
  foodTypeDistribution: any[];
  monthlyTrends: any[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

const ImpactDashboard = () => {
  const [metrics, setMetrics] = useState<ImpactMetrics>({
    totalDonations: 0,
    totalClaims: 0,
    totalUsers: 0,
    totalOrganizations: 0,
    recentActivity: [],
    foodTypeDistribution: [],
    monthlyTrends: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImpactMetrics();
  }, []);

  const fetchImpactMetrics = async () => {
    try {
      // Fetch basic statistics
      const [donationsResult, claimsResult, usersResult, orgsResult] = await Promise.all([
        supabase.from('food_donations').select('*'),
        supabase.from('donation_claims').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('profiles').select('organization_name').not('organization_name', 'is', null)
      ]);

      // Fetch food type distribution
      const { data: foodTypes } = await supabase
        .from('food_donations')
        .select('food_type')
        .eq('status', 'claimed');

      const foodTypeDistribution = foodTypes?.reduce((acc: any, item) => {
        const existing = acc.find((x: any) => x.name === item.food_type);
        if (existing) {
          existing.value += 1;
        } else {
          acc.push({ name: item.food_type, value: 1 });
        }
        return acc;
      }, []) || [];

      // Fetch monthly trends (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const { data: monthlyData } = await supabase
        .from('food_donations')
        .select('created_at')
        .gte('created_at', sixMonthsAgo.toISOString());

      const monthlyTrends = monthlyData?.reduce((acc: any, item) => {
        const month = new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const existing = acc.find((x: any) => x.month === month);
        if (existing) {
          existing.donations += 1;
        } else {
          acc.push({ month, donations: 1 });
        }
        return acc;
      }, []) || [];

      // Fetch recent activity
      const { data: recentActivity } = await supabase
        .from('food_donations')
        .select('title, created_at, status')
        .order('created_at', { ascending: false })
        .limit(5);

      setMetrics({
        totalDonations: donationsResult.data?.length || 0,
        totalClaims: claimsResult.data?.filter(claim => claim.status === 'approved').length || 0,
        totalUsers: usersResult.data?.length || 0,
        totalOrganizations: new Set(orgsResult.data?.map(org => org.organization_name)).size || 0,
        recentActivity: recentActivity || [],
        foodTypeDistribution,
        monthlyTrends: monthlyTrends.slice(-6)
      });
    } catch (error) {
      console.error('Error fetching impact metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateEnvironmentalImpact = () => {
    // Rough estimates for environmental impact
    const mealsProvided = metrics.totalClaims;
    const co2Saved = Math.round(mealsProvided * 2.5); // kg CO2 per meal saved
    const waterSaved = Math.round(mealsProvided * 300); // liters per meal
    const wastePrevented = Math.round(mealsProvided * 0.8); // kg of food waste prevented
    
    return { mealsProvided, co2Saved, waterSaved, wastePrevented };
  };

  const environmentalImpact = calculateEnvironmentalImpact();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading impact data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">Community Impact Dashboard</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Track the positive impact our food sharing community is making on reducing waste and feeding those in need.
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="environmental">Environmental Impact</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
                <Utensils className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalDonations}</div>
                <p className="text-xs text-muted-foreground">Food items shared</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">People Helped</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalClaims}</div>
                <p className="text-xs text-muted-foreground">Successful claims</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalUsers}</div>
                <p className="text-xs text-muted-foreground">Community members</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Organizations</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalOrganizations}</div>
                <p className="text-xs text-muted-foreground">Partner organizations</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest food donations in our community</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={activity.status === 'claimed' ? 'default' : 'secondary'}>
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="environmental" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Meals Provided</CardTitle>
                <Utensils className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{environmentalImpact.mealsProvided}</div>
                <p className="text-xs text-muted-foreground">Nutritious meals shared</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CO₂ Saved</CardTitle>
                <Leaf className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{environmentalImpact.co2Saved} kg</div>
                <p className="text-xs text-muted-foreground">Carbon footprint reduced</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Water Conserved</CardTitle>
                <Leaf className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{environmentalImpact.waterSaved} L</div>
                <p className="text-xs text-muted-foreground">Water resources saved</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Waste Prevented</CardTitle>
                <Leaf className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{environmentalImpact.wastePrevented} kg</div>
                <p className="text-xs text-muted-foreground">Food waste diverted</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Environmental Impact Summary</CardTitle>
              <CardDescription>
                Our community's contribution to sustainability and waste reduction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">🌱 Sustainability Achievements</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Prevented {environmentalImpact.wastePrevented} kg of food from going to landfills</li>
                    <li>• Reduced carbon emissions by {environmentalImpact.co2Saved} kg CO₂</li>
                    <li>• Conserved {environmentalImpact.waterSaved} liters of water resources</li>
                    <li>• Provided {environmentalImpact.mealsProvided} nutritious meals to those in need</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Food Type Distribution</CardTitle>
                <CardDescription>Types of food most commonly shared</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metrics.foodTypeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {metrics.foodTypeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Donation Trends</CardTitle>
                <CardDescription>Donation activity over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="donations" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Growth Metrics
              </CardTitle>
              <CardDescription>Platform growth and engagement statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {Math.round((metrics.totalClaims / metrics.totalDonations) * 100) || 0}%
                  </div>
                  <p className="text-sm text-muted-foreground">Claim Success Rate</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {Math.round(metrics.totalDonations / Math.max(metrics.totalUsers, 1))}
                  </div>
                  <p className="text-sm text-muted-foreground">Avg Donations per User</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {metrics.totalOrganizations}
                  </div>
                  <p className="text-sm text-muted-foreground">Partner Organizations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImpactDashboard;