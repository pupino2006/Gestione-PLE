/**
 * App Principale - Gestione PLE
 * Coordina tutte le funzionalità dell'applicazione
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
            company: form.company.value,
            start_date: form.start_date.value,
            end_date: form.end_date.value,
            ple_type: form.ple_type.value,
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

        const checklist = {
            user_id: this.currentUser.id,
            contract_id: contractId,
            check_1: form.check_1.checked,
            check_2: form.check_2.checked,
            check_3: form.check_3.checked,
            check_4: form.check_4.checked,
            check_5: form.check_5.checked,
            check_6: form.check_6.checked,
            check_7: form.check_7.checked,
            check_8: form.check_8.checked,
            ...photos,
            notes: form.notes.value
        };

        const result = await database.saveChecklist(checklist);
        const successDiv = document.getElementById('checklist-success');

        if (result.success) {
            successDiv.textContent = 'Checklist salvata con successo!';
            successDiv.classList.remove('hidden');
            form.reset();
            
            setTimeout(() => {
                successDiv.classList.add('hidden');
            }, 3000);
        } else {
            alert('Errore nel salvataggio della checklist: ' + result.error);
        }
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
                    <span class="detail-label">Data Inizio</span>
                    <span class="detail-value">${this.formatDate(contract.start_date)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Data Fine</span>
                    <span class="detail-value">${this.formatDate(contract.end_date)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Tipo PLE</span>
                    <span class="detail-value">${this.getPleTypeLabel(contract.ple_type)}</span>
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
            const checklistHtml = `
                <div style="margin-top: 30px;">
                    <h4>Checklist di Verifica</h4>
                    ${result.data.map(checklist => `
                        <div class="checklist-item" style="margin-top: 15px;">
                            <p><strong>Data:</strong> ${this.formatDate(checklist.created_at)}</p>
                            <p><strong>Controlli effettuati:</strong> 
                                ${checklist.check_1 ? '✅ ' : '❌ '}Struttura
                                ${checklist.check_2 ? '✅ ' : '❌ '}Comandi
                                ${checklist.check_3 ? '✅ ' : '❌ '}Freni
                                ${checklist.check_4 ? '✅ ' : '❌ '}Batteria
                                ${checklist.check_5 ? '✅ ' : '❌ '}Cestello
                                ${checklist.check_6 ? '✅ ' : '❌ '}Sensori
                                ${checklist.check_7 ? '✅ ' : '❌ '}Libretto
                                ${checklist.check_8 ? '✅ ' : '❌ '}Prova
                            </p>
                            ${checklist.notes ? `<p><strong>Note:</strong> ${this.escapeHtml(checklist.notes)}</p>` : ''}
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
    }
};

// Inizializza l'app quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Esporta l'app
window.app = app;