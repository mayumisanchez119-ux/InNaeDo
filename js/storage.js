/**
 * Gestor de Almacenamiento Local y Operaciones de Asistencia y Eventos - Versión 3
 */

function getColombiaDateString(date = new Date()) { const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date); const values = {}; parts.forEach(({ type, value }) => { values[type] = value; }); return values.year + '-' + values.month + '-' + values.day; }const SUPABASE_EVENTS_URL = 'https://rdrahdwmigktdrgkndky.supabase.co'; const SUPABASE_EVENTS_KEY = 'sb_publishable_RCPM4m8wd3eYd1tZiiSSxA_DIl8op3_'; const STORAGE_KEYS = {
    STUDENTS: "tkd_innaedo_students_v3",
    ATTENDANCE: "tkd_innaedo_attendance_v4",
    EVENTS: "tkd_innaedo_events_v4",
    SETTINGS: "tkd_innaedo_settings_v3",
    AUTH_SESSION: "tkd_innaedo_auth_session_v3",
    ADMIN_CREDS: "tkd_innaedo_admin_creds_v3"
};

const StorageManager = {
    init() {
        if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
            localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
            const initialAttendance = {};
            localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(initialAttendance));
        }
        if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
            localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_EVENTS));
        }
        this.migrateColombiaAttendanceDate();        if (!localStorage.getItem(STORAGE_KEYS.ADMIN_CREDS)) {
            localStorage.setItem(STORAGE_KEYS.ADMIN_CREDS, JSON.stringify({
                user: "admin",
                pass: "taekwondo2025",
                name: "Sabonim Principal"
            }));
        }
    },

    migrateColombiaAttendanceDate() { const colombiaToday = getColombiaDateString(); const utcToday = new Date().toISOString().split('T')[0]; if (colombiaToday === utcToday) return; const records = this.getAllAttendance(); if (!records[utcToday]) return; records[colombiaToday] = { ...records[utcToday], ...(records[colombiaToday] || {}) }; delete records[utcToday]; this.saveAllAttendance(records); },    // --- ALUMNOS ---
    getStudents(onlyActive = false) {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
            const list = data ? JSON.parse(data) : INITIAL_STUDENTS;
            return onlyActive ? list.filter(s => s.active !== false) : list;
        } catch (e) {
            console.error("Error reading students from storage", e);
            return INITIAL_STUDENTS;
        }
    },

    saveStudents(students) {
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    },

    getStudentById(id) {
        const students = this.getStudents();
        return students.find(s => s.id === id) || null;
    },

    addStudent(studentData) {
        const students = this.getStudents();
        const newStudent = {
            id: "stu_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
            name: studentData.name.trim().toUpperCase(),
            group: studentData.group || "Ninguno",
            belt: studentData.belt || "blanco",
            phone: studentData.phone || "",
            active: true,
            createdAt: new Date().toISOString()
        };
        students.push(newStudent);
        this.saveStudents(students);
        return newStudent;
    },

    updateStudent(id, updatedFields) {
        const students = this.getStudents();
        const index = students.findIndex(s => s.id === id);
        if (index !== -1) {
            if (updatedFields.name) updatedFields.name = updatedFields.name.trim().toUpperCase();
            students[index] = { ...students[index], ...updatedFields };
            this.saveStudents(students);
            return students[index];
        }
        return null;
    },

    deleteStudent(id) {
        const students = this.getStudents();
        const filtered = students.filter(s => s.id !== id);
        this.saveStudents(filtered);
    },

    /* Eventos sincronizados */ cloudEventRow(event) { return { id: event.id, title: event.title, event_date: event.date, event_time: event.time, event_type: event.type, location: event.location, description: event.description, allow_rsvp: event.allowRsvp !== false }; }, eventFromCloud(row) { return { id: row.id, title: row.title, date: row.event_date, time: row.event_time, type: row.event_type, location: row.location, description: row.description || '', allowRsvp: row.allow_rsvp !== false, rsvps: {}, createdAt: row.created_at }; }, async saveEventToCloud(event) { try { const response = await fetch(SUPABASE_EVENTS_URL + '/rest/v1/events?on_conflict=id', { method: 'POST', headers: { apikey: SUPABASE_EVENTS_KEY, Authorization: 'Bearer ' + SUPABASE_EVENTS_KEY, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(this.cloudEventRow(event)) }); if (!response.ok) throw new Error(await response.text()); return true; } catch (error) { console.error('No fue posible sincronizar el evento', error); return false; } }, async deleteEventFromCloud(id) { try { const response = await fetch(SUPABASE_EVENTS_URL + '/rest/v1/events?id=eq.' + encodeURIComponent(id), { method: 'DELETE', headers: { apikey: SUPABASE_EVENTS_KEY, Authorization: 'Bearer ' + SUPABASE_EVENTS_KEY } }); return response.ok; } catch (error) { console.error('No fue posible eliminar el evento compartido', error); return false; } }, async syncEventsFromCloud() { try { const headers = { apikey: SUPABASE_EVENTS_KEY, Authorization: 'Bearer ' + SUPABASE_EVENTS_KEY }; let response = await fetch(SUPABASE_EVENTS_URL + '/rest/v1/events?select=*&order=event_date.asc', { headers }); if (!response.ok) throw new Error(await response.text()); let rows = await response.json(); const cloudIds = new Set(rows.map(row => row.id)); const localEvents = this.getEvents(); for (const event of localEvents) { if (!cloudIds.has(event.id)) await this.saveEventToCloud(event); } if (localEvents.some(event => !cloudIds.has(event.id))) { response = await fetch(SUPABASE_EVENTS_URL + '/rest/v1/events?select=*&order=event_date.asc', { headers }); rows = await response.json(); } const events = rows.map(row => this.eventFromCloud(row)); this.saveEvents(events); return events; } catch (error) { console.error('No fue posible cargar los eventos compartidos', error); return this.getEvents(); } },
    getEvents() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
            return data ? JSON.parse(data) : INITIAL_EVENTS;
        } catch (e) {
            console.error("Error reading events from storage", e);
            return INITIAL_EVENTS;
        }
    },

    saveEvents(events) {
        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    },

    getEventById(id) {
        const events = this.getEvents();
        return events.find(e => e.id === id) || null;
    },

    addEvent(eventData) {
        const events = this.getEvents();
        const newEvent = {
            id: "evt_" + Date.now(),
            title: eventData.title.trim(),
            date: eventData.date || getColombiaDateString(),
            time: eventData.time || "06:00 PM",
            type: eventData.type || "evento", // "evento", "aviso", "suspension", "examen", "torneo"
            location: eventData.location || "Sede Principal Dojang",
            description: eventData.description || "",
            allowRsvp: eventData.allowRsvp !== false,
            rsvps: {},
            createdAt: new Date().toISOString()
        };
        events.unshift(newEvent); // Al principio
        this.saveEvents(events);
        this.saveEventToCloud(newEvent); return newEvent;
    },

    updateEvent(id, updatedFields) {
        const events = this.getEvents();
        const idx = events.findIndex(e => e.id === id);
        if (idx !== -1) {
            events[idx] = { ...events[idx], ...updatedFields };
            this.saveEvents(events);
            this.saveEventToCloud(events[idx]); return events[idx];
        }
        return null;
    },

    deleteEvent(id) {
        const events = this.getEvents();
        const filtered = events.filter(e => e.id !== id);
        this.saveEvents(filtered);
    },

    registerEventRsvp(eventId, studentId, status = "si", note = "") {
        const events = this.getEvents();
        const ev = events.find(e => e.id === eventId);
        const student = this.getStudentById(studentId);
        if (!ev || !student) return { success: false, message: "Evento o alumno no encontrado." };

        if (!ev.rsvps) ev.rsvps = {};
        ev.rsvps[studentId] = {
            studentId,
            name: student.name,
            group: student.group,
            belt: student.belt,
            status, // "si" (asistiré), "no" (no podré), "talvez" (tentativo)
            note: note.trim(),
            updatedAt: new Date().toISOString()
        };

        this.saveEvents(events);
        return { success: true, count: Object.keys(ev.rsvps).length };
    },

    exportEventAttendeesCSV(eventId) {
        const ev = this.getEventById(eventId);
        if (!ev) return;
        const rsvps = ev.rsvps || {};
        const entries = Object.values(rsvps);

        let csv = "\uFEFF";
        csv += `REPORTE DE ASISTENCIA A EVENTO: ${ev.title}\n`;
        csv += `Fecha: ${ev.date} - Hora: ${ev.time} - Lugar: ${ev.location}\n\n`;
        csv += "ID Alumno,Nombre Completo,Grupo,Cinturon,Confirmacion,Observaciones / Acompanantes,Fecha Registro\n";

        entries.forEach(r => {
            const beltObj = BELTS.find(b => b.id === r.belt) || { name: r.belt || '' };
            const statusText = r.status === 'si' ? 'Asistirá' : (r.status === 'no' ? 'No asistirá' : 'Tentativo');
            csv += `"${r.studentId}","${r.name}","${r.group || ''}","${beltObj.name}","${statusText}","${r.note || ''}","${r.updatedAt || ''}"\n`;
        });

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `asistentes_${ev.title.replace(/\s+/g, '_')}_${ev.date}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    // --- ASISTENCIAS DIARIAS ---
    getAllAttendance() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error("Error reading attendance from storage", e);
            return {};
        }
    },

    saveAllAttendance(attendanceObj) {
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendanceObj));
    },

    hasAttendanceForDate(dateStr) { return Object.keys(this.getAttendanceForDate(dateStr)).length > 0; },    removeAttendanceForDate(dateStr) { const all = this.getAllAttendance(); delete all[dateStr]; this.saveAllAttendance(all); },    getAttendanceForDate(dateStr) {
        const all = this.getAllAttendance();
        return all[dateStr] || {};
    },

    saveAttendanceForDate(dateStr, dateRecords) {
        const all = this.getAllAttendance();
        all[dateStr] = dateRecords;
        this.saveAllAttendance(all);
    },

    // --- ESTADÍSTICAS Y CÁLCULOS ---
    getStudentStats(studentId) {
        const allAttendance = this.getAllAttendance();
        const dates = Object.keys(allAttendance).sort();
        
        let totalSessions = 0;
        let present = 0;
        let late = 0;
        let excused = 0;
        let absent = 0;
        let lastAttended = null;
        let currentStreak = 0;
        let consecutiveAbsences = 0;

        dates.forEach(date => {
            const dayData = allAttendance[date];
            if (dayData && dayData[studentId]) {
                const record = dayData[studentId];
                totalSessions++;

                if (record.status === "presente" || record.status === "tardanza") {
                    if (record.status === "presente") present++;
                    if (record.status === "tardanza") late++;
                    lastAttended = date;
                    currentStreak++;
                    consecutiveAbsences = 0;
                } else if (record.status === "excusa") {
                    excused++;
                    consecutiveAbsences = 0;
                } else if (record.status === "ausente") {
                    absent++;
                    currentStreak = 0;
                    consecutiveAbsences++;
                }
            }
        });

        const effectivePresents = present + (late * 0.8) + (excused * 0.5);
        const percentage = totalSessions > 0 ? Math.round((effectivePresents / totalSessions) * 100) : 100;

        return {
            totalSessions,
            present,
            late,
            excused,
            absent,
            percentage,
            streak: currentStreak,
            consecutiveAbsences,
            lastAttended
        };
    },

    getTopStudents(limit = 6) {
        const students = this.getStudents(true);
        const listWithStats = students.map(s => {
            const stats = this.getStudentStats(s.id);
            return {
                ...s,
                stats
            };
        });

        listWithStats.sort((a, b) => {
            if (b.stats.percentage !== a.stats.percentage) {
                return b.stats.percentage - a.stats.percentage;
            }
            if (b.stats.streak !== a.stats.streak) {
                return b.stats.streak - a.stats.streak;
            }
            return b.stats.present - a.stats.present;
        });

        return listWithStats.slice(0, limit);
    },

    getGlobalStats() {
        const students = this.getStudents(true);
        const allAttendance = this.getAllAttendance();
        const dates = Object.keys(allAttendance);
        
        let totalPresent = 0;
        let totalAbsent = 0;
        let totalLate = 0;
        let atRiskCount = 0;

        students.forEach(s => {
            const stats = this.getStudentStats(s.id);
            totalPresent += stats.present;
            totalAbsent += stats.absent;
            totalLate += stats.late;
            if (stats.consecutiveAbsences >= 3) {
                atRiskCount++;
            }
        });

        return {
            totalStudents: students.length,
            totalClassesRecorded: dates.length,
            totalPresent,
            totalAbsent,
            totalLate,
            atRiskCount
        };
    },

    // --- EXPORTACIÓN CSV Y RESPALDOS ---
    exportToCSV(filterGroup = "ALL") {
        const students = this.getStudents().filter(s => filterGroup === "ALL" || s.group === filterGroup);
        const allAttendance = this.getAllAttendance();

        let csvContent = "\uFEFF";
        csvContent += "ID,Nombre Completo Alumno,Grupo,Cinturon / Grado,Estado,Total Clases,Asistencias,Tardanzas,Excusas,Faltas,% Asistencia,Racha Actual,Ultima Asistencia\n";

        students.forEach(s => {
            const stats = this.getStudentStats(s.id);
            const beltObj = BELTS.find(b => b.id === s.belt) || { name: s.belt || 'Blanco' };
            const row = [
                `"${s.id}"`,
                `"${s.name}"`,
                `"${s.group}"`,
                `"${beltObj.name}"`,
                `"${s.active !== false ? 'Activo' : 'Inactivo'}"`,
                stats.totalSessions,
                stats.present,
                stats.late,
                stats.excused,
                stats.absent,
                `"${stats.percentage}%"`,
                stats.streak,
                `"${stats.lastAttended || 'Sin registro'}"`
            ];
            csvContent += row.join(",") + "\n";
        });

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        const todayStr = getColombiaDateString();
        link.setAttribute("href", url);
        link.setAttribute("download", `asistencia_innaedo_${filterGroup}_${todayStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    exportBackupJSON() {
        const data = {
            version: "3.0",
            club: "Taekwondo INNAEDO",
            exportedAt: new Date().toISOString(),
            students: this.getStudents(),
            attendance: this.getAllAttendance(),
            events: this.getEvents(),
            groups: INITIAL_GROUPS,
            belts: BELTS
        };

        const jsonString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
        const link = document.createElement("a");
        const todayStr = getColombiaDateString();
        link.setAttribute("href", jsonString);
        link.setAttribute("download", `respaldo_innaedo_tkd_${todayStr}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    importBackupJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.students && Array.isArray(data.students)) {
                this.saveStudents(data.students);
            }
            if (data.attendance && typeof data.attendance === 'object') {
                this.saveAllAttendance(data.attendance);
            }
            if (data.events && Array.isArray(data.events)) {
                this.saveEvents(data.events);
            }
            return { success: true, count: (data.students || []).length };
        } catch (e) {
            console.error("Error importando JSON", e);
            return { success: false, error: e.message };
        }
    },

    resetToInitial() {
        localStorage.removeItem(STORAGE_KEYS.STUDENTS);
        localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
        localStorage.removeItem(STORAGE_KEYS.EVENTS);
        this.init();
    }
};

StorageManager.init();
