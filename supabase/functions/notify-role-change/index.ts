import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RoleChangeNotificationRequest {
  targetUserId: string;
  oldRole: string | null;
  newRole: string;
  action: "promoted" | "demoted";
}

const handler = async (req: Request): Promise<Response> => {
  console.log("notify-role-change function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { targetUserId, oldRole, newRole, action }: RoleChangeNotificationRequest = await req.json();
    console.log(`Processing role change notification for user ${targetUserId}: ${oldRole} -> ${newRole}`);

    // Get user email from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(targetUserId);
    
    if (userError || !userData?.user?.email) {
      console.error("Error fetching user:", userError);
      return new Response(
        JSON.stringify({ error: "Could not find user email" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userEmail = userData.user.email;
    console.log(`Sending notification to: ${userEmail}`);

    // Get user's name from profiles
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", targetUserId)
      .single();

    const userName = profileData?.full_name || "User";

    const isPromotion = action === "promoted";
    const subject = isPromotion
      ? "🎉 You've been promoted to Admin!"
      : "Role Update Notification";

    const html = isPromotion
      ? `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #16a34a;">Congratulations, ${userName}!</h1>
          <p style="font-size: 16px; color: #374151;">You have been promoted to <strong>Admin</strong> in FoodShare.</p>
          <p style="font-size: 14px; color: #6b7280;">As an admin, you now have access to:</p>
          <ul style="font-size: 14px; color: #6b7280;">
            <li>Manage food donations</li>
            <li>View and manage donation claims</li>
            <li>Access the admin dashboard</li>
            <li>Manage user accounts</li>
          </ul>
          <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
            Log in to access your new admin privileges.
          </p>
          <p style="font-size: 12px; color: #9ca3af; margin-top: 30px;">
            — The FoodShare Team
          </p>
        </div>
      `
      : `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #374151;">Role Update</h1>
          <p style="font-size: 16px; color: #374151;">Hello ${userName},</p>
          <p style="font-size: 14px; color: #6b7280;">
            Your role has been updated from <strong>${oldRole || "none"}</strong> to <strong>${newRole}</strong>.
          </p>
          <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
            If you have any questions about this change, please contact our support team.
          </p>
          <p style="font-size: 12px; color: #9ca3af; margin-top: 30px;">
            — The FoodShare Team
          </p>
        </div>
      `;

    const emailResponse = await resend.emails.send({
      from: "FoodShare <onboarding@resend.dev>",
      to: [userEmail],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-role-change function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
