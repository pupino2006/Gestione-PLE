/**
 * Edge Function Supabase - Invio Email Checklist
 * Utilizza Resend per l'invio di email con checklist di verifica
 */

import { Resend } from 'npm:resend';
import { buildPleEmailHtml, plainBodyToHtml } from '../_shared/ple-email-template.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Gestione preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Metodo non consentito. Usa POST.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    console.log(`Ricevuta richiesta invio email checklist per: ${body.to}`);

    const {
      to,
      subject,
      body: emailBody,
      checklistData,
      contractData
    } = body;

    // Valida i campi obbligatori
    if (!to || !subject || !emailBody) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Parametri mancanti: to, subject e body sono obbligatori' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resendKey = Deno.env.get('RESEND_API_KEY');
    const resendFrom = Deno.env.get('RESEND_FROM_EMAIL') ?? 'Gestione PLE <onboarding@resend.dev>';

    if (!resendKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'RESEND_API_KEY non configurata. Imposta il secret nella Edge Function.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailData: any = {
      from: resendFrom,
      to: to,
      subject: subject,
      html: buildPleEmailHtml({
        headerTitle: 'CHECKLIST VERIFICA PLE',
        bodyHtml: plainBodyToHtml(emailBody),
        hasPdfAttachment: false
      })
    };

    // Invia l'email usando Resend
    const resend = new Resend(resendKey);
    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Resend error: ${error.message ?? JSON.stringify(error)}`
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email checklist inviata con successo',
        data
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Errore nell\'invio dell\'email checklist:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Errore nell\'invio dell\'email checklist: ' + (error?.message ?? String(error))
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
