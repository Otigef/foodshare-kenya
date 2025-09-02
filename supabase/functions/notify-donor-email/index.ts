import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  donationId: string;
  recipientName: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { donationId, recipientName, message }: NotificationRequest = await req.json();
    
    console.log('Processing email notification for donation:', donationId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get donation details including donor information
    const { data: donation, error: donationError } = await supabase
      .from('food_donations')
      .select(`
        title,
        pickup_location,
        donor_id
      `)
      .eq('id', donationId)
      .single();

    if (donationError || !donation) {
      console.error('Error fetching donation:', donationError);
      throw new Error('Donation not found');
    }

    // Get donor's email from auth.users (we need to use auth admin to access this)
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(donation.donor_id);

    if (userError || !user?.email) {
      console.error('Error fetching donor email:', userError);
      throw new Error('Donor email not found');
    }

    console.log('Sending email to:', user.email);

    // Initialize Resend
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    // Format email content
    const emailSubject = `🍽️ Your Food Donation "${donation.title}" Has Been Claimed!`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #22c55e;">Great News! Your donation has been claimed 🎉</h2>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #334155;">Donation Details:</h3>
          <p><strong>Item:</strong> ${donation.title}</p>
          <p><strong>Pickup Location:</strong> ${donation.pickup_location}</p>
          <p><strong>Claimed by:</strong> ${recipientName}</p>
          ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
        </div>

        <div style="background-color: #ecfdf5; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #15803d;">Next Steps:</h4>
          <p style="margin-bottom: 0;">Please coordinate with the recipient to arrange pickup. You can contact them through the FoodShare platform.</p>
        </div>

        <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
          Thank you for sharing food and reducing waste! 🌱<br>
          <strong>FoodShare Team</strong>
        </p>
      </div>
    `;

    // Send email
    const emailResponse = await resend.emails.send({
      from: 'FoodShare <noreply@resend.dev>',
      to: [user.email],
      subject: emailSubject,
      html: emailHtml,
    });

    if (emailResponse.error) {
      console.error('Email API error:', emailResponse.error);
      throw new Error('Failed to send email notification');
    }

    console.log('Email sent successfully:', emailResponse.data?.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error) {
    console.error('Error in notify-donor-email function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);