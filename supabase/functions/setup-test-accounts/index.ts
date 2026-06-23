import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

((globalThis as any).Deno as any).serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = (globalThis as any).Deno?.env?.get("SUPABASE_URL")!;
    const serviceRoleKey = (globalThis as any).Deno?.env?.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Test credentials
    const testAccounts = [
      {
        email: "superadmin@kailash.com",
        password: "Super@@1618",
        role: "super_admin",
        fullName: "Super Administrator",
      },
      {
        email: "admin@kailash.com",
        password: "Admin@@1618",
        role: "admin",
        fullName: "Administrator",
      },
      {
        email: "user@kailash.com",
        password: "User@@1618",
        role: "user",
        fullName: "Test User",
      },
      {
        email: "priest@kailash.com",
        password: "Priest@@1618",
        role: "priest",
        fullName: "Test Priest",
      },
    ];

    const results = [];

    for (const account of testAccounts) {
      try {
        // 1. Create or find auth user
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        let userId: string;
        const existingUser = existingUsers?.users?.find((u: any) => u.email === account.email);

        if (existingUser) {
          userId = existingUser.id;
          results.push({
            email: account.email,
            status: "exists",
            userId,
            role: account.role,
          });
        } else {
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: account.email,
            password: account.password,
            email_confirm: true,
            user_metadata: { full_name: account.fullName },
          });
          if (createError) throw createError;
          userId = newUser.user.id;
          results.push({
            email: account.email,
            status: "created",
            userId,
            role: account.role,
          });
        }

        // 2. Assign role
        if (account.role === "super_admin") {
          const { data: roleResult } = await supabase.rpc("create_or_update_super_admin", {
            _user_id: userId,
            _email: account.email,
          });
          results[results.length - 1].roleResult = roleResult;
        } else if (account.role === "admin") {
          const { data: roleResult } = await supabase.rpc("assign_admin_role", {
            _user_id: userId,
            _email: account.email,
          });
          results[results.length - 1].roleResult = roleResult;
        } else if (account.role === "priest" || account.role === "user") {
          // These should be auto-assigned, but ensure they exist
          const { data: checkRole } = await supabase
            .from("user_roles")
            .select("id")
            .eq("user_id", userId)
            .eq("role", account.role)
            .maybeSingle();

          if (!checkRole) {
            const { error: roleError } = await supabase.from("user_roles").insert({
              user_id: userId,
              role: account.role,
            });
            if (roleError) throw roleError;
          }
          results[results.length - 1].roleResult = { success: true, message: "Role verified/created" };
        }
      } catch (error: any) {
        results.push({
          email: account.email,
          status: "error",
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Test accounts setup completed",
        accounts: results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Setup error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
