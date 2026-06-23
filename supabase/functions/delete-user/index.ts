import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

((globalThis as any).Deno as any).serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the calling user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = (globalThis as any).Deno?.env?.get("SUPABASE_URL")!;
    const serviceRoleKey = (globalThis as any).Deno?.env?.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create client with caller's token to verify identity
    const callerClient = createClient(supabaseUrl, (globalThis as any).Deno?.env?.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: callerUser }, error: authError } = await callerClient.auth.getUser();
    if (authError || !callerUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is super_admin
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: callerRole } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUser.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!callerRole) {
      return new Response(JSON.stringify({ error: "Only Super Admin can delete users" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get target user ID
    const { target_user_id } = await req.json();
    if (!target_user_id) {
      return new Response(JSON.stringify({ error: "target_user_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent deleting self (super admin)
    if (target_user_id === callerUser.id) {
      return new Response(JSON.stringify({ error: "Cannot delete your own account" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent deleting another super_admin
    const { data: targetRole } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", target_user_id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (targetRole) {
      return new Response(JSON.stringify({ error: "Cannot delete a Super Admin" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user info for audit log before deletion
    const { data: targetProfile } = await adminClient
      .from("profiles")
      .select("full_name, phone")
      .eq("user_id", target_user_id)
      .maybeSingle();

    const { data: targetAuth } = await adminClient.auth.admin.getUserById(target_user_id);

    // Log the deletion in audit_log BEFORE deleting
    await adminClient.from("audit_log").insert({
      action: "user_deleted",
      module_name: "user_management",
      user_id: callerUser.id,
      details: {
        deleted_user_id: target_user_id,
        deleted_user_name: targetProfile?.full_name || "Unknown",
        deleted_user_email: targetAuth?.user?.email || "Unknown",
        deleted_user_phone: targetProfile?.phone || null,
        deleted_by: callerUser.id,
        deleted_at: new Date().toISOString(),
      },
    });

    // Delete from user_roles first (cascade should handle, but be explicit)
    await adminClient.from("user_roles").delete().eq("user_id", target_user_id);

    // Delete from profiles
    await adminClient.from("profiles").delete().eq("user_id", target_user_id);

    // Delete the auth user (this is the actual account deletion)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(target_user_id);
    if (deleteError) {
      console.error("Error deleting auth user:", deleteError);
      return new Response(JSON.stringify({ error: "Failed to delete user: " + deleteError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `User ${targetProfile?.full_name || target_user_id} has been permanently deleted`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Delete user error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
