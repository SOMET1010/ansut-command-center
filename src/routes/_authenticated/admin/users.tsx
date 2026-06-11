import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseAdmin } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ShieldCheck, Plus, Trash2, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "Utilisateurs & rôles — ANSUT EVENT" }] }),
  component: AdminUsers,
});

type UserRole = { user_id: string; role: string; created_at: string };

function AdminUsers() {
  const qc = useQueryClient();
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"super_admin" | "org_admin" | "staff" | "sponsor">("staff");

  const { data: userRoles = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin
        .from("user_roles")
        .select("user_id, role, created_at, users(email)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as (UserRole & { users: { email: string } | null })[];
    },
  });

  const assignRole = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      // Find user by email
      const { data: authUser } = await supabaseAdmin.auth.admin.listUsers();
      const user = authUser?.users.find((u) => u.email === email);
      if (!user) throw new Error("Utilisateur non trouvé");

      const { error } = await supabaseAdmin.from("user_roles").upsert({
        user_id: user.id,
        role,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-user-roles"] });
      setNewEmail("");
      toast.success("Rôle assigné");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Erreur"),
  });

  const removeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-user-roles"] });
      toast.success("Rôle supprimé");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Erreur"),
  });

  const ROLES = [
    { value: "super_admin", label: "Super Admin", color: "text-red-600" },
    { value: "org_admin", label: "Admin Organisation", color: "text-orange-600" },
    { value: "staff", label: "Staff", color: "text-blue-600" },
    { value: "sponsor", label: "Sponsor", color: "text-green-600" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Utilisateurs & rôles</h1>
          <p className="text-muted-foreground mt-1">{userRoles.length} affectation(s)</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Actualiser
        </Button>
      </div>

      {/* Assign role */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Assigner un rôle
        </h2>
        <div className="flex gap-3">
          <Input
            placeholder="email@ansut.ci"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="max-w-xs"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as typeof newRole)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <Button
            onClick={() => assignRole.mutate({ email: newEmail, role: newRole })}
            disabled={!newEmail || assignRole.isPending}
          >
            <ShieldCheck className="h-4 w-4 mr-2" />
            {assignRole.isPending ? "Ajout..." : "Ajouter"}
          </Button>
        </div>
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rôle</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {userRoles.map((ur) => {
                const roleInfo = ROLES.find((r) => r.value === ur.role);
                return (
                  <tr key={`${ur.user_id}-${ur.role}`}>
                    <td className="px-4 py-3">{ur.users?.email ?? ur.user_id}</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${roleInfo?.color ?? ""}`}>
                        {roleInfo?.label ?? ur.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(ur.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => removeRole.mutate({ userId: ur.user_id, role: ur.role })}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50"
                        title="Supprimer ce rôle"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}