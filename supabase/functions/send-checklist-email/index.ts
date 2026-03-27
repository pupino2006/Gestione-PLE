/**
 * Edge Function Supabase - Invio Email Checklist
 * Utilizza Resend per l'invio di email con allegato PDF della checklist
 */

import { Resend } from 'resend';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') || '');

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
      to,                    // Email destinatario
      subject,               // Oggetto dell'email
      body: emailBody,       // Corpo dell'email
      checklistData,         // Dati della checklist per il PDF
      contractData,          // Dati del contratto associato
      attachmentName,        // Nome del file allegato (opzionale)
      attachmentBase64       // PDF in base64 (opzionale)
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

    // Costruisci l'HTML della checklist per il corpo dell'email
    let checklistHtml = '';
    if (checklistData) {
      const checks = [
        { key: 'check_1', label: 'Struttura' },
        { key: 'check_2', label: 'Comandi' },
        { key: 'check_3', label: 'Freni' },
        { key: 'check_4', label: 'Batteria' },
        { key: 'check_5', label: 'Cestello' },
        { key: 'check_6', label: 'Sensori' },
        { key: 'check_7', label: 'Libretto' },
        { key: 'check_8', label: 'Prova funzionamento' }
      ];

      checklistHtml = `
        <h3 style="color: #003366; margin-top: 20px;">Esito Controlli:</h3>
        <ul style="list-style: none; padding: 0;">
          ${checks.map(c => `
            <li style="padding: 5px 0;">
              <span style="color: ${checklistData[c.key] ? 'green' : 'red'}; font-size: 18px;">
                ${checklistData[c.key] ? '✅' : '❌'}
              </span>
              ${c.label}
            </li>
          `).join('')}
        </ul>
        ${checklistData.notes ? `<p style="background: #f0f0f0; padding: 10px; border-radius: 5px;"><strong>Note:</strong> ${checklistData.notes}</p>` : ''}
      `;
    }

    // Configura l'email
    const emailData = {
      from: 'Gestione PLE <onboarding@resend.dev>',
      to: to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #003366;">Checklist di Verifica PLE - Pannelli Termici S.r.l.</h2>
          ${contractData ? `
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Contratto:</strong> ${contractData.company || '-'}</p>
            <p><strong>Mezzo:</strong> ${contractData.ple_model || '-'}</p>
            <p><strong>Periodo:</strong> ${contractData.start_date ? new Date(contractData.start_date).toLocaleDateString('it-IT') : '-'} - ${contractData.end_date ? new Date(contractData.end_date).toLocaleDateString('it-IT') : '-'}</p>
          </div>
          ` : ''}
          ${checklistHtml}
          <div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 5px;">
            ${emailBody.replace(/\n/g, '<br>')}
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
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
          message: 'Email checklist inviata con successo',
          data: result
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      // Modalità di test (senza Resend configurato)
      console.log('Email checklist da inviare (modalità test):', emailData);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email checklist preparata (modalità test - RESEND_API_KEY non configurata)',
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
    console.error('Errore nell\'invio della email checklist:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Errore nell\'invio dell\'email: ' + (error.message || error.toString()) 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});