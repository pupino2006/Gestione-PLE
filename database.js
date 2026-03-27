/**
 * Modulo Database Supabase
 * Gestisce tutte le operazioni CRUD per contratti e checklist
 */

const database = {
    /**
     * Crea un nuovo contratto
     * @param {object} contract - Dati del contratto
     * @returns {object} - Risultato dell'operazione
     */
    async createContract(contract) {
        try {
            // Valida i campi obbligatori
            if (!contract.ple_model || contract.ple_model.trim() === '') {
                throw new Error('Seleziona un mezzo PLE valido');
            }
            if (!contract.company || contract.company.trim() === '') {
                throw new Error('Inserisci la ragione sociale dell\'azienda');
            }
            if (!contract.address || contract.address.trim() === '') {
                throw new Error('Inserisci l\'indirizzo');
            }
            if (!contract.fiscal_code || contract.fiscal_code.trim() === '') {
                throw new Error('Inserisci il Codice Fiscale o Partita IVA');
            }
            if (!contract.start_date) {
                throw new Error('Seleziona la data di inizio');
            }
            if (!contract.end_date) {
                throw new Error('Seleziona la data di fine');
            }

            const { data, error } = await window.supabase
                .from('contracts')
                .insert([
                    {
                        user_id: contract.user_id,
                        company: contract.company.trim(),
                        address: contract.address.trim(),
                        fiscal_code: contract.fiscal_code.trim(),
                        ple_type: contract.ple_model.trim(),
                        start_date: contract.start_date,
                        end_date: contract.end_date,
                        notes: contract.notes ? contract.notes.trim() : null,
                        status: 'attivo',
                        comodante_signature: contract.comodante_signature || null,
                        comodatario_signature: contract.comodatario_signature || null,
                        signature_date: contract.signature_date || null,
                        return_signature: contract.return_signature || null,
                        return_date: contract.return_date || null,
                        created_at: new Date().toISOString()
                    }
                ])
                .select();

            if (error) {
                throw error;
            }

            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Errore creazione contratto:', error.message);
            return { success: false, error: error.message };
        }
    },

    /**
     * Recupera tutti i contratti dell'utente corrente
     * @returns {array} - Lista dei contratti
     */
    async getContracts(userId) {
        try {
            const { data, error } = await window.supabase
                .from('contracts')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Errore recupero contratti:', error.message);
            return { success: false, error: error.message };
        }
    },

    /**
     * Recupera un singolo contratto per ID
     * @param {string} contractId - ID del contratto
     * @returns {object} - Dettagli del contratto
     */
    async getContractById(contractId) {
        try {
            const { data, error } = await window.supabase
                .from('contracts')
                .select('*')
                .eq('id', contractId)
                .single();

            if (error) {
                throw error;
            }

            return { success: true, data: data };
        } catch (error) {
            console.error('Errore recupero contratto:', error.message);
            return { success: false, error: error.message };
        }
    },

    /**
     * Aggiorna uno stato del contratto
     * @param {string} contractId - ID del contratto
     * @param {string} status - Nuovo stato
     * @returns {object} - Risultato dell'operazione
     */
    async updateContractStatus(contractId, status) {
        try {
            const { data, error } = await window.supabase
                .from('contracts')
                .update({ status: status })
                .eq('id', contractId)
                .select();

            if (error) {
                throw error;
            }

            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Errore aggiornamento stato contratto:', error.message);
            return { success: false, error: error.message };
        }
    },

    /**
     * Carica un'immagine su Supabase Storage
     * @param {File} file - File immagine
     * @param {string} folder - Cartella di destinazione
     * @returns {string} - URL dell'immagine caricata
     */
    async uploadPhoto(file, folder = 'checklist_photos') {
        try {
            const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const filePath = `${folder}/${fileName}`;

            const { data, error } = await window.supabase.storage
                .from('ple-photos')
                .upload(filePath, file);

            if (error) {
                throw error;
            }

            // Ottieni l'URL pubblico
            const { data: urlData } = window.supabase.storage
                .from('ple-photos')
                .getPublicUrl(filePath);

            return { success: true, url: urlData.publicUrl };
        } catch (error) {
            console.error('Errore upload foto:', error.message);
            return { success: false, error: error.message };
        }
    },

    /**
     * Salva una checklist di verifica PLE
     * @param {object} checklist - Dati della checklist
     * @returns {object} - Risultato dell'operazione
     */
    async saveChecklist(checklist) {
        try {
            const { data, error } = await window.supabase
                .from('checklists')
                .insert([
                    {
                        user_id: checklist.user_id,
                        contract_id: checklist.contract_id,
                        check_1: checklist.check_1,
                        check_2: checklist.check_2,
                        check_3: checklist.check_3,
                        check_4: checklist.check_4,
                        check_5: checklist.check_5,
                        check_6: checklist.check_6,
                        check_7: checklist.check_7,
                        check_8: checklist.check_8,
                        note_1: checklist.note_1 || null,
                        note_2: checklist.note_2 || null,
                        note_3: checklist.note_3 || null,
                        note_4: checklist.note_4 || null,
                        note_5: checklist.note_5 || null,
                        note_6: checklist.note_6 || null,
                        note_7: checklist.note_7 || null,
                        note_8: checklist.note_8 || null,
                        photo_1: checklist.photo_1 || null,
                        photo_2: checklist.photo_2 || null,
                        photo_3: checklist.photo_3 || null,
                        photo_4: checklist.photo_4 || null,
                        photo_5: checklist.photo_5 || null,
                        photo_6: checklist.photo_6 || null,
                        photo_7: checklist.photo_7 || null,
                        photo_8: checklist.photo_8 || null,
                        notes: checklist.notes || null,
                        created_at: new Date().toISOString()
                    }
                ])
                .select();

            if (error) {
                throw error;
            }

            // Aggiorna lo stato del contratto a "verificato"
            await this.updateContractStatus(checklist.contract_id, 'verificato');

            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Errore salvataggio checklist:', error.message);
            return { success: false, error: error.message };
        }
    },

    /**
     * Recupera tutte le checklist per un contratto
     * @param {string} contractId - ID del contratto
     * @returns {array} - Lista delle checklist
     */
    async getChecklistsByContract(contractId) {
        try {
            const { data, error } = await window.supabase
                .from('checklists')
                .select('*')
                .eq('contract_id', contractId)
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Errore recupero checklist:', error.message);
            return { success: false, error: error.message };
        }
    },

    /**
     * Recupera una checklist specifica
     * @param {string} checklistId - ID della checklist
     * @returns {object} - Dettagli della checklist
     */
    async getChecklistById(checklistId) {
        try {
            const { data, error } = await window.supabase
                .from('checklists')
                .select('*')
                .eq('id', checklistId)
                .single();

            if (error) {
                throw error;
            }

            return { success: true, data: data };
        } catch (error) {
            console.error('Errore recupero checklist:', error.message);
            return { success: false, error: error.message };
        }
    },

    /**
     * Elimina un contratto (soft delete)
     * @param {string} contractId - ID del contratto
     * @returns {object} - Risultato dell'operazione
     */
    async deleteContract(contractId) {
        try {
            const { data, error } = await window.supabase
                .from('contracts')
                .update({ status: 'eliminato' })
                .eq('id', contractId)
                .select();

            if (error) {
                throw error;
            }

            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Errore eliminazione contratto:', error.message);
            return { success: false, error: error.message };
        }
    },

    /**
     * Aggiorna le firme del contratto
     * @param {string} contractId - ID del contratto
     * @param {object} signatures - Dati delle firme
     * @returns {object} - Risultato dell'operazione
     */
    async updateContractSignatures(contractId, signatures) {
        try {
            const { data, error } = await window.supabase
                .from('contracts')
                .update(signatures)
                .eq('id', contractId)
                .select();

            if (error) {
                throw error;
            }

            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Errore aggiornamento firme:', error.message);
            return { success: false, error: error.message };
        }
    }
};

// Esporta il modulo (accessibile globalmente)
window.database = database;
