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
        city: "64026 Roseto Degli Abruzzi (TE)",
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
        doc.text(`Mezzo: ${contract.ple_model || '-'}`, marginLeft, currentY);
        currentY += 6;

        // Date
        const startDate = this.formatDate(contract.start_date);
        const endDate = this.formatDate(contract.end_date);
        doc.text(`Periodo: dal ${startDate} al ${endDate}`, marginLeft, currentY);

        currentY += 15;

        // ========== CLAUSOLE CONTRATTUALI ==========
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text("Condizioni di locazione/comodato", marginLeft, currentY);
        currentY += 7;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        const clauses = [
            "1. Il comodante concede in uso al comodatario il mezzo sopra indicato per le attività consentite dalla normativa vigente in materia di sicurezza sul lavoro.",
            "2. Il comodatario si impegna a utilizzare il mezzo con la massima diligenza, nel rispetto delle istruzioni d'uso e delle prescrizioni di legge.",
            "3. Il comodatario è tenuto a verificare quotidianamente lo stato del mezzo e a sospenderne immediatamente l'utilizzo in caso di anomalie o condizioni di pericolo.",
            "4. Il comodatario è responsabile dei danni derivanti da uso improprio, negligenza, imperizia o impiego non conforme alla destinazione del mezzo.",
            "5. Eventuali guasti devono essere comunicati tempestivamente al comodante; sono vietati interventi di riparazione non autorizzati.",
            "6. Il mezzo non può essere ceduto a terzi, sublocato o utilizzato da personale non formato e non autorizzato.",
            "7. Durante il periodo di disponibilità, il comodatario assume la custodia del mezzo e ne risponde fino alla riconsegna.",
            "8. La durata della locazione/comodato è quella indicata nel presente documento; eventuali proroghe devono essere concordate per iscritto.",
            "9. Alla scadenza il mezzo deve essere restituito nello stato originario, salvo il normale deterioramento d'uso.",
            "10. Per quanto non espressamente previsto, si rinvia alle norme del codice civile in materia di comodato/locazione e alle disposizioni vigenti sulla sicurezza."
        ];

        clauses.forEach((clause) => {
            const lines = doc.splitTextToSize(clause, contentWidth);
            lines.forEach((line) => {
                if (currentY > 255) {
                    doc.addPage();
                    currentY = marginTop;
                }
                doc.text(line, marginLeft, currentY);
                currentY += 5;
            });
            currentY += 2;
        });

        currentY += 6;

        // ========== FORO COMPETENTE E LEGGE APPLICABILE ==========
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        if (currentY > 240) {
            doc.addPage();
            currentY = marginTop;
        }
        doc.text("Foro competente e legge applicabile", marginLeft, currentY);
        currentY += 7;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const foroParagraphs = [
            "Il presente contratto è disciplinato dalla legge italiana.",
            "Per ogni controversia relativa all'interpretazione, validità ed esecuzione del presente contratto, le parti convengono la competenza esclusiva del Foro di Teramo, ferma restando l'applicazione delle norme imperative in materia di competenza del giudice, ove previste."
        ];
        foroParagraphs.forEach((p) => {
            const wrapped = doc.splitTextToSize(p, contentWidth);
            wrapped.forEach((line) => {
                if (currentY > 255) {
                    doc.addPage();
                    currentY = marginTop;
                }
                doc.text(line, marginLeft, currentY);
                currentY += 5;
            });
            currentY += 3;
        });

        currentY += 6;

        // Se lo spazio residuo non basta per blocco firme, passa a una nuova pagina.
        if (currentY > 225) {
            doc.addPage();
            currentY = marginTop;
        }

        // ========== FIRME ==========
        // Linea orizzontale
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);
        doc.line(marginLeft, currentY, marginLeft + contentWidth, currentY);

        currentY += 10;

        // Firme
        const leftCol = marginLeft;
        const rightCol = marginLeft + 90;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        
        // Data e luogo
        const today = this.formatDate(new Date().toISOString());
        doc.text(`Roseto Degli Abruzzi, ${today}`, marginLeft + contentWidth / 2, currentY, { align: 'center' });

        currentY += 10;

        // Intestazioni firma
        doc.setFontSize(9);
        doc.text("Il Comodante", leftCol, currentY);
        doc.text("Il Comodatario", rightCol, currentY);

        currentY += 5;

        // Spazio firma comodatario
        doc.setDrawColor(150, 150, 150);
        doc.setLineWidth(0.2);

        // Timbro e firma del comodante (a sinistra) — testo blu, senza bordo, interlinea compatta
        try {
            const stampX = leftCol;
            const stampY = currentY;
            const stampWidth = 55;
            const stampBlueR = 0;
            const stampBlueG = 74;
            const stampBlueB = 153;
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(stampBlueR, stampBlueG, stampBlueB);
            const lineStep = 4;
            let stampTextY = stampY + 6;
            doc.text('PANNELLI TERMICI S.r.l.', stampX + stampWidth / 2, stampTextY, { align: 'center' });
            stampTextY += lineStep;
            doc.text("Via dell'Alpo, 27", stampX + stampWidth / 2, stampTextY, { align: 'center' });
            stampTextY += lineStep;
            doc.text('Roseto Degli Abruzzi (TE)', stampX + stampWidth / 2, stampTextY, { align: 'center' });
            stampTextY += lineStep;
            doc.text('C.F./P.IVA 00454730235', stampX + stampWidth / 2, stampTextY, { align: 'center' });
            doc.setTextColor(0, 0, 0);

            // Usa la firma digitale del comodante se disponibile, altrimenti usa Firma.png
            if (contract.comodante_signature) {
                doc.addImage(contract.comodante_signature, 'PNG', stampX + 3, stampY + 3, 35, 20);
            } else {
                const firmaData = await this.getImageAsBase64('Firma.png');
                doc.addImage(firmaData, 'PNG', stampX + 3, stampY + 3, 35, 20);
            }
        } catch (e) {
            console.error('Errore caricamento firma/timbro:', e);
            // Firma alternativa se immagine non disponibile
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text("_________________", leftCol, currentY + 20);
        }
        
        // Firma del comodatario (a destra)
        if (contract.comodatario_signature) {
            try {
                doc.addImage(contract.comodatario_signature, 'PNG', rightCol, currentY, 60, 30);
            } catch (e) {
                console.error('Errore caricamento firma comodatario:', e);
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                doc.text("_________________", rightCol, currentY + 20);
            }
        } else {
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.line(rightCol, currentY + 20, rightCol + 60, currentY + 20);
        }

        this.addContractPdfFooters(doc, marginLeft, contentWidth);

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
        doc.text(`Mezzo: ${contract.ple_model || '-'}`, marginLeft, currentY);
        currentY += 6;

        // Date
        const startDate = this.formatDate(contract.start_date);
        const endDate = this.formatDate(contract.end_date);
        doc.text(`Periodo: dal ${startDate} al ${endDate}`, marginLeft, currentY);

        currentY += 15;

        // ========== CLAUSOLE CONTRATTUALI ==========
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text("Condizioni di locazione/comodato", marginLeft, currentY);
        currentY += 7;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        const clauses = [
            "1. Il comodante concede in uso al comodatario il mezzo sopra indicato per le attività consentite dalla normativa vigente in materia di sicurezza sul lavoro.",
            "2. Il comodatario si impegna a utilizzare il mezzo con la massima diligenza, nel rispetto delle istruzioni d'uso e delle prescrizioni di legge.",
            "3. Il comodatario è tenuto a verificare quotidianamente lo stato del mezzo e a sospenderne immediatamente l'utilizzo in caso di anomalie o condizioni di pericolo.",
            "4. Il comodatario è responsabile dei danni derivanti da uso improprio, negligenza, imperizia o impiego non conforme alla destinazione del mezzo.",
            "5. Eventuali guasti devono essere comunicati tempestivamente al comodante; sono vietati interventi di riparazione non autorizzati.",
            "6. Il mezzo non può essere ceduto a terzi, sublocato o utilizzato da personale non formato e non autorizzato.",
            "7. Durante il periodo di disponibilità, il comodatario assume la custodia del mezzo e ne risponde fino alla riconsegna.",
            "8. La durata della locazione/comodato è quella indicata nel presente documento; eventuali proroghe devono essere concordate per iscritto.",
            "9. Alla scadenza il mezzo deve essere restituito nello stato originario, salvo il normale deterioramento d'uso.",
            "10. Per quanto non espressamente previsto, si rinvia alle norme del codice civile in materia di comodato/locazione e alle disposizioni vigenti sulla sicurezza."
        ];

        clauses.forEach((clause) => {
            const lines = doc.splitTextToSize(clause, contentWidth);
            lines.forEach((line) => {
                if (currentY > 255) {
                    doc.addPage();
                    currentY = marginTop;
                }
                doc.text(line, marginLeft, currentY);
                currentY += 5;
            });
            currentY += 2;
        });

        currentY += 6;

        // ========== FORO COMPETENTE E LEGGE APPLICABILE ==========
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        if (currentY > 240) {
            doc.addPage();
            currentY = marginTop;
        }
        doc.text("Foro competente e legge applicabile", marginLeft, currentY);
        currentY += 7;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const foroParagraphs = [
            "Il presente contratto è disciplinato dalla legge italiana.",
            "Per ogni controversia relativa all'interpretazione, validità ed esecuzione del presente contratto, le parti convengono la competenza esclusiva del Foro di Teramo, ferma restando l'applicazione delle norme imperative in materia di competenza del giudice, ove previste."
        ];
        foroParagraphs.forEach((p) => {
            const wrapped = doc.splitTextToSize(p, contentWidth);
            wrapped.forEach((line) => {
                if (currentY > 255) {
                    doc.addPage();
                    currentY = marginTop;
                }
                doc.text(line, marginLeft, currentY);
                currentY += 5;
            });
            currentY += 3;
        });

        currentY += 6;

        // Se lo spazio residuo non basta per blocco firme, passa a una nuova pagina.
        if (currentY > 225) {
            doc.addPage();
            currentY = marginTop;
        }

        // ========== FIRME ==========
        // Linea orizzontale
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);
        doc.line(marginLeft, currentY, marginLeft + contentWidth, currentY);

        currentY += 10;

        // Firme
        const leftCol = marginLeft;
        const rightCol = marginLeft + 90;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        
        // Data e luogo
        const today = this.formatDate(new Date().toISOString());
        doc.text(`Roseto Degli Abruzzi, ${today}`, marginLeft + contentWidth / 2, currentY, { align: 'center' });

        currentY += 10;

        // Intestazioni firma
        doc.setFontSize(9);
        doc.text("Il Comodante", leftCol, currentY);
        doc.text("Il Comodatario", rightCol, currentY);

        currentY += 5;

        // Spazio firma comodatario
        doc.setDrawColor(150, 150, 150);
        doc.setLineWidth(0.2);

        // Timbro e firma del comodante (a sinistra) — testo blu, senza bordo, interlinea compatta
        try {
            const stampX = leftCol;
            const stampY = currentY;
            const stampWidth = 55;
            const stampBlueR = 0;
            const stampBlueG = 74;
            const stampBlueB = 153;
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(stampBlueR, stampBlueG, stampBlueB);
            const lineStep = 4;
            let stampTextY = stampY + 6;
            doc.text('PANNELLI TERMICI S.r.l.', stampX + stampWidth / 2, stampTextY, { align: 'center' });
            stampTextY += lineStep;
            doc.text("Via dell'Alpo, 27", stampX + stampWidth / 2, stampTextY, { align: 'center' });
            stampTextY += lineStep;
            doc.text('Roseto Degli Abruzzi (TE)', stampX + stampWidth / 2, stampTextY, { align: 'center' });
            stampTextY += lineStep;
            doc.text('C.F./P.IVA 00454730235', stampX + stampWidth / 2, stampTextY, { align: 'center' });
            doc.setTextColor(0, 0, 0);

            // Usa la firma digitale del comodante se disponibile, altrimenti usa Firma.png
            if (contract.comodante_signature) {
                doc.addImage(contract.comodante_signature, 'PNG', stampX + 3, stampY + 3, 35, 20);
            } else {
                const firmaData = await this.getImageAsBase64('Firma.png');
                doc.addImage(firmaData, 'PNG', stampX + 3, stampY + 3, 35, 20);
            }
        } catch (e) {
            console.error('Errore caricamento firma/timbro:', e);
            // Firma alternativa se immagine non disponibile
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text("_________________", leftCol, currentY + 20);
        }
        
        // Firma del comodatario (a destra)
        if (contract.comodatario_signature) {
            try {
                doc.addImage(contract.comodatario_signature, 'PNG', rightCol, currentY, 60, 30);
            } catch (e) {
                console.error('Errore caricamento firma comodatario:', e);
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                doc.text("_________________", rightCol, currentY + 20);
            }
        } else {
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.line(rightCol, currentY + 20, rightCol + 60, currentY + 20);
        }

        this.addContractPdfFooters(doc, marginLeft, contentWidth);

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
     * Piè di pagina e numerazione su tutte le pagine del contratto (Pag. X/Y).
     * @param {object} doc - Istanza jsPDF
     * @param {number} marginLeft
     * @param {number} contentWidth
     */
    addContractPdfFooters(doc, marginLeft, contentWidth) {
        const totalPages = doc.internal.getNumberOfPages();
        const pageHeight =
            typeof doc.internal.pageSize.getHeight === 'function'
                ? doc.internal.pageSize.getHeight()
                : doc.internal.pageSize.height;
        const footerY = pageHeight - 10;
        const rightX = marginLeft + contentWidth;

        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(150, 150, 150);
            doc.text(
                'Documento generato automaticamente dal sistema di gestione PLE',
                marginLeft + contentWidth / 2,
                footerY,
                { align: 'center' }
            );
            doc.text(`Pag. ${i}/${totalPages}`, rightX, footerY, { align: 'right' });
        }
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