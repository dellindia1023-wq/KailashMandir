import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Check, Crown, Loader2, Search, ShieldCheck, ShieldAlert, UserCheck, Users, X, Clock, Shield, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";

interface UserProfile {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  role: string;
}

interface RoleChangeRequest {
  id: string;
  target_user_id: string;
  requested_role: string;
  requested_by: string;
  status: string;
  approved_by: string | null;
  reason: string | null;
  reviewed_at: string | null;
  created_at: string;
  target_name?: string;
  requester_name?: string;
}

const SUPER_ADMIN_EMAIL = "superadmin@kailash.com";

const AdminUsers = () => {
  const { user } = useAuth();
  const { isSuperAdmin } = useOutletContext<{ isSuperAdmin: boolean }>();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [roleRequests, setRoleRequests] = useState<RoleChangeRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  const [roleDialog, setRoleDialog] = useState<{ open: boolean; userId: string; newRole: string }>({
    open: false, userId: "", newRole: "",
  });
  const [roleReason, setRoleReason] = useState("");
  const [deleteUser, setDeleteUser] = useState<UserProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchRoleRequests();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone, created_at")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const roleMap = new Map<string, string>();
      roles?.forEach((r) => roleMap.set(r.user_id, r.role));

      const userList: UserProfile[] = (profiles || []).map((p) => ({
        user_id: p.user_id,
        full_name: p.full_name,
        phone: p.phone,
        created_at: p.created_at,
        role: roleMap.get(p.user_id) || "user",
      }));

      setUsers(userList);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoleRequests = async () => {
    setRequestsLoading(true);
    try {
      const { data, error } = await supabase
        .from("role_change_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const userIds = new Set<string>();
      data?.forEach((r) => {
        userIds.add(r.target_user_id);
        userIds.add(r.requested_by);
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", Array.from(userIds));

      const nameMap = new Map<string, string>();
      profiles?.forEach((p) => nameMap.set(p.user_id, p.full_name || "Unknown"));

      setRoleRequests(
        (data || []).map((r) => ({
          ...r,
          target_name: nameMap.get(r.target_user_id) || "Unknown",
          requester_name: nameMap.get(r.requested_by) || "Unknown",
        }))
      );
    } catch (error) {
      console.error("Error fetching role requests:", error);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const currentUser = users.find((u) => u.user_id === userId);
    const currentRole = currentUser?.role;
    if (currentRole === newRole) return;

    // BLOCK: Nobody can assign or modify super_admin via UI
    if (newRole === "super_admin") {
      toast.error("Super Admin role cannot be assigned through the UI.");
      return;
    }

    // BLOCK: Cannot change the super_admin's role
    if (currentRole === "super_admin") {
      toast.error("The Super Admin role is permanent and cannot be changed.");
      return;
    }

    // Regular admins cannot create other admins — must use request system
    if (!isSuperAdmin && (newRole === "admin" || currentRole === "admin")) {
      setRoleDialog({ open: true, userId, newRole });
      return;
    }

    // Super Admin can directly change roles (except super_admin restrictions above)
    if (isSuperAdmin) {
      await directRoleChange(userId, currentRole || "user", newRole);
      return;
    }

    // Non-admin role changes by regular admins
    await directRoleChange(userId, currentRole || "user", newRole);
  };

  const directRoleChange = async (userId: string, currentRole: string, newRole: string) => {
    setUpdatingRole(userId);
    try {
      if (newRole === "user") {
        if (currentRole !== "user") {
          const { error } = await supabase.from("user_roles").delete().eq("user_id", userId);
          if (error) throw error;
        }
      } else {
        if (currentRole === "user") {
          const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole as any });
          if (error) throw error;
        } else {
          const { error } = await supabase.from("user_roles").update({ role: newRole as any }).eq("user_id", userId);
          if (error) throw error;
        }
      }

      await supabase.from("audit_log").insert({
        action: "role_change",
        module_name: "user_management",
        details: { target_user_id: userId, old_role: currentRole, new_role: newRole, changed_by_super_admin: isSuperAdmin },
      });

      setUsers(users.map((u) => u.user_id === userId ? { ...u, role: newRole } : u));
      toast.success("Role updated successfully");
    } catch (error: any) {
      console.error("Error updating role:", error);
      if (error?.message?.includes("Super Admin")) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update role");
      }
    } finally {
      setUpdatingRole(null);
    }
  };

  const submitRoleRequest = async () => {
    if (!roleDialog.userId) return;
    try {
      const { error } = await supabase.from("role_change_requests").insert({
        target_user_id: roleDialog.userId,
        requested_role: roleDialog.newRole as any,
        requested_by: user?.id || "",
        reason: roleReason || null,
      });
      if (error) throw error;

      toast.success("Role change request submitted. Awaiting Super Admin approval.");
      setRoleDialog({ open: false, userId: "", newRole: "" });
      setRoleReason("");
      fetchRoleRequests();
    } catch (error) {
      console.error("Error submitting role request:", error);
      toast.error("Failed to submit role change request");
    }
  };

  const handleApproveRequest = async (request: RoleChangeRequest) => {
    // Only Super Admin can approve
    if (!isSuperAdmin) {
      toast.error("Only the Super Admin can approve role change requests.");
      return;
    }

    // Block approving super_admin role requests
    if (request.requested_role === "super_admin") {
      toast.error("Cannot approve Super Admin role assignment.");
      return;
    }

    setProcessingRequest(request.id);
    try {
      const { error: updateError } = await supabase
        .from("role_change_requests")
        .update({ status: "approved", approved_by: user?.id, reviewed_at: new Date().toISOString() })
        .eq("id", request.id);
      if (updateError) throw updateError;

      const currentRole = users.find((u) => u.user_id === request.target_user_id)?.role;
      if (request.requested_role === "user") {
        await supabase.from("user_roles").delete().eq("user_id", request.target_user_id);
      } else if (currentRole === "user") {
        await supabase.from("user_roles").insert({ user_id: request.target_user_id, role: request.requested_role as any });
      } else {
        await supabase.from("user_roles").update({ role: request.requested_role as any }).eq("user_id", request.target_user_id);
      }

      await supabase.from("audit_log").insert({
        action: "role_change_approved",
        module_name: "user_management",
        details: {
          request_id: request.id,
          target_user_id: request.target_user_id,
          new_role: request.requested_role,
          requested_by: request.requested_by,
          approved_by: user?.id,
        },
      });

      toast.success("Role change approved and applied");
      fetchUsers();
      fetchRoleRequests();
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Failed to approve request");
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!isSuperAdmin) {
      toast.error("Only the Super Admin can reject role change requests.");
      return;
    }
    setProcessingRequest(requestId);
    try {
      const { error } = await supabase
        .from("role_change_requests")
        .update({ status: "rejected", approved_by: user?.id, reviewed_at: new Date().toISOString() })
        .eq("id", requestId);
      if (error) throw error;

      toast.success("Role change request rejected");
      fetchRoleRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to reject request");
    } finally {
      setProcessingRequest(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.full_name?.toLowerCase().includes(q) ?? false) ||
      u.user_id.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const pendingRequests = roleRequests.filter((r) => r.status === "pending");

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Badge className="bg-gold/20 text-gold border-gold/30"><Crown className="h-3 w-3 mr-1" />Super Admin</Badge>;
      case "admin":
        return <Badge className="bg-primary/10 text-primary"><Shield className="h-3 w-3 mr-1" />Admin</Badge>;
      case "priest":
        return <Badge className="bg-secondary/10 text-secondary"><UserCheck className="h-3 w-3 mr-1" />Priest</Badge>;
      default:
        return <Badge variant="secondary"><Users className="h-3 w-3 mr-1" />User</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-primary border-primary/30"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge className="bg-accent/20 text-accent-foreground"><Check className="h-3 w-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Only Super Admin sees super_admin option (but it's blocked in handleRoleChange anyway)
  // Admins can only assign user/priest roles — admin requires request
  const roleSelectOptions = isSuperAdmin
    ? [
        { value: "user", label: "User" },
        { value: "priest", label: "Priest" },
        { value: "admin", label: "Admin" },
      ]
    : [
        { value: "user", label: "User" },
        { value: "priest", label: "Priest" },
        { value: "admin", label: "Admin (requires approval)" },
      ];

  // Check if user can modify this target user's role
  const canModifyRole = (targetUser: UserProfile) => {
    // Nobody can modify super_admin
    if (targetUser.role === "super_admin") return false;
    // Can't modify own role
    if (targetUser.user_id === user?.id) return false;
    // Regular admins cannot modify other admins
    if (!isSuperAdmin && targetUser.role === "admin") return false;
    return true;
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { target_user_id: deleteUser.user_id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(data?.message || "User deleted successfully");
      setDeleteUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error?.message || "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {isSuperAdmin && (
        <Card className="border-gold/30 bg-gold/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Crown className="h-5 w-5 text-gold" />
            <div>
              <p className="font-medium text-sm">Super Admin Mode</p>
              <p className="text-xs text-muted-foreground">
                You have full control. Role changes are applied directly. You can approve/reject all permission requests.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!isSuperAdmin && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-sm">Admin Mode</p>
              <p className="text-xs text-muted-foreground">
                You can manage users and priests. Admin role changes require Super Admin approval. You cannot create other admins directly.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">All Users</TabsTrigger>
          <TabsTrigger value="requests" className="gap-1.5">
            {isSuperAdmin ? "Permission Requests" : "My Requests"}
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="h-5 min-w-5 px-1 text-xs">{pendingRequests.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">User Management</CardTitle>
              <CardDescription>
                {isSuperAdmin
                  ? "Full control over all users and roles. Only you can create/remove admins."
                  : "View users and manage basic roles. Admin promotions require Super Admin approval."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by name or role..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Badge variant="outline">{filteredUsers.length} users</Badge>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Change Role</TableHead>
                        {isSuperAdmin && <TableHead className="text-right">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((u) => (
                        <TableRow key={u.user_id} className={u.role === "super_admin" ? "bg-gold/5" : ""}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {u.full_name || "—"}
                              {u.role === "super_admin" && <Crown className="h-3.5 w-3.5 text-gold" />}
                            </div>
                          </TableCell>
                          <TableCell>{u.phone || "—"}</TableCell>
                          <TableCell>{getRoleBadge(u.role)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{format(new Date(u.created_at), "dd MMM yyyy")}</TableCell>
                          <TableCell>
                            {!canModifyRole(u) ? (
                              <span className="text-xs text-muted-foreground">
                                {u.role === "super_admin" ? "Protected" : u.user_id === user?.id ? "Own account" : "No permission"}
                              </span>
                            ) : (
                              <Select
                                value={u.role}
                                onValueChange={(val) => handleRoleChange(u.user_id, val)}
                                disabled={updatingRole === u.user_id}
                              >
                                <SelectTrigger className="w-[150px]">
                                  {updatingRole === u.user_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <SelectValue />}
                                </SelectTrigger>
                                <SelectContent>
                                  {roleSelectOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          {isSuperAdmin && (
                            <TableCell className="text-right">
                              {u.role !== "super_admin" && u.user_id !== user?.id ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:bg-destructive/10"
                                  onClick={() => setDeleteUser(u)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                      {filteredUsers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={isSuperAdmin ? 6 : 5} className="text-center py-8 text-muted-foreground">No users found</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-primary" />
                {isSuperAdmin ? "Permission Requests" : "Role Change Requests"}
              </CardTitle>
              <CardDescription>
                {isSuperAdmin
                  ? "Review and approve/reject role change requests from admins."
                  : "Your submitted role change requests. Only the Super Admin can approve these."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : roleRequests.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No role change requests yet</p>
              ) : (
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Target User</TableHead>
                        <TableHead>Requested Role</TableHead>
                        <TableHead>Requested By</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        {isSuperAdmin && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roleRequests.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.target_name}</TableCell>
                          <TableCell>{getRoleBadge(r.requested_role)}</TableCell>
                          <TableCell>{r.requester_name}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{r.reason || "—"}</TableCell>
                          <TableCell>{getStatusBadge(r.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{format(new Date(r.created_at), "dd MMM yyyy")}</TableCell>
                          {isSuperAdmin && (
                            <TableCell>
                              {r.status === "pending" ? (
                                <div className="flex gap-2">
                                  <Button size="sm" variant="default" disabled={processingRequest === r.id} onClick={() => handleApproveRequest(r)}>
                                    {processingRequest === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                  </Button>
                                  <Button size="sm" variant="destructive" disabled={processingRequest === r.id} onClick={() => handleRejectRequest(r.id)}>
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : null}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dual-approval dialog (only for regular admins requesting admin role changes) */}
      <Dialog open={roleDialog.open} onOpenChange={(open) => { setRoleDialog({ ...roleDialog, open }); setRoleReason(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              Permission Request — Super Admin Approval Required
            </DialogTitle>
            <DialogDescription>
              Admin role changes require approval from the Super Admin. Your request will be submitted for review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="text-sm">
              <span className="text-muted-foreground">Target user:</span>{" "}
              <span className="font-medium">{users.find((u) => u.user_id === roleDialog.userId)?.full_name || "Unknown"}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">New role:</span>{" "}
              {getRoleBadge(roleDialog.newRole)}
            </div>
            <Textarea placeholder="Reason for role change (required for audit)..." value={roleReason} onChange={(e) => setRoleReason(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialog({ open: false, userId: "", newRole: "" })}>Cancel</Button>
            <Button onClick={submitRoleRequest} disabled={!roleReason.trim()}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation — Super Admin Only */}
      <AlertDialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Permanently Delete User
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to <strong>permanently delete</strong>{" "}
                <strong>{deleteUser?.full_name || "this user"}</strong>?
              </p>
              <p className="text-destructive font-medium">
                This action is irreversible. The user's account, profile, and role will be permanently removed from the system.
                Their bookings and donations will remain for record-keeping.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Deleting...</> : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
