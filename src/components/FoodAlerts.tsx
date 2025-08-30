import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Bell } from "lucide-react";

interface FoodAlert {
  id: string;
  food_type: string;
  location: string | null;
  radius_km: number;
  is_active: boolean;
  created_at: string;
}

const FOOD_TYPES = [
  'fruits',
  'vegetables', 
  'grains',
  'dairy',
  'meat',
  'prepared',
  'baked',
  'other'
];

const FoodAlerts = () => {
  const [alerts, setAlerts] = useState<FoodAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAlert, setNewAlert] = useState({
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load alerts: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createAlert = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create alerts",
          variant: "destructive",
        });
        return;
      }

      if (!newAlert.food_type) {
        toast({
          title: "Error",
          description: "Please select a food type",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('food_alerts')
        .insert({
          user_id: user.id,
          food_type: newAlert.food_type as any,
          location: newAlert.location || null,
          radius_km: newAlert.radius_km
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Alert created successfully!",
      });

      setNewAlert({ food_type: '', location: '', radius_km: 10 });
      setShowAddForm(false);
      fetchAlerts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create alert: " + error.message,
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
        description: `Alert ${is_active ? 'activated' : 'deactivated'}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update alert: " + error.message,
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete alert: " + error.message,
        variant: "destructive",
      });
    }
  };

  const formatFoodType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading your alerts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Food Alerts
          </h1>
          <p className="text-muted-foreground mt-2">
            Get notified when specific food types become available in your area
          </p>
        </div>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Alert
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Alert</CardTitle>
            <CardDescription>
              Set up an alert to be notified when your preferred food types are donated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="food_type">Food Type</Label>
                <Select value={newAlert.food_type} onValueChange={(value) => setNewAlert({...newAlert, food_type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select food type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FOOD_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {formatFoodType(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location (Optional)</Label>
                <Input
                  id="location"
                  placeholder="e.g., Downtown, City Center"
                  value={newAlert.location}
                  onChange={(e) => setNewAlert({...newAlert, location: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="radius">Radius (km)</Label>
                <Input
                  id="radius"
                  type="number"
                  min="1"
                  max="100"
                  value={newAlert.radius_km}
                  onChange={(e) => setNewAlert({...newAlert, radius_km: parseInt(e.target.value) || 10})}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={createAlert}>Create Alert</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {alerts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No alerts set up</h3>
              <p className="text-muted-foreground mb-4">
                Create your first alert to get notified about food donations in your area
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Alert
              </Button>
            </CardContent>
          </Card>
        ) : (
          alerts.map((alert) => (
            <Card key={alert.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {formatFoodType(alert.food_type)}
                      </Badge>
                      {!alert.is_active && (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {alert.location ? (
                        <>Location: {alert.location} (within {alert.radius_km}km)</>
                      ) : (
                        <>Any location (within {alert.radius_km}km)</>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(alert.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={alert.is_active}
                        onCheckedChange={(checked) => toggleAlert(alert.id, checked)}
                      />
                      <Label className="text-sm">Active</Label>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteAlert(alert.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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