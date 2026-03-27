/**
 * Generatore PDF per Contratti PLE
 * Utilizza jsPDF per generare PDF lato client
 */

const pdfGenerator = {
    /**
     * Dati fissi del comodante
     */
    commodante: {
        name: "Pannelli Termici S.r.l.",
        address: "Via dell'Alpo n°27",
        city: "37136 Verona (VR)",
        fiscalCode: "C.F./P.IVA 00454730235"
    },

    /**
     * Genera il PDF del contratto e lo restituisce come base64
     * @param {object} contract - Dati del contratto
     * @returns {Promise<object>} - Risultato con base64 del PDF
     */
    async generateContractPDFAsBase64(contract) {
        // Carica la libreria jsPDF se non presente
        if (typeof window.jspdf === 'undefined') {
            await this.loadJsPDF();
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Margini
        const marginLeft = 20;
        const marginRight = 20;
        const marginTop = 20;
        const contentWidth = 170;

        // ========== INTESTAZIONE ==========
        let currentY = marginTop;

        // Logo a sinistra
        try {
            const logoData = await this.getImageAsBase64('pt.png');
            doc.addImage(logoData, 'PNG', marginLeft, currentY, 30, 20);
        } catch (e) {
            console.error('Errore caricamento logo:', e);
        }

        // Informazioni a destra dell'intestazione
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text("Sistema di Gestione Qualità", 120, currentY + 5);
        doc.text("Modulo rev 0", 120, currentY + 10);

        // Logo e info header
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text("PANNELLI TERMICI S.r.l.", 90, currentY + 18);

        currentY += 30;

        // ========== TITOLO ==========
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text("CONTRATTO DI COMODATO D'USO PLE", marginLeft + contentWidth / 2, currentY, { align: 'center' });

        currentY += 15;

        // Linea divisoria
        doc.setDrawColor(0, 51, 102);
        doc.setLineWidth(0.5);
        doc.line(marginLeft, currentY, marginLeft + contentWidth, currentY);

        currentY += 10;

        // ========== CLAUSOLE DEL CONTRATTO ==========
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);

        // Testo introduttivo
        const introText = [
            "Con la presente si stipula il seguente contratto di comodato d'uso di Piattaforma di Lavoro",
            "Elevato (PLE) tra le parti di seguito indicate."
        ];

        introText.forEach(line => {
            doc.text(line, marginLeft, currentY);
            currentY += 6;
        });

        currentY += 5;

        // ========== DATI COMODANTE (FISSO) ==========
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text("COMODANTE (Concedente):", marginLeft, currentY);
        currentY += 7;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(this.commodante.name, marginLeft, currentY);
        currentY += 5;
        doc.text(this.commodante.address, marginLeft, currentY);
        currentY += 5;
        doc.text(this.commodante.city, marginLeft, currentY);
        currentY += 5;
        doc.text(this.commodante.fiscalCode, marginLeft, currentY);

        currentY += 10;

        // ========== DATI COMODATARIO (DINAMICO) ==========
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text("COMODATARIO (Utilizzatore):", marginLeft, currentY);
        currentY += 7;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(contract.company || '-', marginLeft, currentY);
        currentY += 5;
        doc.text(contract.address || '-', marginLeft, currentY);
        currentY += 5;
        doc.text(contract.fiscal_code || '-', marginLeft, currentY);

        currentY += 10;

        // ========== DETTAGLI MEZZO E DATE ==========
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text("OGGETTO DEL COMODATO:", marginLeft, currentY);
        currentY += 7;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        // Mezzo
        const pleLabel = this.getPleTypeLabel(contract.ple_model);
        doc.text(`Mezzo: ${pleLabel}`, marginLeft, currentY);
        currentY += 6;

        // Date
        const startDate = this.formatDate(contract.start_date);
        const endDate = this.formatDate(contract.end_date);
        doc.text(`Periodo: dal ${startDate} al ${endDate}`, marginLeft, currentY);

        currentY += 15;

        // ========== CLAUSOLE CONTRATTUALI ==========
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text("CONDIZIONI DEL CONTRATTO:", marginLeft, currentY);
        currentY += 7;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        const clauses = [
            "1. Il comodante concede in uso al comodatario il mezzo sopra indicato per le attività",
            "   consentite dalla normativa vigente in materia di sicurezza sul lavoro.",
            "",
            "2. Il comodatario si impegna a utilizzare il mezzo con la massima diligenza e a",
            "   sottoporlo a regolare manutenzione secondo le indicazioni del produttore.",
            "",
            "3. Il comodatario è responsabile di qualsiasi danno causato al mezzo durante il",
            "   periodo di utilizzo.",
            "",
            "4. Il presente contratto ha durata determinata come sopra indicato e si intende",
            "   risolto automaticamente alla scadenza senza necessità di disdetta.",
            "",
            "5. Il comodatario dichiara di aver ricevuto il mezzo in perfette condizioni di",
            "   funzionamento e di restituirlo nello stato medesimo."
        ];

        clauses.forEach(line => {
            doc.text(line, marginLeft, currentY);
            currentY += 5;
        });

        currentY += 5;

        // ========== FIRME ==========
        // Linea orizzontale
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);
        doc.line(marginLeft, currentY, marginLeft + contentWidth, currentY);

        currentY += 15;

        // Firme
        const centerX = marginLeft + contentWidth / 2;
        const leftCol = marginLeft;
        const rightCol = marginLeft + 90;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        
        // Data e luogo
        const today = this.formatDate(new Date().toISOString());
        doc.text(`Verona, ${today}`, marginLeft + contentWidth / 2, currentY, { align: 'center' });

        currentY += 15;

        // Intestazioni firma
        doc.setFontSize(9);
        doc.text("Il Comodante", leftCol, currentY);
        doc.text("Il Comodatario", rightCol, currentY);

        currentY += 10;

        // Spazio firma comodatario
        doc.setDrawColor(150, 150, 150);
        doc.setLineWidth(0.2);
        doc.line(rightCol, currentY, rightCol + 60, currentY);

        // Timbro e firma del comodante (a sinistra)
        try {
            // Timbro rettangolare
            doc.setDrawColor(102, 0, 0);
            doc.setLineWidth(0.5);
            const stampX = leftCol;
            const stampY = currentY - 8;
            doc.rect(stampX, stampY, 50, 25);
            
            // Testo timbro
            doc.setFontSize(7);
            doc.setTextColor(102, 0, 0);
            doc.text("PANNELLI TERMICI S.r.l.", stampX + 25, stampY + 8, { align: 'center' });
            doc.text("Via dell'Alpo, 27", stampX + 25, stampY + 13, { align: 'center' });
            doc.text("37136 Verona", stampX + 25, stampY + 18, { align: 'center' });
            doc.text("C.F./P.IVA 00454730235", stampX + 25, stampY + 23, { align: 'center' });

            // Usa la firma digitale del comodante se disponibile, altrimenti usa Firma.png
            if (contract.comodante_signature) {
                doc.addImage(contract.comodante_signature, 'PNG', stampX + 2, stampY + 3, 30, 15);
            } else {
                const firmaData = await this.getImageAsBase64('Firma.png');
                doc.addImage(firmaData, 'PNG', stampX + 2, stampY + 3, 30, 15);
            }
        } catch (e) {
            console.error('Errore caricamento firma/timbro:', e);
            // Firma alternativa se immagine non disponibile
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text("_________________", leftCol + 20, currentY);
        }
        
        // Firma del comodatario (a destra)
        if (contract.comodatario_signature) {
            try {
                doc.addImage(contract.comodatario_signature, 'PNG', rightCol, currentY - 8, 50, 25);
            } catch (e) {
                console.error('Errore caricamento firma comodatario:', e);
                doc.setFontSize(12);
                doc.setTextColor(0, 0, 0);
                doc.text("_________________", rightCol + 20, currentY);
            }
        } else {
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text("_________________", rightCol + 20, currentY);
        }

        // ========== PIÈ DI PAGINA ==========
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("Documento generato automaticamente dal sistema di gestione PLE", marginLeft + contentWidth / 2, 285, { align: 'center' });

        // Restituisci il PDF come base64
        const fileName = `Contratto_PLE_${contract.company.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
        const pdfBase64 = doc.output('datauristring').split(',')[1];
        
        return { 
            success: true, 
            fileName: fileName,
            base64: pdfBase64 
        };
    },

    /**
     * Genera il PDF del contratto di comodato d'uso PLE
     * @param {object} contract - Dati del contratto
     */
    async generateContractPDF(contract) {
        // Carica la libreria jsPDF se non presente
        if (typeof window.jspdf === 'undefined') {
            await this.loadJsPDF();
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Margini
        const marginLeft = 20;
        const marginRight = 20;
        const marginTop = 20;
        const contentWidth = 170;

        // ========== INTESTAZIONE ==========
        let currentY = marginTop;

        // Logo a sinistra
        try {
            const logoData = await this.getImageAsBase64('pt.png');
            doc.addImage(logoData, 'PNG', marginLeft, currentY, 30, 20);
        } catch (e) {
            console.error('Errore caricamento logo:', e);
        }

        // Informazioni a destra dell'intestazione
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text("Sistema di Gestione Qualità", 120, currentY + 5);
        doc.text("Modulo rev 0", 120, currentY + 10);

        // Logo e info header
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text("PANNELLI TERMICI S.r.l.", 90, currentY + 18);

        currentY += 30;

        // ========== TITOLO ==========
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text("CONTRATTO DI COMODATO D'USO PLE", marginLeft + contentWidth / 2, currentY, { align: 'center' });

        currentY += 15;

        // Linea divisoria
        doc.setDrawColor(0, 51, 102);
        doc.setLineWidth(0.5);
        doc.line(marginLeft, currentY, marginLeft + contentWidth, currentY);

        currentY += 10;

        // ========== CLAUSOLE DEL CONTRATTO ==========
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);

        // Testo introduttivo
        const introText = [
            "Con la presente si stipula il seguente contratto di comodato d'uso di Piattaforma di Lavoro",
            "Elevato (PLE) tra le parti di seguito indicate."
        ];

        introText.forEach(line => {
            doc.text(line, marginLeft, currentY);
            currentY += 6;
        });

        currentY += 5;

        // ========== DATI COMODANTE (FISSO) ==========
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text("COMODANTE (Concedente):", marginLeft, currentY);
        currentY += 7;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(this.commodante.name, marginLeft, currentY);
        currentY += 5;
        doc.text(this.commodante.address, marginLeft, currentY);
        currentY += 5;
        doc.text(this.commodante.city, marginLeft, currentY);
        currentY += 5;
        doc.text(this.commodante.fiscalCode, marginLeft, currentY);

        currentY += 10;

        // ========== DATI COMODATARIO (DINAMICO) ==========
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text("COMODATARIO (Utilizzatore):", marginLeft, currentY);
        currentY += 7;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(contract.company || '-', marginLeft, currentY);
        currentY += 5;
        doc.text(contract.address || '-', marginLeft, currentY);
        currentY += 5;
        doc.text(contract.fiscal_code || '-', marginLeft, currentY);

        currentY += 10;

        // ========== DETTAGLI MEZZO E DATE ==========
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text("OGGETTO DEL COMODATO:", marginLeft, currentY);
        currentY += 7;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        // Mezzo
        const pleLabel = this.getPleTypeLabel(contract.ple_model);
        doc.text(`Mezzo: ${pleLabel}`, marginLeft, currentY);
        currentY += 6;

        // Date
        const startDate = this.formatDate(contract.start_date);
        const endDate = this.formatDate(contract.end_date);
        doc.text(`Periodo: dal ${startDate} al ${endDate}`, marginLeft, currentY);

        currentY += 15;

        // ========== CLAUSOLE CONTRATTUALI ==========
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text("CONDIZIONI DEL CONTRATTO:", marginLeft, currentY);
        currentY += 7;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        const clauses = [
            "1. Il comodante concede in uso al comodatario il mezzo sopra indicato per le attività",
            "   consentite dalla normativa vigente in materia di sicurezza sul lavoro.",
            "",
            "2. Il comodatario si impegna a utilizzare il mezzo con la massima diligenza e a",
            "   sottoporlo a regolare manutenzione secondo le indicazioni del produttore.",
            "",
            "3. Il comodatario è responsabile di qualsiasi danno causato al mezzo durante il",
            "   periodo di utilizzo.",
            "",
            "4. Il presente contratto ha durata determinata come sopra indicato e si intende",
            "   risolto automaticamente alla scadenza senza necessità di disdetta.",
            "",
            "5. Il comodatario dichiara di aver ricevuto il mezzo in perfette condizioni di",
            "   funzionamento e di restituirlo nello stato medesimo."
        ];

        clauses.forEach(line => {
            doc.text(line, marginLeft, currentY);
            currentY += 5;
        });

        currentY += 5;

        // ========== FIRME ==========
        // Linea orizzontale
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);
        doc.line(marginLeft, currentY, marginLeft + contentWidth, currentY);

        currentY += 15;

        // Firme
        const centerX = marginLeft + contentWidth / 2;
        const leftCol = marginLeft;
        const rightCol = marginLeft + 90;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        
        // Data e luogo
        const today = this.formatDate(new Date().toISOString());
        doc.text(`Verona, ${today}`, marginLeft + contentWidth / 2, currentY, { align: 'center' });

        currentY += 15;

        // Intestazioni firma
        doc.setFontSize(9);
        doc.text("Il Comodante", leftCol, currentY);
        doc.text("Il Comodatario", rightCol, currentY);

        currentY += 10;

        // Spazio firma comodatario
        doc.setDrawColor(150, 150, 150);
        doc.setLineWidth(0.2);
        doc.line(rightCol, currentY, rightCol + 60, currentY);

        // Timbro e firma del comodante (a sinistra)
        try {
            // Timbro rettangolare
            doc.setDrawColor(102, 0, 0);
            doc.setLineWidth(0.5);
            const stampX = leftCol;
            const stampY = currentY - 8;
            doc.rect(stampX, stampY, 50, 25);
            
            // Testo timbro
            doc.setFontSize(7);
            doc.setTextColor(102, 0, 0);
            doc.text("PANNELLI TERMICI S.r.l.", stampX + 25, stampY + 8, { align: 'center' });
            doc.text("Via dell'Alpo, 27", stampX + 25, stampY + 13, { align: 'center' });
            doc.text("37136 Verona", stampX + 25, stampY + 18, { align: 'center' });
            doc.text("C.F./P.IVA 00454730235", stampX + 25, stampY + 23, { align: 'center' });

            // Usa la firma digitale del comodante se disponibile, altrimenti usa Firma.png
            if (contract.comodante_signature) {
                doc.addImage(contract.comodante_signature, 'PNG', stampX + 2, stampY + 3, 30, 15);
            } else {
                const firmaData = await this.getImageAsBase64('Firma.png');
                doc.addImage(firmaData, 'PNG', stampX + 2, stampY + 3, 30, 15);
            }
        } catch (e) {
            console.error('Errore caricamento firma/timbro:', e);
            // Firma alternativa se immagine non disponibile
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text("_________________", leftCol + 20, currentY);
        }
        
        // Firma del comodatario (a destra)
        if (contract.comodatario_signature) {
            try {
                doc.addImage(contract.comodatario_signature, 'PNG', rightCol, currentY - 8, 50, 25);
            } catch (e) {
                console.error('Errore caricamento firma comodatario:', e);
                doc.setFontSize(12);
                doc.setTextColor(0, 0, 0);
                doc.text("_________________", rightCol + 20, currentY);
            }
        } else {
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text("_________________", rightCol + 20, currentY);
        }

        // ========== PIÈ DI PAGINA ==========
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("Documento generato automaticamente dal sistema di gestione PLE", marginLeft + contentWidth / 2, 285, { align: 'center' });

        // Salva il PDF
        const fileName = `Contratto_PLE_${contract.company.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
        doc.save(fileName);
        
        return { success: true, fileName: fileName };
    },

    /**
     * Carica la libreria jsPDF dinamicamente
     * @returns {Promise} - Promessa che si risolve quando la libreria è caricata
     */
    loadJsPDF() {
        return new Promise((resolve, reject) => {
            if (typeof window.jspdf !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = () => {
                // Aspetta che il modulo sia pronto
                if (window.jspdf && window.jspdf.jsPDF) {
                    resolve();
                } else {
                    setTimeout(resolve, 100);
                }
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    /**
     * Converte un'immagine in base64
     * @param {string} url - URL dell'immagine
     * @returns {Promise<string>} - Stringa base64
     */
    getImageAsBase64(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png').split(',')[1]);
            };
            img.onerror = reject;
            img.src = url;
        });
    },

    /**
     * Formatta una data per la visualizzazione
     * @param {string} dateString - Data in formato ISO
     * @returns {string} - Data formattata in italiano
     */
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    },

    /**
     * Restituisce l'etichetta per il tipo di PLE
     * @param {string} type - Tipo di PLE
     * @returns {string} - Etichetta
     */
    getPleTypeLabel(type) {
        const labels = {
            'PLE Haulotte Verticale': 'PLE Haulotte Verticale',
            'Cesab MAK 45': 'Cesab MAK 45',
            'Cesab Blitz 16': 'Cesab Blitz 16',
            'Hyster 28': 'Hyster 28',
            'Robustus': 'Robustus',
            'verticale': 'PLE Verticale',
            'semovente': 'PLE Semovente',
            'a_BR': 'PLE a_BR'
        };
        return labels[type] || type || '-';
    }
};

// Esporta il modulo
window.pdfGenerator = pdfGenerator;