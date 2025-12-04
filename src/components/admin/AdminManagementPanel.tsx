import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Shield, ShieldCheck, ShieldAlert, UserPlus, UserMinus, Crown, Users, History, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface ManagedUser {
  user_id: string;
  full_name: string;
  organization_name: string | null;
  phone: string | null;
  location: string | null;
  role: 'admin' | 'donor' | 'recipient' | 'superadmin';
  created_at: string;
}

interface AdminStats {
  admin_count: number;
  max_admins: number;
  is_superadmin: boolean;
}

interface AuditLogEntry {
  id: string;
  admin_id: string;
  target_user_id: string;
  old_role: string | null;
  new_role: string;
  created_at: string;
  admin_name?: string;
  target_name?: string;
}

export default function AdminManagementPanel() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const { toast } = useToast();
  const { isSuperadmin } = useAuth();

  useEffect(() => {
    if (isSuperadmin) {
      fetchData();
      fetchAuditLogs();
    }
  }, [isSuperadmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersResult, statsResult] = await Promise.all([
        supabase.rpc('get_all_users_for_admin_management'),
        supabase.rpc('get_admin_stats')
      ]);

      if (usersResult.error) throw usersResult.error;
      if (statsResult.error) throw statsResult.error;

      setUsers(usersResult.data || []);
      setAdminStats(statsResult.data as unknown as AdminStats);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const { data: logs, error } = await supabase
        .from('role_changes_audit')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get user names for the logs
      if (logs && logs.length > 0) {
        const userIds = [...new Set([
          ...logs.map(l => l.admin_id),
          ...logs.map(l => l.target_user_id)
        ])];

        const { data: profiles } = await supabase
          .rpc('get_all_users_for_admin_management');

        const profileMap = new Map(
          (profiles || []).map(p => [p.user_id, p.full_name])
        );

        const enrichedLogs = logs.map(log => ({
          ...log,
          admin_name: profileMap.get(log.admin_id) || 'Unknown',
          target_name: profileMap.get(log.target_user_id) || 'Unknown'
        }));

        setAuditLogs(enrichedLogs);
      } else {
        setAuditLogs([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch audit logs:', error);
    }
  };

  const handlePromoteToAdmin = async (userId: string, userName: string) => {
    if (!adminStats || adminStats.admin_count >= adminStats.max_admins) {
      toast({
        title: 'Limit Reached',
        description: 'Maximum 5 admins allowed. Please remove an admin first.',
        variant: 'destructive',
      });
      return;
    }

    setProcessingUser(userId);
    try {
      const { data, error } = await supabase.rpc('promote_to_admin', {
        target_user_id: userId
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${userName} has been promoted to admin`,
      });

      fetchData();
      fetchAuditLogs();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to promote user',
        variant: 'destructive',
      });
    } finally {
      setProcessingUser(null);
    }
  };

  const handleRemoveAdmin = async (userId: string, userName: string, newRole: 'donor' | 'recipient' = 'donor') => {
    setProcessingUser(userId);
    try {
      const { data, error } = await supabase.rpc('remove_admin', {
        target_user_id: userId,
        new_role: newRole
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${userName} has been demoted to ${newRole}`,
      });

      fetchData();
      fetchAuditLogs();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove admin',
        variant: 'destructive',
      });
    } finally {
      setProcessingUser(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'superadmin':
        return <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white"><Crown className="h-3 w-3 mr-1" />Superadmin</Badge>;
      case 'admin':
        return <Badge variant="default"><ShieldCheck className="h-3 w-3 mr-1" />Admin</Badge>;
      case 'recipient':
        return <Badge variant="secondary">Recipient</Badge>;
      default:
        return <Badge variant="outline">Donor</Badge>;
    }
  };

  if (!isSuperadmin) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Only superadmins can access this panel</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading admin management...</div>
        </CardContent>
      </Card>
    );
  }

  const admins = users.filter(u => u.role === 'admin');
  const nonAdmins = users.filter(u => u.role !== 'admin' && u.role !== 'superadmin');

  return (
    <div className="space-y-6">
      {/* Admin Stats Card */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Admin Management Panel
          </CardTitle>
          <CardDescription>
            Manage administrator privileges (Superadmin only)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{adminStats?.admin_count || 0}</span>
              <span className="text-muted-foreground">/ {adminStats?.max_admins || 5} Admins</span>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex-1">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${((adminStats?.admin_count || 0) / (adminStats?.max_admins || 5)) * 100}%` }}
                />
              </div>
            </div>
            {adminStats && adminStats.admin_count >= adminStats.max_admins && (
              <Badge variant="destructive">Limit Reached</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Admins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Current Admins ({admins.length})
          </CardTitle>
          <CardDescription>
            Active administrators with elevated privileges
          </CardDescription>
        </CardHeader>
        <CardContent>
          {admins.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No admins assigned yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Promoted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-muted-foreground">{user.location || 'No location'}</p>
                      </div>
                    </TableCell>
                    <TableCell>{user.organization_name || '-'}</TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell>{format(new Date(user.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <Select
                        onValueChange={(value) => handleRemoveAdmin(user.user_id, user.full_name, value as 'donor' | 'recipient')}
                        disabled={processingUser === user.user_id}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Demote to..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="donor">Donor</SelectItem>
                          <SelectItem value="recipient">Recipient</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* All Users (for promotion) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Available Users ({nonAdmins.length})
          </CardTitle>
          <CardDescription>
            Users eligible for admin promotion
          </CardDescription>
        </CardHeader>
        <CardContent>
          {nonAdmins.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No users available for promotion</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nonAdmins.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-muted-foreground">{user.location || 'No location'}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{user.organization_name || '-'}</TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell>{format(new Date(user.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handlePromoteToAdmin(user.user_id, user.full_name)}
                        disabled={processingUser === user.user_id || (adminStats?.admin_count || 0) >= (adminStats?.max_admins || 5)}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Make Admin
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Role Changes Audit Log
          </CardTitle>
          <CardDescription>
            History of all role changes with timestamps
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No role changes recorded yet</p>
          ) : (
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Changed By</TableHead>
                    <TableHead>Target User</TableHead>
                    <TableHead>Role Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{log.admin_name}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{log.target_name}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {log.old_role || 'none'}
                          </Badge>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <Badge variant="default" className="text-xs">
                            {log.new_role}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
