/**
 * Sistema de Autenticación y Sesión para Instructores / Administradores
 */

const AuthManager = {
    getCredentials() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.ADMIN_CREDS);
            return data ? JSON.parse(data) : { user: "admin", pass: "taekwondo2025", name: "Sabonim Principal" };
        } catch (e) {
            return { user: "admin", pass: "taekwondo2025", name: "Sabonim Principal" };
        }
    },

    isLoggedIn() {
        const session = sessionStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
        if (!session) return false;
        try {
            const data = JSON.parse(session);
            return data && data.authenticated === true;
        } catch (e) {
            return false;
        }
    },

    getCurrentUser() {
        if (!this.isLoggedIn()) return null;
        try {
            return JSON.parse(sessionStorage.getItem(STORAGE_KEYS.AUTH_SESSION));
        } catch (e) {
            return null;
        }
    },

    login(username, password) {
        const creds = this.getCredentials();
        const cleanUser = (username || "").trim().toLowerCase();
        const cleanPass = (password || "").trim();

        if (cleanUser === creds.user.toLowerCase() && cleanPass === creds.pass) {
            const sessionData = {
                authenticated: true,
                user: creds.user,
                name: creds.name || "Sabonim",
                role: "Instructor / Administrador",
                loginTime: new Date().toISOString()
            };
            sessionStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(sessionData));
            return { success: true, user: sessionData };
        } else {
            return { success: false, message: "Usuario o contraseña incorrectos. Revisa tus datos." };
        }
    },

    logout() {
        sessionStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    },

    updatePassword(currentPassword, newPassword, newUsername, newName) {
        const creds = this.getCredentials();
        if (currentPassword !== creds.pass) {
            return { success: false, message: "La contraseña actual no es correcta." };
        }

        if (!newPassword || newPassword.length < 4) {
            return { success: false, message: "La nueva contraseña debe tener al menos 4 caracteres." };
        }

        const updatedCreds = {
            user: newUsername ? newUsername.trim().toLowerCase() : creds.user,
            pass: newPassword.trim(),
            name: newName ? newName.trim() : creds.name
        };

        localStorage.setItem(STORAGE_KEYS.ADMIN_CREDS, JSON.stringify(updatedCreds));
        return { success: true, message: "Credenciales actualizadas exitosamente." };
    }
};
