import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    console.log('Processing WhatsApp notification for donation:', donationId);

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

    // Initialize Supabase client with service role for fetching donation
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get donation and donor details
    const { data: donation, error: donationError } = await supabase
      .from('food_donations')
      .select(`
        id,
        title,
        contact_phone,
        pickup_location,
        profiles!inner(full_name, organization_name)
      `)
      .eq('id', donationId)
      .single();

    if (donationError || !donation) {
      console.error('Error fetching donation - donation not found');
      throw new Error('Donation not found');
    }

    const donorPhone = donation.contact_phone;
    if (!donorPhone) {
      console.log('No phone number provided for donor, skipping WhatsApp notification');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Notification skipped - no phone number' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Format WhatsApp message
    const whatsappMessage = `🍽️ *Food Claim Alert*

Hello ${donation.profiles.full_name || 'Donor'}!

Someone has claimed your food donation:
📦 *${donation.title}*
📍 Pickup: ${donation.pickup_location}

👤 *Claimed by:* ${recipientName}
${message ? `💬 *Message:* ${message}` : ''}

Please contact them to arrange pickup. Thank you for sharing food! 🙏

_FoodShare Kenya Platform_`;

    // Send WhatsApp message using WhatsApp Business API
    const whatsappToken = Deno.env.get('WHATSAPP_TOKEN');
    if (!whatsappToken) {
      console.error('WhatsApp token not configured');
      throw new Error('WhatsApp notification service not configured');
    }

    // Format phone number (remove any non-digits and ensure it starts with country code)
    let formattedPhone = donorPhone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1); // Kenya country code
    } else if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }

    console.log('Sending WhatsApp notification');

    // Send WhatsApp message (using WhatsApp Business API)
    const whatsappResponse = await fetch(`https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: {
          body: whatsappMessage
        }
      })
    });

    const whatsappResult = await whatsappResponse.json();
    
    if (!whatsappResponse.ok) {
      console.error('WhatsApp API error response received');
      throw new Error('Failed to send WhatsApp notification');
    }

    console.log('WhatsApp notification sent successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'WhatsApp notification sent successfully',
      whatsappMessageId: whatsappResult.messages?.[0]?.id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Error in notify-donor function:', error.message);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send notification',
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
