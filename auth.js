/**
 * Modulo di Autenticazione Supabase
 * Gestisce login, logout e verifica stato utente
 */

// Debug: verifica Supabase
console.log('Auth.js - window.supabase:', window.supabase);
console.log('Auth.js - window.supabase.auth:', window.supabase?.auth);

const auth = {
    /**
     * Inizializza il listener per i cambiamenti di stato di autenticazione
     */
    init() {
        // Verifica che Supabase sia inizializzato
        if (!window.supabase) {
            console.error('Supabase non inizializzato, riprovo tra 1 secondo...');
            setTimeout(() => this.init(), 1000);
            return;
        }
        
        if (!window.supabase.auth) {
            console.error('Supabase SDK loaded but auth not available');
            return;
        }
        
        console.log('Supabase disponibile:', window.supabase);
        
        // Ascolta i cambiamenti di stato dell'utente
        window.supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state change:', event, session);
            if (event === 'SIGNED_IN' && session) {
                app.onLogin(session.user);
            } else if (event === 'SIGNED_OUT') {
                app.onLogout();
            }
        });

        // Verifica se l'utente è già loggato
        this.checkCurrentUser();
    },

    /**
     * Verifica se l'utente è attualmente loggato
     */
    async checkCurrentUser() {
        const { data: { session } } = await window.supabase.auth.getSession();
        if (session) {
            app.onLogin(session.user);
        } else {
            app.showSection('login');
        }
    },

    /**
     * Effettua il login con email e password
     * @param {string} email - Email dell'utente
     * @param {string} password - Password dell'utente
     */
    async login(email, password) {
        // Attendi che Supabase sia disponibile
        if (!window.supabase) {
            console.error('Supabase non inizializzato, riprovo...');
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        if (!window.supabase || !window.supabase.auth) {
            return { success: false, error: 'Supabase non pronto. Ricarica la pagina.' };
        }
        
        try {
            const { data, error } = await window.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                console.error('Errore Supabase:', error);
                throw error;
            }

            console.log('Login effettuato:', data);
            return { success: true, user: data.user };
        } catch (error) {
            console.error('Errore login:', error.message);
            return { success: false, error: error.message };
        }
    },

    /**
     * Effettua il logout
     */
    async logout() {
        try {
            const { error } = await window.supabase.auth.signOut();
            if (error) {
                throw error;
            }
            // Logout riuscito - il listener onAuthStateChange gestirà il redirect
            return { success: true };
        } catch (error) {
            console.error('Errore logout:', error.message);
            return { success: false, error: error.message };
        }
    },

    /**
     * Registra un nuovo utente
     * @param {string} email - Email dell'utente
     * @param {string} password - Password dell'utente
     */
    async signUp(email, password) {
        try {
            const { data, error } = await window.supabase.auth.signUp({
                email: email,
                password: password
            });

            if (error) {
                throw error;
            }

            return { success: true, data };
        } catch (error) {
            console.error('Errore registrazione:', error.message);
            return { success: false, error: error.message };
        }
    },

    /**
     * Recupera l'utente corrente
     * @returns {object|null} - Utente corrente o null
     */
    async getCurrentUser() {
        const { data: { user } } = await window.supabase.auth.getUser();
        return user;
    },

    /**
     * Resetta la password dell'utente
     * @param {string} email - Email dell'utente
     */
    async resetPassword(email) {
        try {
            const { error } = await window.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin
            });

            if (error) {
                throw error;
            }

            return { success: true };
        } catch (error) {
            console.error('Errore reset password:', error.message);
            return { success: false, error: error.message };
        }
    }
};

// Esporta il modulo (accessibile globalmente)
window.auth = auth;