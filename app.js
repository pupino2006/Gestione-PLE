/**
 * App Principale - Gestione PLE
 * Coordina tutte le funzionalita dell'applicazione
 */

const app = {
    currentUser: null,
    currentSection: 'home', // Partenza direttamente dalla home
    notificationEmail: 'geom.rip@gmail.com',

    /**
     * Inizializza l'applicazione
     */
    init() {
        console.log('App init - avvio applicazione');
        
        this.setupEventListeners();
        
        // Crea utente demo e salta auth
        this.currentUser = {
            id: 'demo-user-' + Date.now(),
            email: 'demo@gestione-ple.local',
            name: 'Operatore Demo'
        };
        
        console.log('Utente demo creato:', this.currentUser);
        
        // Aggiorna UI
        const userEmailEl = document.getElementById('user-email');
        if (userEmailEl) {
            userEmailEl.textContent = this.currentUser.email;
        }
        
        this.initSignaturePads();
        
        // Mostra la home
        this.showSection('home');
        
        console.log('App init - completato');
    },

    /**
     * Inizializza i pad per le firme
     */
    initSignaturePads() {
        this.signaturePads = {};
        
        // Inizializza firma comodante
        this.initSignaturePad('comodante');
        // Inizializza firma comodatario
        this.initSignaturePad('comodatario');
    },

    /**
     * Inizializza un singolo pad per la firma
     * @param {string} type - Tipo di firma (comodante o comodatario)
     */
    initSignaturePad(type) {
        const canvas = document.getElementById(`signature-${type}`);
        if (!canvas) return;

        // Imposta il canvas per il touch
        canvas.style.touchAction = 'none';
        canvas.style.cursor = 'crosshair';

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;

        // Imposta lo stile del pennello - aumentato per migliore visibilità
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3; // Aumentato da 2 per miglior visibilità
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Migliora il rendering
        ctx.globalAlpha = 1;

        // Funzione per ottenere le coordinate con migliore precisione
        const getCoordinates = (e) => {
            const rect = canvas.getBoundingClientRect();
            let clientX, clientY;
            
            if (e.touches && e.touches.length > 0) {
                // Touch event
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else if (e.clientX !== undefined) {
                // Mouse event
                clientX = e.clientX;
                clientY = e.clientY;
            } else {
                return null;
            }
            
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        };

        // Funzione per disegnare una linea
        const drawLine = (fromX, fromY, toX, toY) => {
            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(toX, toY);
            ctx.stroke();
        };

        // Eventi mouse
        canvas.addEventListener('pointerdown', (e) => {
            if (e.pointerType !== 'mouse' && e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
            e.preventDefault();
            
            isDrawing = true;
            const coords = getCoordinates(e);
            if (coords) {
                lastX = coords.x;
                lastY = coords.y;
            }
        });

        canvas.addEventListener('pointermove', (e) => {
            if (!isDrawing) return;
            e.preventDefault();
            
            const coords = getCoordinates(e);
            if (coords) {
                drawLine(lastX, lastY, coords.x, coords.y);
                lastX = coords.x;
                lastY = coords.y;
            }
        });

        canvas.addEventListener('pointerup', (e) => {
            if (!isDrawing) return;
            e.preventDefault();
            
            isDrawing = false;
            this.saveSignature(type);
        });

        canvas.addEventListener('pointercancel', (e) => {
            isDrawing = false;
        });

        canvas.addEventListener('pointerleave', (e) => {
            if (isDrawing) {
                isDrawing = false;
            }
        });

        // Aggiungi il listener per i touch fallback per i browser vecchi
        canvas.addEventListener('touchstart', (e) => {
            if (isDrawing) return; // Evita duplicati se pointer events sono supportati
            e.preventDefault();
            
            isDrawing = true;
            const coords = getCoordinates(e);
            if (coords) {
                lastX = coords.x;
                lastY = coords.y;
            }
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            if (!isDrawing) return;
            e.preventDefault();
            
            const coords = getCoordinates(e);
            if (coords) {
                drawLine(lastX, lastY, coords.x, coords.y);
                lastX = coords.x;
                lastY = coords.y;
            }
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            isDrawing = false;
            this.saveSignature(type);
        }, { passive: false });

        // Aggiungi il listener per i mouse fallback
        canvas.addEventListener('mousedown', (e) => {
            if (e.pointerType !== undefined) return; // Se pointer events sono supportati, salta
            e.preventDefault();
            
            isDrawing = true;
            const coords = getCoordinates(e);
            if (coords) {
                lastX = coords.x;
                lastY = coords.y;
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!isDrawing) return;
            e.preventDefault();
            
            const coords = getCoordinates(e);
            if (coords) {
                drawLine(lastX, lastY, coords.x, coords.y);
                lastX = coords.x;
                lastY = coords.y;
            }
        });

        canvas.addEventListener('mouseup', (e) => {
            isDrawing = false;
            this.saveSignature(type);
        });

        canvas.addEventListener('mouseout', (e) => {
            if (isDrawing) {
                isDrawing = false;
            }
        });

        // Salva il contesto per uso futuro
        this.signaturePads[type] = { canvas, ctx };
    },

    /**
     * Salva la firma come base64
     * @param {string} type - Tipo di firma (comodante o comodatario)
     */
    saveSignature(type) {
        const canvas = document.getElementById(`signature-${type}`);
        if (!canvas) return;

        const dataURL = canvas.toDataURL('image/png');
        const input = document.getElementById(`${type}-signature`);
        if (input) {
            input.value = dataURL;
        }
    },

    /**
     * Pulisce la firma
     * @param {string} type - Tipo di firma (comodante o comodatario)
     */
    clearSignature(type) {
        const canvas = document.getElementById(`signature-${type}`);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const input = document.getElementById(`${type}-signature`);
        if (input) {
            input.value = '';
        }
    },

    /**
     * Configura gli event listener
     */
    setupEventListeners() {
        // Form nuovo contratto
        const contractForm = document.getElementById('contract-form');
        if (contractForm) {
            contractForm.addEventListener('submit', this.handleNewContract.bind(this));
        }

        // Form checklist
        const checklistForm = document.getElementById('checklist-form');
        if (checklistForm) {
            checklistForm.addEventListener('submit', this.handleChecklist.bind(this));
        }
    },

    /**
     * Gestisce il login
     * @param {Event} event - Evento del form
     */
    async handleLogin(event) {
        event.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('login-error');

        errorDiv.textContent = '';

        const result = await auth.login(email, password);

        if (!result.success) {
            errorDiv.textContent = 'Errore: ' + result.error + '. Riprova.';
        }
    },

    /**
     * Gestisce il login effettuato (legacy - non più usato)
     * @param {object} user - Utente loggato
     */
    onLogin(user) {
        this.currentUser = user;
        const userEmailEl = document.getElementById('user-email');
        if (userEmailEl) {
            userEmailEl.textContent = user.email;
        }
    },

    /**
     * Gestisce il logout (legacy - non più usato)
     */
    onLogout() {
        this.currentUser = null;
        this.showSection('home');
    },

    /**
     * Mostra una sezione specifica
     * @param {string} section - Nome della sezione
     */
    async showSection(section) {
        // Nasconde tutte le sezioni
        document.querySelectorAll('.section').forEach(el => {
            el.classList.add('hidden');
        });

        // Mostra la sezione richiesta
        const sectionMap = {
            'home': 'home-section',
            'new-contract': 'new-contract-section',
            'checklist': 'checklist-section',
            'contracts': 'contracts-section',
            'contract-detail': 'contract-detail-section'
        };

        const sectionId = sectionMap[section];
        if (sectionId) {
            document.getElementById(sectionId).classList.remove('hidden');
        }

        this.currentSection = section;

        // Carica i dati specifici per ogni sezione
        switch (section) {
            case 'home':
                // Aggiorna le info utente
                if (this.currentUser) {
                    document.getElementById('user-email').textContent = this.currentUser.email;
                }
                break;
            case 'new-contract':
                // Resetta il form
                document.getElementById('contract-form').reset();
                document.getElementById('contract-success').classList.add('hidden');
                break;
            case 'checklist':
                await this.loadContractsForChecklist();
                document.getElementById('checklist-form').reset();
                document.getElementById('checklist-success').classList.add('hidden');
                break;
            case 'contracts':
                await this.loadContracts();
                break;
        }
    },

    /**
     * Gestisce la creazione di un nuovo contratto
     * @param {Event} event - Evento del form
     */
    async handleNewContract(event) {
        event.preventDefault();

        const form = event.target;
        
        // Verifica che entrambe le firme siano state inserite
        const comodanteSignature = form.comodante_signature.value;
        const comodatarioSignature = form.comodatario_signature.value;
        
        if (!comodanteSignature || !comodatarioSignature) {
            alert('Per favore, inserisci entrambe le firme prima di salvare il contratto.');
            return;
        }
        
        // Gestisci il mezzo personalizzato
        let pleModel = form.ple_model.value;
        if (pleModel === 'custom') {
            const customInput = document.getElementById('custom-mezzo-input');
            const customMezzo = customInput.value.trim();
            if (!customMezzo) {
                alert('Per favore, specifica il nome del mezzo personalizzato.');
                customInput.focus();
                return;
            }
            pleModel = customMezzo;
        }
        
        const contract = {
            ple_model: pleModel,
            company: form.company.value,
            address: form.address.value,
            fiscal_code: form.fiscal_code.value,
            start_date: form.start_date.value,
            end_date: form.end_date.value,
            notes: form.notes.value,
            comodante_signature: comodanteSignature,
            comodatario_signature: comodatarioSignature,
            signature_date: new Date().toISOString(),
            status: 'firmato_preliminare'
        };

        const result = await database.createContract(contract);

        if (result.success) {
            const savedContract = result.data;
            const successDiv = document.getElementById('contract-success');
            successDiv.textContent = 'Contratto salvato. Generazione PDF e invio email in corso...';
            successDiv.classList.remove('hidden');

            try {
                // 1. Genera il PDF in base64
                const pdfResult = await pdfGenerator.generateContractPDFAsBase64(savedContract);
                
                if (pdfResult.success) {
                    // 2. Carica il PDF nello Storage per ottenere il link
                    const uploadResult = await database.uploadContractPDF(pdfResult.base64, pdfResult.fileName);
                    const pdfUrl = uploadResult.success ? uploadResult.url : null;
                    
                    // 3. Salva il link nel DB (opzionale ma consigliato)
                    if (pdfUrl) {
                        await database.updateContractSignatures(savedContract.id, { pdf_url: pdfUrl });
                    }

                    // 4. Invia l'email all'indirizzo di notifica configurato
                    const emailData = {
                        to: this.notificationEmail,
                        subject: `Nuovo Contratto PLE Firmato - ${savedContract.company}`,
                        body: `È stato generato un nuovo contratto di comodato d'uso.\n\nAzienda: ${savedContract.company}\nMezzo: ${this.getPleTypeLabel(savedContract.ple_type)}\n\nPuoi scaricare il PDF qui: ${pdfUrl || 'Disponibile nel sistema'}`,
                        attachmentName: pdfResult.fileName,
                        attachmentBase64: pdfResult.base64 // Invia anche l'allegato per comodità
                    };

                    const sendResult = await this.callEdgeFunction('send-email', emailData);
                    if (!sendResult.success) {
                        throw new Error("Errore invio mail: " + sendResult.error);
                    }
                }
                
                successDiv.textContent = 'Contratto creato, firmato e inviato via email con successo!';
                form.reset();
                this.clearSignature('comodante');
                this.clearSignature('comodatario');
                
                setTimeout(() => successDiv.classList.add('hidden'), 5000);
            } catch (err) {
                console.error('Errore post-salvataggio:', err);
                alert('Contratto salvato correttamente, ma si è verificato un errore durante l\'invio dell\'email.');
            }
        } else {
            alert('Errore nella creazione del contratto: ' + result.error);
        }
    },

    /**
     * Carica i contratti per la selezione nella checklist
     */
    async loadContractsForChecklist() {
        const select = document.getElementById('checklist-contract');
        select.innerHTML = '<option value="">Seleziona un contratto</option>';

        const result = await database.getContracts();

        if (result.success && result.data.length > 0) {
            result.data.forEach(contract => {
                const option = document.createElement('option');
                option.value = contract.id;
                option.textContent = `${contract.company} - ${this.formatDate(contract.start_date)}`;
                select.appendChild(option);
            });
        }
    },

    /**
     * Gestisce il salvataggio della checklist
     * @param {Event} event - Evento del form
     */
    async handleChecklist(event) {
        event.preventDefault();

        const form = event.target;
        const contractId = form.contract_id.value;

        // Verifica che tutte le risposte siano state selezionate
        for (let i = 1; i <= 8; i++) {
            const response = form[`response_${i}`].value;
            if (!response) {
                alert(`Seleziona una risposta (Si/No) per la domanda ${i}`);
                return;
            }
        }

        // Carica le foto
        const photos = {};
        for (let i = 1; i <= 8; i++) {
            const photoInput = form[`photo_${i}`];
            if (photoInput && photoInput.files.length > 0) {
                const uploadResult = await database.uploadPhoto(photoInput.files[0]);
                if (uploadResult.success) {
                    photos[`photo_${i}`] = uploadResult.url;
                }
            }
        }

        // Costruisci l'oggetto checklist con le nuove risposte Si/No e le note
        const checklist = {
            contract_id: contractId,
            // Risposte Si/No (true = Si, false = No)
            check_1: form.response_1.value === 'si',
            check_2: form.response_2.value === 'si',
            check_3: form.response_3.value === 'si',
            check_4: form.response_4.value === 'si',
            check_5: form.response_5.value === 'si',
            check_6: form.response_6.value === 'si',
            check_7: form.response_7.value === 'si',
            check_8: form.response_8.value === 'si',
            // Note individuali per ogni domanda
            note_1: form.note_1.value || null,
            note_2: form.note_2.value || null,
            note_3: form.note_3.value || null,
            note_4: form.note_4.value || null,
            note_5: form.note_5.value || null,
            note_6: form.note_6.value || null,
            note_7: form.note_7.value || null,
            note_8: form.note_8.value || null,
            // Foto
            ...photos,
            // Note generali
            notes: form.notes.value
        };

        const result = await database.saveChecklist(checklist);
        const successDiv = document.getElementById('checklist-success');

        if (result.success) {
            successDiv.textContent = 'Checklist salvata con successo!';
            successDiv.classList.remove('hidden');
            form.reset();
            
            // Resetta i pulsanti Si/No
            document.querySelectorAll('.btn-response').forEach(btn => {
                btn.classList.remove('active');
            });
            
            setTimeout(() => {
                successDiv.classList.add('hidden');
            }, 3000);
        } else {
            alert('Errore nel salvataggio della checklist: ' + result.error);
        }
    },

    /**
     * Attiva/disattiva il campo di input per il mezzo personalizzato
     */
    toggleCustomMezzo() {
        const select = document.getElementById('contract-ple-model');
        const customContainer = document.getElementById('custom-mezzo-container');
        const customInput = document.getElementById('custom-mezzo-input');
        
        if (select.value === 'custom') {
            customContainer.classList.remove('hidden');
            customInput.focus();
        } else {
            customContainer.classList.add('hidden');
            customInput.value = '';
        }
    },

    /**
     * Imposta la risposta Si/No per una domanda
     * @param {HTMLElement} button - Pulsante cliccato
     * @param {string} value - Valore ('si' o 'no')
     */
    setResponse(button, value) {
        const inputName = button.getAttribute('data-input');
        const input = document.getElementById(inputName);
        
        // Aggiorna il valore dell'input nascosto
        input.value = value;
        
        // Trova i pulsanti fratelli e rimuovi la classe active
        const parent = button.parentElement;
        parent.querySelectorAll('.btn-response').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Aggiungi la classe active al pulsante cliccato
        button.classList.add('active');
    },

    /**
     * Salva la checklist e poi la invia per email
     */
    /**
     * Scarica il PDF della checklist dal form corrente
     */
    async downloadChecklistPDF() {
        const form = document.getElementById('checklist-form');
        const contractId = form.contract_id.value;

        if (!contractId) {
            alert('Per favore, seleziona un contratto prima di scaricare il PDF.');
            return;
        }

        // Verifica che tutte le risposte siano state selezionate
        for (let i = 1; i <= 8; i++) {
            const response = form[`response_${i}`].value;
            if (!response) {
                alert(`Seleziona una risposta (Si/No) per la domanda ${i}`);
                return;
            }
        }

        try {
            // Recupera i dati del contratto
            const contractResult = await database.getContractById(contractId);
            if (!contractResult.success) {
                throw new Error('Errore nel caricamento dei dati del contratto');
            }
            const contract = contractResult.data;

            // Costruisci l'oggetto checklist dai dati del form
            const checklist = {
                created_at: new Date().toISOString(),
                check_1: form.response_1.value === 'si',
                check_2: form.response_2.value === 'si',
                check_3: form.response_3.value === 'si',
                check_4: form.response_4.value === 'si',
                check_5: form.response_5.value === 'si',
                check_6: form.response_6.value === 'si',
                check_7: form.response_7.value === 'si',
                check_8: form.response_8.value === 'si',
                note_1: form.note_1.value || null,
                note_2: form.note_2.value || null,
                note_3: form.note_3.value || null,
                note_4: form.note_4.value || null,
                note_5: form.note_5.value || null,
                note_6: form.note_6.value || null,
                note_7: form.note_7.value || null,
                note_8: form.note_8.value || null,
                notes: form.notes.value || null
            };

            // Genera il PDF
            const pdfResult = await pdfGenerator.generateChecklistPDFAsBase64(contract, checklist);

            if (pdfResult.success) {
                // Scarica il PDF
                this.downloadBase64PDF(pdfResult.base64, pdfResult.fileName);
                alert('PDF della checklist scaricato con successo!');
            } else {
                throw new Error('Errore nella generazione del PDF');
            }
        } catch (error) {
            console.error('Errore download PDF checklist:', error);
            alert('Errore nella generazione del PDF: ' + error.message);
        }
    },

    /**
     * Scarica un PDF da base64
     * @param {string} base64 - Contenuto del PDF in base64
     * @param {string} fileName - Nome del file
     */
    downloadBase64PDF(base64, fileName) {
        const link = document.createElement('a');
        link.href = 'data:application/pdf;base64,' + base64;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    async sendChecklistFromForm() {
        const form = document.getElementById('checklist-form');
        
        // Verifica che il form sia valido
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Verifica che tutte le risposte siano state selezionate
        for (let i = 1; i <= 8; i++) {
            const response = form[`response_${i}`].value;
            if (!response) {
                alert(`Seleziona una risposta (Si/No) per la domanda ${i}`);
                return;
            }
        }

        // Carica le foto
        const photos = {};
        for (let i = 1; i <= 8; i++) {
            const photoInput = form[`photo_${i}`];
            if (photoInput && photoInput.files.length > 0) {
                const uploadResult = await database.uploadPhoto(photoInput.files[0]);
                if (uploadResult.success) {
                    photos[`photo_${i}`] = uploadResult.url;
                }
            }
        }

        const contractId = form.contract_id.value;

        // Costruisci l'oggetto checklist
        const checklist = {
            contract_id: contractId,
            check_1: form.response_1.value === 'si',
            check_2: form.response_2.value === 'si',
            check_3: form.response_3.value === 'si',
            check_4: form.response_4.value === 'si',
            check_5: form.response_5.value === 'si',
            check_6: form.response_6.value === 'si',
            check_7: form.response_7.value === 'si',
            check_8: form.response_8.value === 'si',
            note_1: form.note_1.value || null,
            note_2: form.note_2.value || null,
            note_3: form.note_3.value || null,
            note_4: form.note_4.value || null,
            note_5: form.note_5.value || null,
            note_6: form.note_6.value || null,
            note_7: form.note_7.value || null,
            note_8: form.note_8.value || null,
            ...photos,
            notes: form.notes.value
        };

        // Salva prima la checklist
        const saveResult = await database.saveChecklist(checklist);
        
        if (saveResult.success) {
            const savedChecklist = saveResult.data;
            
            // Carica i dati del contratto
            const contractResult = await database.getContractById(contractId);
            
            if (contractResult.success) {
                const contract = contractResult.data;
                
                // Prepara i dati per l'email
                const emailData = {
                    to: this.notificationEmail,
                    subject: `Checklist di Verifica PLE - ${contract.company}`,
                    body: this.buildChecklistEmailBody(checklist, contract),
                    checklistData: checklist,
                    contractData: contract
                };

                // Invia l'email
                const sendResult = await this.callEdgeFunction('send-checklist-email', emailData);
                
                if (sendResult.success) {
                    alert('Checklist salvata e inviata per email con successo!');
                    form.reset();
                    document.querySelectorAll('.btn-response').forEach(btn => {
                        btn.classList.remove('active');
                    });
                } else {
                    alert('Checklist salvata, ma errore nell\'invio dell\'email: ' + sendResult.error);
                }
            } else {
                alert('Checklist salvata, ma errore nel caricamento del contratto per l\'email');
            }
        } else {
            alert('Errore nel salvataggio della checklist: ' + saveResult.error);
        }
    },

    /**
     * Costruisce il corpo dell'email per la checklist
     * @param {object} checklist - Dati della checklist
     * @param {object} contract - Dati del contratto
     * @returns {string} - Corpo dell'email
     */
    buildChecklistEmailBody(checklist, contract) {
        const checklistItems = [
            '1. Controllo visivo generale della struttura',
            '2. Verifica funzionamento comandi idraulici',
            '3. Controllo pneumatici e freni',
            '4. Verifica batteria e caricabatteria',
            '5. Controllo cestello e parapetti',
            '6. Verifica sensori di sicurezza',
            '7. Controllo libretto uso e manutenzione',
            '8. Prova di sollevamento a vuoto'
        ];

        let body = `Gentile ${this.notificationEmail},

in allegato trovi la checklist di verifica PLE per il contratto con:

Azienda: ${contract.company}
Mezzo: ${this.getPleTypeLabel(contract.ple_type)}
Periodo: ${this.formatDate(contract.start_date)} - ${this.formatDate(contract.end_date)}

===========================================
CONTROLLI EFFETTUATI:
===========================================
`;

        for (let i = 1; i <= 8; i++) {
            const response = checklist[`check_${i}`] ? 'SI' : 'NO';
            const note = checklist[`note_${i}`] ? ` [Note: ${checklist[`note_${i}`]}]` : '';
            body += `${checklistItems[i-1]}: ${response}${note}\n`;
        }

        if (checklist.notes) {
            body += `\n===========================================
NOTE AGGIUNTIVE:
===========================================\n${checklist.notes}\n`;
        }

        body += `
===========================================
Checklist compilata il: ${new Date().toLocaleString('it-IT')}
===========================================

Cordiali saluti,
Pannelli Termici S.r.l.`;

        return body;
    },

    /**
     * Carica e visualizza la lista dei contratti
     */
    async loadContracts() {
        const container = document.getElementById('contracts-list');
        container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

        const result = await database.getContracts();

        if (result.success) {
            if (result.data.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">📋</div>
                        <p>Non hai ancora creato nessun contratto</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = '';
            result.data.forEach(contract => {
                const card = document.createElement('div');
                card.className = 'contract-card';
                card.onclick = () => this.showContractDetail(contract.id);

                let statusClass = 'status-active';
                let statusText = 'Attivo';
                
                switch(contract.status) {
                    case 'firmato_preliminare':
                        statusClass = 'status-signed';
                        statusText = 'Firmato Preliminare';
                        break;
                    case 'verificato':
                        statusClass = 'status-verified';
                        statusText = 'Verificato';
                        break;
                    case 'rientrato':
                        statusClass = 'status-returned';
                        statusText = 'Rientrato';
                        break;
                    case 'scaduto':
                        statusClass = 'status-expired';
                        statusText = 'Scaduto';
                        break;
                    default:
                        statusClass = 'status-active';
                        statusText = 'Attivo';
                }

                card.innerHTML = `
                    <h3>${this.escapeHtml(contract.company)}</h3>
                    <p class="contract-ple">Mezzo: ${this.getPleTypeLabel(contract.ple_type)}</p>
                    <p class="contract-date">${this.formatDate(contract.start_date)} - ${this.formatDate(contract.end_date)}</p>
                    <span class="contract-status ${statusClass}">${statusText}</span>
                `;

                container.appendChild(card);
            });
        } else {
            container.innerHTML = `
                <div class="error-message">
                    Errore nel caricamento dei contratti: ${result.error}
                </div>
            `;
        }
    },

    /**
     * Mostra i dettagli di un contratto
     * @param {string} contractId - ID del contratto
     */
    async showContractDetail(contractId) {
        const container = document.getElementById('contract-detail-content');
        container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

        this.showSection('contract-detail');

        const result = await database.getContractById(contractId);

        if (result.success) {
            const contract = result.data;
            let statusClass = 'status-active';
            let statusText = 'Attivo';
            
            switch(contract.status) {
                case 'firmato_preliminare':
                    statusClass = 'status-signed';
                    statusText = 'Firmato Preliminare';
                    break;
                case 'verificato':
                    statusClass = 'status-verified';
                    statusText = 'Verificato';
                    break;
                case 'rientrato':
                    statusClass = 'status-returned';
                    statusText = 'Rientrato';
                    break;
                case 'scaduto':
                    statusClass = 'status-expired';
                    statusText = 'Scaduto';
                    break;
                default:
                    statusClass = 'status-active';
                    statusText = 'Attivo';
            }

            container.innerHTML = `
                <h3>${this.escapeHtml(contract.company)}</h3>
                <div class="detail-row">
                    <span class="detail-label">Mezzo</span>
                    <span class="detail-value">${this.getPleTypeLabel(contract.ple_type)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Data Inizio</span>
                    <span class="detail-value">${this.formatDate(contract.start_date)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Data Fine</span>
                    <span class="detail-value">${this.formatDate(contract.end_date)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Indirizzo</span>
                    <span class="detail-value">${this.escapeHtml(contract.address || '-')}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">C.F./P.IVA</span>
                    <span class="detail-value">${this.escapeHtml(contract.fiscal_code || '-')}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Stato</span>
                    <span class="detail-value"><span class="contract-status ${statusClass}">${statusText}</span></span>
                </div>
                ${contract.signature_date ? `
                <div class="detail-row">
                    <span class="detail-label">Data Firma</span>
                    <span class="detail-value">${this.formatDate(contract.signature_date)}</span>
                </div>
                ` : ''}
                ${contract.notes ? `
                <div class="detail-row">
                    <span class="detail-label">Note</span>
                    <span class="detail-value">${this.escapeHtml(contract.notes)}</span>
                </div>
                ` : ''}
                <div class="detail-row">
                    <span class="detail-label">Creato il</span>
                    <span class="detail-value">${this.formatDate(contract.created_at)}</span>
                </div>
            `;

            // Carica le checklist associate
            await this.loadChecklistsForContract(contractId);
            
            // Crea il container per i pulsanti di azione
            const actionButtonsDiv = document.createElement('div');
            actionButtonsDiv.className = 'action-buttons';
            
            // Aggiungi il pulsante per generare il PDF
            const generatePdfBtn = document.createElement('button');
            generatePdfBtn.id = 'generate-pdf-btn';
            generatePdfBtn.className = 'btn btn-primary';
            generatePdfBtn.textContent = '📄 Genera PDF';
            generatePdfBtn.onclick = () => this.generateContractPDF(contractId);
            actionButtonsDiv.appendChild(generatePdfBtn);
            
            // Aggiungi il pulsante per inviare l'email
            const sendEmailBtn = document.createElement('button');
            sendEmailBtn.id = 'send-email-btn';
            sendEmailBtn.className = 'btn btn-primary';
            sendEmailBtn.textContent = '📧 Invia per Email';
            sendEmailBtn.onclick = () => this.sendContractEmail(contractId);
            actionButtonsDiv.appendChild(sendEmailBtn);
            
            // Aggiungi il pulsante per reinvio email (solo se il contratto è firmato o verificato)
            if (contract.status === 'firmato_preliminare' || contract.status === 'verificato' || contract.status === 'rientrato') {
                const resendEmailBtn = document.createElement('button');
                resendEmailBtn.id = 'resend-email-btn';
                resendEmailBtn.className = 'btn btn-success';
                resendEmailBtn.textContent = '🔄 Reinvia Email';
                resendEmailBtn.onclick = () => this.resendContractEmail(contractId);
                actionButtonsDiv.appendChild(resendEmailBtn);
            }
            
            // Aggiungi il pulsante per gestire il rientro (solo se verificato)
            if (contract.status === 'verificato') {
                const returnBtn = document.createElement('button');
                returnBtn.id = 'return-btn';
                returnBtn.className = 'btn btn-warning';
                returnBtn.textContent = '🔄 Gestisci Rientro';
                returnBtn.onclick = () => this.showReturnSection(contractId);
                actionButtonsDiv.appendChild(returnBtn);
            }
            
            // Aggiungi il pulsante per cancellare il contratto
            const deleteBtn = document.createElement('button');
            deleteBtn.id = 'delete-btn';
            deleteBtn.className = 'btn btn-danger';
            deleteBtn.textContent = '🗑️ Annulla e Cancella';
            deleteBtn.onclick = () => this.deleteContract(contractId);
            actionButtonsDiv.appendChild(deleteBtn);
            
            container.appendChild(actionButtonsDiv);
            
            // Aggiungi la sezione per il rientro (nascosta inizialmente)
            const returnSection = document.createElement('div');
            returnSection.id = 'return-section';
            returnSection.className = 'return-section hidden';
            returnSection.innerHTML = `
                <h4>Gestione Rientro Mezzo</h4>
                <p>Firma qui sotto per confermare il rientro del mezzo.</p>
                <div class="signature-container">
                    <label>Firma Rientro</label>
                    <div class="signature-pad-wrapper">
                        <canvas id="signature-return" class="signature-pad" width="400" height="150"></canvas>
                        <div class="signature-buttons">
                            <button type="button" class="btn btn-secondary btn-small" onclick="app.clearSignature('return')">Cancella</button>
                        </div>
                    </div>
                    <input type="hidden" name="return_signature" id="return-signature">
                </div>
                <div class="action-buttons">
                    <button type="button" class="btn btn-primary" onclick="app.confirmReturn('${contractId}')">Conferma Rientro</button>
                    <button type="button" class="btn btn-secondary" onclick="app.hideReturnSection()">Annulla</button>
                </div>
            `;
            container.appendChild(returnSection);
        } else {
            container.innerHTML = `
                <div class="error-message">
                    Errore nel caricamento dei dettagli: ${result.error}
                </div>
            `;
        }
    },

    /**
     * Carica le checklist per un contratto
     * @param {string} contractId - ID del contratto
     */
    async loadChecklistsForContract(contractId) {
        const container = document.getElementById('contract-detail-content');
        
        const result = await database.getChecklistsByContract(contractId);

        if (result.success && result.data.length > 0) {
            const checklistItems = [
                'Controllo visivo generale della struttura',
                'Verifica funzionamento comandi idraulici',
                'Controllo pneumatici e freni',
                'Verifica batteria e caricabatteria',
                'Controllo cestello e parapetti',
                'Verifica sensori di sicurezza',
                'Controllo libretto uso e manutenzione',
                'Prova di sollevamento a vuoto'
            ];

            const checklistHtml = `
                <div style="margin-top: 30px;">
                    <h4>Checklist di Verifica</h4>
                    ${result.data.map(checklist => `
                        <div class="checklist-item" style="margin-top: 15px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
                            <p><strong>Data:</strong> ${this.formatDate(checklist.created_at)}</p>
                            <p><strong>Controlli effettuati:</strong></p>
                            <ul style="margin-left: 20px; margin-top: 5px;">
                                ${[1,2,3,4,5,6,7,8].map(i => `
                                    <li style="margin-bottom: 8px;">
                                        <strong>${i}. ${checklistItems[i-1]}:</strong> 
                                        ${checklist[`check_${i}`] ? 
                                            '<span style="color: var(--success-color);">SI</span>' : 
                                            '<span style="color: var(--danger-color);">NO</span>'}
                                        ${checklist[`note_${i}`] ? 
                                            `<span style="font-style: italic; color: #666;"> - Note: ${this.escapeHtml(checklist[`note_${i}`])}</span>` : 
                                            ''}
                                    </li>
                                `).join('')}
                            </ul>
                            ${checklist.notes ? `<p style="margin-top: 10px;"><strong>Note generali:</strong> ${this.escapeHtml(checklist.notes)}</p>` : ''}
                            <button id="send-checklist-email-btn-${checklist.id}" class="btn btn-primary" style="margin-top: 10px; font-size: 12px;" onclick="app.sendChecklistEmail('${checklist.id}')">📧 Invia Email</button>
                        </div>
                    `).join('')}
                </div>
            `;
            
            container.insertAdjacentHTML('beforeend', checklistHtml);
        }
    },

    /**
     * Formatta una data
     * @param {string} dateString - Data in formato ISO
     * @returns {string} - Data formattata
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
        return labels[type] || type;
    },

    /**
     * Previene XSS
     * @param {string} text - Testo da escapare
     * @returns {string} - Testo escapato
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Invia il contratto per email
     * @param {string} contractId - ID del contratto
     */
    async sendContractEmail(contractId) {
        const btn = document.getElementById('send-email-btn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Invio in corso...';
        }

        try {
            // Carica i dati del contratto
            const result = await database.getContractById(contractId);
            
            if (result.success) {
                const contract = result.data;
                
                // Genera il PDF come base64
                const pdfResult = await pdfGenerator.generateContractPDFAsBase64(contract);
                
                if (pdfResult.success) {
                    // Prepara i dati per l'email
                    const emailData = {
                        to: this.notificationEmail,
                        subject: `Contratto PLE - ${contract.company}`,
                        body: `Gentile ${this.notificationEmail},\n\nin allegato trovi il contratto di comodato d'uso PLE per ${contract.company}.\n\nMezzo: ${this.getPleTypeLabel(contract.ple_type)}\nPeriodo: ${this.formatDate(contract.start_date)} - ${this.formatDate(contract.end_date)}\n\nCordiali saluti,\nPannelli Termici S.r.l.`,
                        attachmentName: pdfResult.fileName,
                        attachmentBase64: pdfResult.base64
                    };

                    // Invia l'email via Edge Function
                    const sendResult = await this.callEdgeFunction('send-email', emailData);
                    
                    if (sendResult.success) {
                        alert('Email inviata con successo!');
                    } else {
                        alert('Errore nell\'invio dell\'email: ' + sendResult.error);
                    }
                } else {
                    alert('Errore nella generazione del PDF');
                }
            } else {
                alert('Errore nel caricamento dei dati del contratto');
            }
        } catch (error) {
            console.error('Errore invio email:', error);
            alert('Errore nell\'invio dell\'email: ' + error.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = '📧 Invia per Email';
            }
        }
    },

    /**
     * Invia la checklist per email
     * @param {string} checklistId - ID della checklist
     */
    async sendChecklistEmail(checklistId) {
        const btn = document.getElementById(`send-checklist-email-btn-${checklistId}`);
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Invio in corso...';
        }

        try {
            // Carica i dati della checklist
            const checklistResult = await database.getChecklistById(checklistId);
            
            if (checklistResult.success) {
                const checklist = checklistResult.data;
                
                // Carica i dati del contratto associato
                const contractResult = await database.getContractById(checklist.contract_id);
                
                if (contractResult.success) {
                    const contract = contractResult.data;
                    
                    const emailBody = this.buildChecklistEmailBody(checklist, contract);
                    
                    // Prepara i dati per l'email della checklist
                    const emailData = {
                        to: this.notificationEmail,
                        subject: `Checklist di Verifica PLE - ${contract.company}`,
                        body: emailBody,
                        checklistData: checklist,
                        contractData: contract
                    };

                    // Invia l'email via Edge Function
                    const sendResult = await this.callEdgeFunction('send-checklist-email', emailData);
                    
                    if (sendResult.success) {
                        alert('Email checklist inviata con successo!');
                    } else {
                        alert('Errore nell\'invio dell\'email: ' + sendResult.error);
                    }
                } else {
                    alert('Errore nel caricamento dei dati del contratto');
                }
            } else {
                alert('Errore nel caricamento della checklist');
            }
        } catch (error) {
            console.error('Errore invio email checklist:', error);
            alert('Errore nell\'invio dell\'email: ' + error.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = '📧 Invia Email';
            }
        }
    },

    /**
     * Chiama una Edge Function di Supabase
     * @param {string} functionName - Nome della funzione
     * @param {object} data - Dati da inviare
     * @returns {Promise<object>} - Risultato
     */
    async callEdgeFunction(functionName, data) {
        try {
            const supabaseKey = window.SB_KEY;

            const { data: sessionData } = await window.supabase.auth.getSession();
            const accessToken = sessionData?.session?.access_token;

            if (!accessToken) {
                return {
                    success: false,
                    error: 'Sessione non valida o scaduta. Effettua di nuovo il login e riprova.'
                };
            }

            const { data: result, error } = await window.supabase.functions.invoke(functionName, {
                body: data,
                headers: {
                    apikey: supabaseKey,
                    Authorization: `Bearer ${accessToken}`
                }
            });

            if (error) {
                const details = error?.context?.error || error?.message || 'Errore chiamata Edge Function';
                return {
                    success: false,
                    error: `Edge Function ${functionName} failed: ${details}`
                };
            }

            return result || { success: false, error: 'Risposta vuota dalla Edge Function' };
        } catch (error) {
            console.error('Errore chiamata Edge Function:', error);
            
            return {
                success: false,
                error: 'Edge Function non disponibile. ' + error.message
            };
        }
    },

    /**
     * Genera il PDF del contratto
     * @param {string} contractId - ID del contratto
     */
    async generateContractPDF(contractId) {
        const btn = document.getElementById('generate-pdf-btn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Generazione PDF...';
        }

        try {
            // Carica i dati del contratto
            const result = await database.getContractById(contractId);
            
            if (result.success) {
                const pdfResult = await pdfGenerator.generateContractPDF(result.data);
                
                if (pdfResult.success) {
                    alert(`PDF generato con successo: ${pdfResult.fileName}`);
                } else {
                    alert('Errore nella generazione del PDF');
                }
            } else {
                alert('Errore nel caricamento dei dati del contratto');
            }
        } catch (error) {
            console.error('Errore generazione PDF:', error);
            alert('Errore nella generazione del PDF: ' + error.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = '📄 Genera PDF';
            }
        }
    },

    /**
     * Mostra la sezione per gestire il rientro
     * @param {string} contractId - ID del contratto
     */
    showReturnSection(contractId) {
        const returnSection = document.getElementById('return-section');
        if (returnSection) {
            returnSection.classList.remove('hidden');
            // Inizializza il pad per la firma di rientro
            this.initSignaturePad('return');
        }
    },

    /**
     * Nasconde la sezione per gestire il rientro
     */
    /**
     * Cancella un contratto
     * @param {string} contractId - ID del contratto da cancellare
     */
    async deleteContract(contractId) {
        const confirmed = confirm('Sei sicuro di voler annullare e cancellare questo contratto? Questa azione non potrà essere annullata.');
        if (!confirmed) {
            return;
        }

        const btn = document.getElementById('delete-btn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Cancellazione in corso...';
        }

        try {
            const result = await database.deleteContract(contractId);

            if (result.success) {
                alert('Contratto cancellato con successo!');
                // Torna alla lista dei contratti
                await this.showSection('contracts');
            } else {
                alert('Errore nella cancellazione del contratto: ' + result.error);
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = '🗑️ Annulla e Cancella';
                }
            }
        } catch (error) {
            console.error('Errore cancellazione contratto:', error);
            alert('Errore nella cancellazione del contratto: ' + error.message);
            if (btn) {
                btn.disabled = false;
                btn.textContent = '🗑️ Annulla e Cancella';
            }
        }
    },

    hideReturnSection() {
        const returnSection = document.getElementById('return-section');
        if (returnSection) {
            returnSection.classList.add('hidden');
            this.clearSignature('return');
        }
    },

    /**
     * Conferma il rientro del mezzo
     * @param {string} contractId - ID del contratto
     */
    async confirmReturn(contractId) {
        const returnSignature = document.getElementById('return-signature').value;
        
        if (!returnSignature) {
            alert('Per favore, inserisci la firma per confermare il rientro.');
            return;
        }

        const btn = document.querySelector('#return-section .btn-primary');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Salvataggio...';
        }

        try {
            const result = await database.updateContractSignatures(contractId, {
                return_signature: returnSignature,
                return_date: new Date().toISOString(),
                status: 'rientrato'
            });

            if (result.success) {
                alert('Rientro confermato con successo!');
                // Ricarica i dettagli del contratto
                await this.showContractDetail(contractId);
            } else {
                alert('Errore nella conferma del rientro: ' + result.error);
            }
        } catch (error) {
            console.error('Errore conferma rientro:', error);
            alert('Errore nella conferma del rientro: ' + error.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Conferma Rientro';
            }
        }
    },

    /**
     * Reinvia il contratto per email
     * @param {string} contractId - ID del contratto
     */
    async resendContractEmail(contractId) {
        const btn = document.getElementById('resend-email-btn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Reinvio in corso...';
        }

        try {
            // Carica i dati del contratto
            const result = await database.getContractById(contractId);
            
            if (result.success) {
                const contract = result.data;
                
                // Genera il PDF come base64
                const pdfResult = await pdfGenerator.generateContractPDFAsBase64(contract);
                
                if (pdfResult.success) {
                    // Prepara i dati per l'email
                    const emailData = {
                        to: this.notificationEmail,
                        subject: `Contratto PLE - ${contract.company} - Aggiornamento`,
                        body: `Gentile ${this.notificationEmail},\n\nin allegato trovi il contratto aggiornato di comodato d'uso PLE per ${contract.company}.\n\nMezzo: ${this.getPleTypeLabel(contract.ple_type)}\nPeriodo: ${this.formatDate(contract.start_date)} - ${this.formatDate(contract.end_date)}\nStato: ${contract.status}\n\nCordiali saluti,\nPannelli Termici S.r.l.`,
                        attachmentName: pdfResult.fileName,
                        attachmentBase64: pdfResult.base64
                    };

                    // Invia l'email via Edge Function
                    const sendResult = await this.callEdgeFunction('send-email', emailData);
                    
                    if (sendResult.success) {
                        alert('Email reinviata con successo!');
                    } else {
                        alert('Errore nel reinvio dell\'email: ' + sendResult.error);
                    }
                } else {
                    alert('Errore nella generazione del PDF');
                }
            } else {
                alert('Errore nel caricamento dei dati del contratto');
            }
        } catch (error) {
            console.error('Errore reinvio email:', error);
            alert('Errore nel reinvio dell\'email: ' + error.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = '🔄 Reinvia Email';
            }
        }
    }
};

// Inizializza l'app quando il DOM e pronto
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Esporta l'app
window.app = app;

// Funzione globale per pulire la firma
window.clearSignature = function(type) {
    app.clearSignature(type);
};