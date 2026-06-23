import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPER_ADMIN_EMAIL = "superadmin@kailash.com";
const SUPER_ADMIN_PASSWORD = "Super@@1618";
const ADMIN_EMAIL = "admin@kailash.com";
const ADMIN_PASSWORD = "Admin@@1618";

((globalThis as any).Deno as any).serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = (globalThis as any).Deno?.env?.get("SUPABASE_URL")!;
    const serviceRoleKey = (globalThis as any).Deno?.env?.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const dbUrl = (globalThis as any).Deno?.env?.get("SUPABASE_DB_URL")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Create or find the superadmin@kailash.com auth user
    let superAdminUserId: string;
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingSAUser = existingUsers?.users?.find(
      (u) => u.email === SUPER_ADMIN_EMAIL
    );

    if (existingSAUser) {
      superAdminUserId = existingSAUser.id;
    } else {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: SUPER_ADMIN_EMAIL,
        password: SUPER_ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: "Super Admin" },
      });
      if (createError) throw createError;
      superAdminUserId = newUser.user.id;
    }

    // 2. Check if superadmin@kailash.com already has super_admin role
    const { data: existingSARole } = await supabase
      .from("user_roles")
      .select("id, role")
      .eq("user_id", superAdminUserId)
      .eq("role", "super_admin")
      .maybeSingle();

    if (existingSARole) {
      // Already set up correctly — just ensure premarmy889 has admin
      await ensureAdminRole(supabase, existingUsers?.users);
      return new Response(
        JSON.stringify({ message: "Super Admin already configured correctly." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Need to reassign: remove old super_admin and set new one
    // We must temporarily disable the trigger to allow this
    // Use raw SQL via the Supabase management API
    // First, remove any existing super_admin role (from premarmy889)
    const { data: oldSA } = await supabase
      .from("user_roles")
      .select("id, user_id")
      .eq("role", "super_admin")
      .maybeSingle();

    if (oldSA) {
      // Delete the old super_admin role — trigger will block this
      // So we need to use RPC or a workaround
      // Let's use a migration approach: create a temp function
      
      // Use service role to call SQL function that bypasses trigger
      const { error: rpcError } = await supabase.rpc("reassign_super_admin" as any, {
        new_super_admin_id: superAdminUserId,
        old_super_admin_id: oldSA.user_id,
      });

      if (rpcError) {
        // If the function doesn't exist, provide instructions
        return new Response(
          JSON.stringify({ 
            error: "Need to create reassign_super_admin function first. Run migration.",
            details: rpcError.message 
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // No existing super_admin — just insert
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({ user_id: superAdminUserId, role: "super_admin" });
      if (insertError) throw insertError;
    }

    // 4. Ensure premarmy889@gmail.com has admin role
    await ensureAdminRole(supabase, existingUsers?.users);

    // 5. Audit log
    await supabase.from("audit_log").insert({
      action: "super_admin_reassigned",
      module_name: "system",
      details: { 
        super_admin_email: SUPER_ADMIN_EMAIL, 
        admin_email: ADMIN_EMAIL,
        old_super_admin_id: oldSA?.user_id || null,
      },
      user_id: superAdminUserId,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Super Admin reassigned to superadmin@kailash.com successfully.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Seed super admin error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function ensureAdminRole(supabase: any, allUsers: any[] | undefined) {
  const adminUser = allUsers?.find((u: any) => u.email === ADMIN_EMAIL);
  if (!adminUser) return;

  const { data: existingRole } = await supabase
    .from("user_roles")
    .select("id, role")
    .eq("user_id", adminUser.id)
    .maybeSingle();

  if (!existingRole) {
    await supabase.from("user_roles").insert({ user_id: adminUser.id, role: "admin" });
  } else if (existingRole.role !== "admin" && existingRole.role !== "super_admin") {
    await supabase.from("user_roles").update({ role: "admin" }).eq("user_id", adminUser.id);
  }
}
