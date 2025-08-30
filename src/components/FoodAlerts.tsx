import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Bell, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type FoodAlert = Database['public']['Tables']['food_alerts']['Row'];
type FoodCategory = Database['public']['Enums']['food_category'];

const FOOD_TYPES = [
  'fruits',
  'vegetables', 
  'grains',
  'dairy',
  'meat',
  'prepared',
  'baked',
  'other'
] as const;

const FoodAlerts = () => {
  const [alerts, setAlerts] = useState<FoodAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newAlert, setNewAlert] = useState<{
    food_type: FoodCategory | '';
    location: string;
    radius_km: number;
  }>({
    food_type: '',
    location: '',
    radius_km: 10
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('food_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast({
        title: "Error",
        description: "Failed to load your alerts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAlert = async () => {
    if (!newAlert.food_type) {
      toast({
        title: "Error",
        description: "Please select a food type",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('food_alerts')
        .insert({
          user_id: user.id,
          food_type: newAlert.food_type,
          location: newAlert.location || null,
          radius_km: newAlert.radius_km
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Food alert created successfully",
      });

      setNewAlert({ food_type: '', location: '', radius_km: 10 });
      setShowForm(false);
      fetchAlerts();
    } catch (error) {
      console.error('Error creating alert:', error);
      toast({
        title: "Error",
        description: "Failed to create alert",
        variant: "destructive",
      });
    }
  };

  const toggleAlert = async (id: string, is_active: boolean) => {
    try {
      const { error } = await supabase
        .from('food_alerts')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;

      setAlerts(alerts.map(alert => 
        alert.id === id ? { ...alert, is_active } : alert
      ));

      toast({
        title: "Success",
        description: `Alert ${is_active ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error updating alert:', error);
      toast({
        title: "Error",
        description: "Failed to update alert",
        variant: "destructive",
      });
    }
  };

  const deleteAlert = async (id: string) => {
    try {
      const { error } = await supabase
        .from('food_alerts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAlerts(alerts.filter(alert => alert.id !== id));
      toast({
        title: "Success",
        description: "Alert deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast({
        title: "Error",
        description: "Failed to delete alert",
        variant: "destructive",
      });
    }
  };

  const formatFoodType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading your alerts...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Food Alerts
          </h1>
          <p className="text-muted-foreground mt-2">
            Get notified when specific food types become available in your area
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Alert
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Food Alert</CardTitle>
            <CardDescription>
              Set up notifications for specific food types you're interested in
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="food-type">Food Type</Label>
              <Select value={newAlert.food_type} onValueChange={(value) => 
                setNewAlert({ ...newAlert, food_type: value as FoodCategory })
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select food type" />
                </SelectTrigger>
                <SelectContent>
                  {FOOD_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatFoodType(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                placeholder="e.g., Downtown, Brooklyn, 10001"
                value={newAlert.location}
                onChange={(e) => setNewAlert({ ...newAlert, location: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="radius">Search Radius (km)</Label>
              <Input
                id="radius"
                type="number"
                min="1"
                max="100"
                value={newAlert.radius_km}
                onChange={(e) => setNewAlert({ ...newAlert, radius_km: parseInt(e.target.value) || 10 })}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={createAlert}>
                Create Alert
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {alerts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No alerts yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first food alert to get notified about donations
              </p>
              <Button onClick={() => setShowForm(true)}>
                Create Your First Alert
              </Button>
            </CardContent>
          </Card>
        ) : (
          alerts.map((alert) => (
            <Card key={alert.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {formatFoodType(alert.food_type)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {alert.location ? `${alert.location} (${alert.radius_km}km radius)` : `${alert.radius_km}km radius`}
                    </p>
                  </div>
                  <Badge variant={alert.is_active ? "default" : "secondary"}>
                    {alert.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={alert.is_active}
                    onCheckedChange={(checked) => toggleAlert(alert.id, checked)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteAlert(alert.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default FoodAlerts;