/**
 * Sesión de administrador compartida respaldada por Supabase Auth.
 * La interfaz conserva el usuario "Admin"; el correo técnico no se muestra.
 */

const ADMIN_USERNAME = "admin";
const ADMIN_AUTH_EMAIL = "admin@innaedo.local";

const AuthManager = {
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
            return JSON.parse(sessionStorage.getItem(STORAGE_KEYS.AUTH_SESSION));
        } catch (e) {
            return null;
        }
    },

    getAccessToken() {
        const session = this.getCurrentUser();
        return this.isLoggedIn() ? session.accessToken : null;
    },

    async login(username, password) {
        const cleanUser = (username || "").trim().toLowerCase();
        const cleanPass = (password || "").trim();
        if (cleanUser !== ADMIN_USERNAME || !cleanPass) {
            return { success: false, message: "Usuario o contraseña incorrectos." };
        }

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
            const sessionData = {
                authenticated: true,
                user: "Admin",
                name: "Admin",
                role: "Instructor / Administrador",
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresAt: Date.now() + (Number(data.expires_in || 3600) * 1000),
                loginTime: new Date().toISOString()
            };
            sessionStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(sessionData));
            return { success: true, user: sessionData };
        } catch (error) {
            console.error("No fue posible iniciar sesión en Supabase", error);
            return { success: false, message: "No fue posible conectar con el servidor. Intenta nuevamente." };
        }
    },

    logout() {
        const token = this.getAccessToken();
        sessionStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
        if (token) {
            fetch(SUPABASE_EVENTS_URL + "/auth/v1/logout", {
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

        const authCheck = await this.login("Admin", currentPassword);
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
