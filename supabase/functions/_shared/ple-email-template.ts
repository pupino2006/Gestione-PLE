/**
 * Layout HTML email PLE (stile allineato a Rapportini / Resend)
 */

export function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function plainBodyToHtml(plain: string): string {
  return escapeHtml(plain).replace(/\n/g, '<br>');
}

export type PleEmailLayoutOptions = {
  headerTitle: string;
  /** Sottotitolo sotto il titolo blu */
  headerSubtitle?: string;
  /** HTML già escapato o sicuro (solo testo + <br> da plainBodyToHtml) */
  bodyHtml: string;
  /** Se true, mostra nota allegato PDF (senza URL) */
  hasPdfAttachment?: boolean;
  /** Link assoluto opzionale (es. PDF su storage) */
  pdfUrl?: string | null;
  /** Testo pulsante se c'è pdfUrl */
  pdfButtonLabel?: string;
};

export function buildPleEmailHtml(options: PleEmailLayoutOptions): string {
  const subtitle = options.headerSubtitle ?? 'Pannelli Termici S.r.l.';
  const attachmentNote = options.hasPdfAttachment
    ? `
          <div style="text-align: center; margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="font-size: 13px; color: #666; margin-bottom: 12px;">Il documento in formato PDF è allegato a questa email.</p>
          </div>`
    : '';

  const pdfButton = options.pdfUrl
    ? `
          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="font-size: 13px; color: #666; margin-bottom: 15px;">Documento disponibile al link seguente:</p>
            <a href="${escapeHtml(options.pdfUrl)}"
               style="background-color: #27ae60; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 2px 5px rgba(39,174,96,0.3);">
              ${escapeHtml(options.pdfButtonLabel ?? '📄 Scarica PDF')}
            </a>
          </div>`
    : '';

  return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
        <div style="background-color: #004a99; padding: 25px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px; letter-spacing: 1px;">${escapeHtml(options.headerTitle)}</h1>
          <p style="color: #e0e0e0; margin: 5px 0 0 0; font-size: 14px;">${escapeHtml(subtitle)}</p>
        </div>

        <div style="padding: 30px; line-height: 1.6; color: #333; background-color: #ffffff;">
          <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #004a99; margin: 0 0 20px 0;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #004a99;">Contenuto</p>
            <div style="margin: 0; color: #333; line-height: 1.65;">${options.bodyHtml}</div>
          </div>
          ${attachmentNote}
          ${pdfButton}
        </div>

        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 11px; color: #888; border-top: 1px solid #eee;">
          Questo è un messaggio automatico generato dal sistema Gestione PLE.<br>
          Pannelli Termici S.r.l. — Non rispondere a questa email.
        </div>
      </div>
    `;
}
