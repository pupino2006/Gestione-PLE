/**
 * Edge Function Supabase - Invio Email Contratto
 * Utilizza Resend per l'invio di email con allegato PDF
 */

import { Resend } from 'resend';

const resend = new Deno.env.get('RESEND_API_KEY') || '';

Deno.serve(async (req) => {
  // Controlla che sia una richiesta POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Metodo non consentito. Usa POST.' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    
    const {
      to,           // Email destinatario
      subject,      // Oggetto dell'email
      body: emailBody, // Corpo dell'email
      attachmentName, // Nome del file allegato (opzionale)
      attachmentBase64 // PDF in base64 (opzionale)
    } = body;

    // Valida i campi obbligatori
    if (!to || !subject || !emailBody) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Parametri mancanti: to, subject e body sono obbligatori' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Configura l'email
    const emailData = {
      from: 'Gestione PLE <onboarding@resend.dev>',
      to: to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #003366;">Gestione PLE - Pannelli Termici S.r.l.</h2>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            ${emailBody.replace(/\n/g, '<br>')}
          </div>
          <p style="color: #666; font-size: 12px;">
            Questo è un messaggio automatico generato dal sistema di gestione PLE.<br>
            Pannelli Termici S.r.l. - Via dell'Alpo n°27 - 37136 Verona (VR)
          </p>
        </div>
      `
    };

    // Aggiungi l'allegato se presente
    if (attachmentBase64 && attachmentName) {
      emailData.attachments = [
        {
          filename: attachmentName,
          content: attachmentBase64
        }
      ];
    }

    // Invia l'email usando Resend
    if (resend) {
      const resendClient = new Resend(resend);
      const result = await resendClient.emails.send(emailData);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email inviata con successo',
          data: result
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      // Modalità di test (senza Resend configurato)
      console.log('Email da inviare (modalità test):', emailData);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email preparata (modalità test - RESEND_API_KEY non configurata)',
          preview: {
            to: to,
            subject: subject,
            hasAttachment: !!attachmentBase64
          }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Errore nell\'invio dell\'email:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Errore nell\'invio dell\'email: ' + error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});