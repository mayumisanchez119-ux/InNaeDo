/**
 * Sesión de administrador compartida respaldada por Supabase Auth.
 * La interfaz conserva el usuario "Admin"; el correo técnico no se muestra.
 */

const ADMIN_USERNAME = "admin";
const ADMIN_AUTH_EMAIL = "admin@innaedo.local";

const AuthManager = {
    generation: 0,
    refreshPromise: null,
    rememberedKey() { return STORAGE_KEYS.AUTH_SESSION + '_remembered'; },
    clearSession() {
        sessionStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
        localStorage.removeItem(this.rememberedKey());
    },
    storeSession(session) {
        this.clearSession();
        if (session.remember) {
            try {
                localStorage.setItem(this.rememberedKey(), JSON.stringify(session));
                return;
            } catch (_) { session.remember = false; }
        }
        sessionStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
    },
    getCredentials() {
        return { user: "Admin", pass: "", name: "Admin" };
    },

    isLoggedIn() {
        const session = this.getCurrentUser();
        return Boolean(session && session.authenticated && session.accessToken &&
            (!session.expiresAt || session.expiresAt > Date.now()));
    },

    getCurrentUser() {
        try {
            return JSON.parse(sessionStorage.getItem(STORAGE_KEYS.AUTH_SESSION) || localStorage.getItem(this.rememberedKey()));
        } catch (e) {
            return null;
        }
    },

    getAccessToken() {
        const session = this.getCurrentUser();
        return this.isLoggedIn() ? session.accessToken : null;
    },

    async ensureSession() {
        const session = this.getCurrentUser();
        if (!session || !session.authenticated) return false;
        if (session.expiresAt > Date.now() + 60000) return this.isLoggedIn();
        if (!session.refreshToken) return this.isLoggedIn();
        if (this.refreshPromise) return this.refreshPromise;
        const generation = this.generation;
        const refresh = async () => {
            // Otra pestaña puede haber renovado ya el mismo token.
            const current = this.getCurrentUser();
            if (generation !== this.generation || !current) return false;
            if (current.expiresAt > Date.now() + 60000) return this.isLoggedIn();
            try {
                const response = await fetch(SUPABASE_EVENTS_URL + '/auth/v1/token?grant_type=refresh_token', {
                    method: 'POST',
                    headers: { apikey: SUPABASE_EVENTS_KEY, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token: current.refreshToken })
                });
                if (generation !== this.generation) return false;
                if (!response.ok) {
                    if ([400, 401, 403].includes(response.status)) this.clearSession();
                    return this.isLoggedIn();
                }
                const data = await response.json();
                if (generation !== this.generation) return false;
                if (!data.access_token || !data.refresh_token) return false;
                // No reintroducir una sesión eliminada en otra pestaña.
                if (this.getCurrentUser()?.refreshToken !== current.refreshToken) return this.isLoggedIn();
                this.storeSession({ ...current, accessToken: data.access_token, refreshToken: data.refresh_token,
                    expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000 });
                return this.isLoggedIn();
            } catch (_) { return this.isLoggedIn(); }
        };
        this.refreshPromise = (async () => {
            try {
                return typeof navigator !== 'undefined' && navigator.locks
                    ? await navigator.locks.request('innaedo-auth-refresh', refresh) : await refresh();
            } finally { this.refreshPromise = null; }
        })();
        return this.refreshPromise;
    },

    async login(username, password, remember = false) {
        const cleanUser = (username || "").trim().toLowerCase();
        const cleanPass = (password || "").trim();
        if (cleanUser !== ADMIN_USERNAME || !cleanPass) {
            return { success: false, message: "Usuario o contraseña incorrectos." };
        }

        const generation = ++this.generation;
        try {
            const response = await fetch(SUPABASE_EVENTS_URL + "/auth/v1/token?grant_type=password", {
                method: "POST",
                headers: {
                    apikey: SUPABASE_EVENTS_KEY,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email: ADMIN_AUTH_EMAIL, password: cleanPass })
            });
            if (!response.ok) return { success: false, message: "Usuario o contraseña incorrectos." };

            const data = await response.json();
            if (generation !== this.generation || !data.access_token || !data.refresh_token) return { success: false, message: 'Intenta iniciar sesión nuevamente.' };
            const sessionData = {
                remember: Boolean(remember),
                authenticated: true,
                user: "Admin",
                name: "Admin",
                role: "Instructor / Administrador",
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresAt: Date.now() + (Number(data.expires_in || 3600) * 1000),
                loginTime: new Date().toISOString()
            };
            this.storeSession(sessionData);
            return { success: true, user: sessionData };
        } catch (error) {
            console.error("No fue posible iniciar sesión en Supabase", error);
            return { success: false, message: "No fue posible conectar con el servidor. Intenta nuevamente." };
        }
    },

    logout() {
        const token = this.getAccessToken();
        this.generation++;
        this.clearSession();
        if (token) {
            // Solo cierra este dispositivo; no interrumpe al otro profesor.
            fetch(SUPABASE_EVENTS_URL + "/auth/v1/logout?scope=local", {
                method: "POST",
                headers: { apikey: SUPABASE_EVENTS_KEY, Authorization: "Bearer " + token }
            }).catch(() => {});
        }
    },

    async updatePassword(currentPassword, newPassword, newUsername) {
        if ((newUsername || "Admin").trim().toLowerCase() !== ADMIN_USERNAME) {
            return { success: false, message: "El usuario compartido debe mantenerse como Admin." };
        }
        if (!newPassword || newPassword.length < 8) {
            return { success: false, message: "La nueva contraseña debe tener al menos 8 caracteres." };
        }

        const authCheck = await this.login("Admin", currentPassword, Boolean(this.getCurrentUser()?.remember));
        if (!authCheck.success) return { success: false, message: "La contraseña actual no es correcta." };

        try {
            const token = this.getAccessToken();
            const response = await fetch(SUPABASE_EVENTS_URL + "/auth/v1/user", {
                method: "PUT",
                headers: {
                    apikey: SUPABASE_EVENTS_KEY,
                    Authorization: "Bearer " + token,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ password: newPassword.trim() })
            });
            if (!response.ok) throw new Error(await response.text());
            return { success: true, message: "Contraseña actualizada exitosamente." };
        } catch (error) {
            console.error("No fue posible actualizar la contraseña", error);
            return { success: false, message: "No fue posible actualizar la contraseña." };
        }
    }
};
