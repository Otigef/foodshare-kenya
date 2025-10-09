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
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Unauthorized access attempt');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { donationId, recipientName, message }: NotificationRequest = await req.json();
    
    console.log('Processing email notification request');

    // Verify user owns this claim
    const { data: claim, error: claimError } = await supabaseClient
      .from('donation_claims')
      .select('id')
      .eq('donation_id', donationId)
      .eq('recipient_id', user.id)
      .single();

    if (claimError || !claim) {
      console.error('Unauthorized claim access attempt');
      return new Response(
        JSON.stringify({ error: 'Unauthorized access to donation' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role
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
      console.error('Donation not found');
      throw new Error('Donation not found');
    }

    // Get donor's email from auth.users (we need to use auth admin to access this)
    const { data: { user: donorUser }, error: userError } = await supabase.auth.admin.getUserById(donation.donor_id);

    if (userError || !donorUser?.email) {
      console.error('Donor information not available');
      throw new Error('Donor email not found');
    }

    console.log('Sending email notification');

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
      to: [donorUser.email],
      subject: emailSubject,
      html: emailHtml,
    });

    if (emailResponse.error) {
      console.error('Email API error');
      throw new Error('Failed to send email notification');
    }

    console.log('Email sent successfully');

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
    console.error('Error in notify-donor-email function:', error.message);
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
