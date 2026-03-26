/**
 * App Principale - Gestione PLE
 * Coordina tutte le funzionalita dell'applicazione
 */

const app = {
    currentUser: null,
    currentSection: 'login',

    /**
     * Inizializza l'applicazione
     */
    init() {
        this.setupEventListeners();
        auth.init();
    },

    /**
     * Configura gli event listener
     */
    setupEventListeners() {
        // Form di login
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

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
     * Gestisce il login effettuato
     * @param {object} user - Utente loggato
     */
    onLogin(user) {
        this.currentUser = user;
        document.getElementById('user-email').textContent = user.email;
        this.showSection('home');
    },

    /**
     * Gestisce il logout
     */
    onLogout() {
        this.currentUser = null;
        this.showSection('login');
        
        // Resetta i form
        document.getElementById('login-form').reset();
        document.getElementById('contract-form').reset();
        document.getElementById('checklist-form').reset();
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
            'login': 'login-section',
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
        const contract = {
            user_id: this.currentUser.id,
            ple_model: form.ple_model.value,
            company: form.company.value,
            address: form.address.value,
            fiscal_code: form.fiscal_code.value,
            start_date: form.start_date.value,
            end_date: form.end_date.value,
            notes: form.notes.value
        };

        const result = await database.createContract(contract);
        const successDiv = document.getElementById('contract-success');

        if (result.success) {
            successDiv.textContent = 'Contratto creato con successo!';
            successDiv.classList.remove('hidden');
            form.reset();
            
            // Rimuovi il messaggio dopo 3 secondi
            setTimeout(() => {
                successDiv.classList.add('hidden');
            }, 3000);
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

        const result = await database.getContracts(this.currentUser.id);

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
            user_id: this.currentUser.id,
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
            user_id: this.currentUser.id,
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
                    to: this.currentUser.email,
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

        let body = `Gentile ${this.currentUser.email},

in allegato trovi la checklist di verifica PLE per il contratto con:

Azienda: ${contract.company}
Mezzo: ${this.getPleTypeLabel(contract.ple_model)}
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

        const result = await database.getContracts(this.currentUser.id);

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

                const statusClass = contract.status === 'attivo' ? 'status-active' : 'status-expired';
                const statusText = contract.status === 'attivo' ? 'Attivo' : 
                                   contract.status === 'verificato' ? 'Verificato' : 'Scaduto';

                card.innerHTML = `
                    <h3>${this.escapeHtml(contract.company)}</h3>
                    <p class="contract-ple">Mezzo: ${this.getPleTypeLabel(contract.ple_model)}</p>
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
            const statusClass = contract.status === 'attivo' ? 'status-active' : 'status-expired';
            const statusText = contract.status === 'attivo' ? 'Attivo' : 
                               contract.status === 'verificato' ? 'Verificato' : 'Scaduto';

            container.innerHTML = `
                <h3>${this.escapeHtml(contract.company)}</h3>
                <div class="detail-row">
                    <span class="detail-label">Mezzo</span>
                    <span class="detail-value">${this.getPleTypeLabel(contract.ple_model)}</span>
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
            
            // Aggiungi il pulsante per generare il PDF
            const generatePdfBtn = document.createElement('button');
            generatePdfBtn.id = 'generate-pdf-btn';
            generatePdfBtn.className = 'btn btn-primary';
            generatePdfBtn.textContent = 'Genera PDF';
            generatePdfBtn.style.marginTop = '20px';
            generatePdfBtn.onclick = () => this.generateContractPDF(contractId);
            container.appendChild(generatePdfBtn);
            
            // Aggiungi il pulsante per inviare l'email
            const sendEmailBtn = document.createElement('button');
            sendEmailBtn.id = 'send-email-btn';
            sendEmailBtn.className = 'btn btn-primary';
            sendEmailBtn.textContent = '📧 Invia per Email';
            sendEmailBtn.style.marginTop = '10px';
            sendEmailBtn.style.marginLeft = '10px';
            sendEmailBtn.onclick = () => this.sendContractEmail(contractId);
            container.appendChild(sendEmailBtn);
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
                        to: this.currentUser.email,
                        subject: `Contratto PLE - ${contract.company}`,
                        body: `Gentile ${this.currentUser.email},\n\nin allegato trovi il contratto di comodato d'uso PLE per ${contract.company}.\n\nMezzo: ${this.getPleTypeLabel(contract.ple_model)}\nPeriodo: ${this.formatDate(contract.start_date)} - ${this.formatDate(contract.end_date)}\n\nCordiali saluti,\nPannelli Termici S.r.l.`,
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
                        to: this.currentUser.email,
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
        // URL della Edge Function (da configurare con l'URL effettivo di Supabase)
        // In produzione, sostituire con l'URL effettivo del progetto Supabase
        const supabaseUrl = localStorage.getItem('supabase_url') || 'https://your-project.supabase.co';
        const functionUrl = `${supabaseUrl}/functions/v1/${functionName}`;

        try {
            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('supabase_anon_key') || ''}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Errore chiamata Edge Function:', error);
            
            // Ritorna un risultato simulato per testing locale
            return {
                success: false,
                error: 'Edge Function non disponibile. ' + error.message + '\n\nNota: Per usare le funzioni, configura Supabase con l\'URL e la chiave anonima nella console del browser (localStorage).'
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
                btn.textContent = 'Genera PDF';
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