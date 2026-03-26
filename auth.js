/**
 * Modulo di Autenticazione Supabase
 * Gestisce login, logout e verifica stato utente
 */

const auth = {
    /**
     * Inizializza il listener per i cambiamenti di stato di autenticazione
     */
    init() {
        // Ascolta i cambiamenti di stato dell'utente
        supabase.auth.onAuthStateChange((event, session) => {
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
        const { data: { session } } = await supabase.auth.getSession();
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
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                throw error;
            }

            // Login riuscito - il listener onAuthStateChange gestirà il redirect
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
            const { error } = await supabase.auth.signOut();
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
            const { data, error } = await supabase.auth.signUp({
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
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    /**
     * Resetta la password dell'utente
     * @param {string} email - Email dell'utente
     */
    async resetPassword(email) {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
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