// supabase/functions/send-email/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Mailgun from 'https://esm.sh/mailgun.js@12.0.3';
import FormData from 'https://esm.sh/form-data@4.0.4';

const API_KEY = Deno.env.get('MAILGUN_API_KEY');
const DOMAIN = Deno.env.get('MAILGUN_DOMAIN');
const BASE_URL = Deno.env.get('MAILGUN_API_BASE_URL');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
  username: 'api',
  key: API_KEY,
  url: BASE_URL,
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { customerEmail, natureOfWork } = await req.json();

    // 🌟 This is the crucial validation to prevent the server from crashing 🌟
    if (!customerEmail || typeof customerEmail !== 'string' || !natureOfWork || typeof natureOfWork !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid data format. customerEmail and natureOfWork must be strings.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const messageData = {
      from: `Truzly India - Team <mailgun@${DOMAIN}>`,
      to: customerEmail,
      subject: `Great News! Your ${natureOfWork} is completed!`,
      html: `
        Dear Valued Customer,
        <p>We're thrilled to announce that your ${natureOfWork} has been successfully completed!</p>
        <p>Please let us know if you have any questions or require further assistance.</p>
        <p>Thank you,<br/>Truzly India - Team</p>
        <p>This is an auto-generated email.</p>
      `,
    };

    const result = await mg.messages.create(DOMAIN, messageData);

    console.log("✅ Email sent:", result);
    return new Response(
      JSON.stringify({ status: 'success', message: 'Email sent successfully.' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );

  } catch (error) {
    console.error("❌ Mailgun Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});