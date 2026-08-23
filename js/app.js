/**
 * LÓGICA PRINCIPAL DE LA APLICACIÓN - TAEKWONDO INNAEDO
 * Incluye: Control de Asistencia, Eventos & Novedades, RSVP Alumnos, Principios del Dojang
 */

const app = {
    state: {
        currentView: "public",
        currentAdminTab: "attendance",
        attendanceDate: getColombiaDateString(),
        attendanceGroupFilter: "ALL",
        attendanceSearchQuery: "",
        currentDayAttendance: {},
        eventPublicFilter: "ALL",
        selectedEventForRsvp: null
    },

    init() {
        const dateInput = document.getElementById('attendanceDatePicker');
        if (dateInput) {
            dateInput.value = this.state.attendanceDate;
        }

        this.loadDayAttendance(this.state.attendanceDate);

        this.checkAuthStatus();
        this.renderPublicOverview(); this.renderPublicEvents(); StorageManager.syncEventsFromCloud().then(() => { this.renderPublicEvents(); this.renderAdminEventsTable(); }); this.renderPublicGroups();
        this.renderPublicHonorRoll();
        this.renderTenetsAndPrinciples();

        this.renderAdminGroupPills();
        this.renderAttendanceSheet();
        this.renderAdminEventsTable();
        this.renderStudentsCrudTable();
        this.renderReportsTable();
        this.loadSettingsForm();        // La consulta de alumnos es la pantalla de inicio del portal.        setTimeout(() => {            const defaultSection = document.getElementById('consulta');            if (defaultSection) {                window.history.replaceState(null, '', '#consulta');                defaultSection.scrollIntoView({ behavior: 'auto', block: 'start' });            }        }, 150);

        setTimeout(() => { window.history.replaceState(null, '', '#consulta'); this.scrollToSection('consulta'); }, 500);        setTimeout(() => { const section = document.getElementById('consulta'); if (section) { window.history.replaceState(null, '', '#consulta'); section.scrollIntoView({ behavior: 'auto', block: 'start' }); } }, 2200);        document.addEventListener('click', (e) => {
            const searchBox = document.querySelector('.hero-search-box');
            const results = document.getElementById('heroSearchResults');
            if (searchBox && results && !searchBox.contains(e.target)) {
                results.classList.remove('active');
            }
        });
    },

    // ==========================================
    // CONTROL DE AUTENTICACIÓN Y VISTAS
    // ==========================================
    checkAuthStatus() {
        const isLoggedIn = AuthManager.isLoggedIn();
        const btnLogin = document.getElementById('authNavButtons');
        const sessionBadge = document.getElementById('adminNavSession');
        const navAdminName = document.getElementById('navAdminName');

        if (isLoggedIn) {
            const user = AuthManager.getCurrentUser();
            if (btnLogin) btnLogin.style.display = 'none';
            if (sessionBadge) {
                sessionBadge.style.display = 'flex';
                if (navAdminName) navAdminName.textContent = user.name || "Sabonim";
            }
        } else {
            if (btnLogin) btnLogin.style.display = 'block';
            if (sessionBadge) sessionBadge.style.display = 'none';
            if (this.state.currentView === 'admin') {
                this.showSection('public');
            }
        }
    },

    showSection(view) {
        this.state.currentView = view;
        const publicView = document.getElementById('publicView');
        const adminView = document.getElementById('adminView');
        const navPublicMenu = document.getElementById('navPublicMenu');

        if (view === 'admin') {
            if (!AuthManager.isLoggedIn()) {
                this.openLoginModal();
                return;
            }
            if (publicView) publicView.style.display = 'none';
            if (adminView) adminView.style.display = 'block';
            if (navPublicMenu) navPublicMenu.style.display = 'none';
            this.switchAdminTab(this.state.currentAdminTab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            if (publicView) publicView.style.display = 'block';
            if (adminView) adminView.style.display = 'none';
            if (navPublicMenu) navPublicMenu.style.display = 'flex';
            this.renderPublicOverview();
            this.renderPublicEvents();
            this.renderPublicHonorRoll();
        }
    },

    scrollToSection(id) {
        if (this.state.currentView === 'admin') {
            this.showSection('public');
        }
        setTimeout(() => {
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }, 50);
    },

    openLoginModal() {
        const modal = document.getElementById('modalLogin');
        const err = document.getElementById('loginErrorMessage');
        if (err) err.style.display = 'none';
        if (modal) modal.classList.add('active');
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('active');
    },

    fillDemoCredentials() {
        const user = AuthManager.getCredentials();
        document.getElementById('loginUsername').value = user.user;
        document.getElementById('loginPassword').value = user.pass;
    },

    handleLoginSubmit(e) {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const pass = document.getElementById('loginPassword').value;
        const err = document.getElementById('loginErrorMessage');

        const res = AuthManager.login(username, pass);
        if (res.success) {
            this.closeModal('modalLogin');
            this.checkAuthStatus();
            this.showSection('admin');
            this.showToast(`¡Bienvenido Sabonim ${res.user.name}!`, "success");
        } else {
            if (err) {
                err.textContent = res.message;
                err.style.display = 'block';
            }
        }
    },

    logout() {
        AuthManager.logout();
        this.checkAuthStatus();
        this.showSection('public');
        this.showToast("Sesión cerrada correctamente", "info");
    },

    // ==========================================
    // VISTA PÚBLICA: EVENTOS & NOVEDADES
    // ==========================================
    renderPublicEvents() {
        const grid = document.getElementById('publicEventsGrid');
        if (!grid) return;

        let events = StorageManager.getEvents();

        if (this.state.eventPublicFilter !== 'ALL') {
            events = events.filter(e => e.type === this.state.eventPublicFilter);
        }

        const countEl = document.getElementById('publicTotalEvents');
        const adminCountEl = document.getElementById('adminTabEventsCount');
        if (countEl) countEl.textContent = events.length;
        if (adminCountEl) adminCountEl.textContent = StorageManager.getEvents().length;

        if (events.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; padding: 3rem; text-align: center; color: var(--text-muted); background: #FFFFFF; border: 1.5px solid var(--border-color); border-radius: var(--radius-lg);">
                    <i class="fas fa-calendar-times" style="font-size: 2.5rem; margin-bottom: 0.75rem; display: block; color: var(--text-muted);"></i>
                    No hay publicaciones o eventos activos en esta categoría por el momento.
                </div>
            `;
            return;
        }

        const monthNames = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

        grid.innerHTML = events.map(ev => {
            const dateObj = new Date(ev.date + "T12:00:00");
            const dayNum = dateObj.getDate() || ev.date.split('-')[2] || "29";
            const monthText = monthNames[dateObj.getMonth()] || "AGO";

            let badgeClass = "badge-aviso";
            let typeLabel = "Aviso General";
            let typeIcon = "info-circle";

            if (ev.type === "evento") {
                badgeClass = "badge-gala";
                typeLabel = "Evento / Gala";
                typeIcon = "trophy";
            } else if (ev.type === "suspension") {
                badgeClass = "badge-suspension";
                typeLabel = "Suspensión de Clase";
                typeIcon = "exclamation-triangle";
            } else if (ev.type === "torneo") {
                badgeClass = "badge-torneo";
                typeLabel = "Torneo / Competencia";
                typeIcon = "medal";
            } else if (ev.type === "examen") {
                badgeClass = "badge-gala";
                typeLabel = "Examen de Grados";
                typeIcon = "user-ninja";
            }

            const rsvps = ev.rsvps || {};
            const confirmedCount = Object.values(rsvps).filter(r => r.status === "si").length;

            return `
                <div class="event-card">
                    <div class="event-card-top">
                        <div class="event-date-box">
                            <span class="event-date-day">${dayNum}</span>
                            <span class="event-date-month">${monthText}</span>
                        </div>
                        <div class="event-headline-wrap">
                            <span class="event-type-badge ${badgeClass}"><i class="fas fa-${typeIcon}"></i> ${typeLabel}</span>
                            <h3 class="event-card-title">${ev.title}</h3>
                            <div class="event-meta-info">
                                <span><i class="fas fa-clock text-red"></i> ${ev.time}</span>
                                <span><i class="fas fa-map-marker-alt text-blue"></i> ${ev.location}</span>
                            </div>
                        </div>
                    </div>

                    <div class="event-card-body">
                        <p class="event-desc-text">${ev.description}</p>
                        
                        <div class="event-card-footer">
                            <div class="event-rsvp-counter">
                                <i class="fas fa-user-check"></i>
                                <span>${confirmedCount} Confirmados</span>
                            </div>

                            ${ev.allowRsvp ? `
                                <button class="btn btn-primary btn-sm" onclick="app.openEventRsvpModal('${ev.id}')">
                                    <i class="fas fa-clipboard-check"></i> Confirmar Asistencia
                                </button>
                            ` : `
                                <span class="member-chip"><i class="fas fa-info-circle"></i> Solo Informativo</span>
                            `}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    filterPublicEvents(type, btnElement) {
        this.state.eventPublicFilter = type;
        document.querySelectorAll('.event-filter-btn').forEach(b => b.classList.remove('active'));
        if (btnElement) btnElement.classList.add('active');
        this.renderPublicEvents();
    },

    // Modal RSVP Alumno
    openEventRsvpModal(eventId) {
        const ev = StorageManager.getEventById(eventId);
        if (!ev) return;
        this.state.selectedEventForRsvp = ev;

        document.getElementById('rsvpEventId').value = ev.id;
        document.getElementById('rsvpModalEventTitle').textContent = ev.title;
        document.getElementById('rsvpModalEventDetails').textContent = `${ev.date} • ${ev.time} • ${ev.location}`;
        document.getElementById('rsvpNote').value = '';

        // Rellenar select con todos los alumnos activos
        const students = StorageManager.getStudents(true);
        const select = document.getElementById('rsvpStudentSelect');
        select.innerHTML = `<option value="" disabled selected>-- Elige tu nombre de la lista --</option>` +
            students.map(s => {
                const belt = this.getBeltData(s.belt);
                return `<option value="${s.id}">${s.name} (${s.group} - ${belt.name.split('(')[0]})</option>`;
            }).join('');

        this.renderRsvpAttendeesList(ev);
        document.getElementById('modalEventRsvp').classList.add('active');
    },

    renderRsvpAttendeesList(ev) {
        const container = document.getElementById('rsvpCurrentListContainer');
        if (!container) return;
        const rsvps = ev.rsvps || {};
        const entries = Object.values(rsvps);

        if (entries.length === 0) {
            container.innerHTML = `<span class="text-muted text-xs">Sé el primero en confirmar tu asistencia.</span>`;
            return;
        }

        container.innerHTML = entries.map(r => {
            const isYes = r.status === "si";
            return `
                <span class="attendee-chip ${isYes ? 'pill-green' : 'pill-yellow'}" title="${r.note ? r.note : ''}">
                    <i class="fas fa-${isYes ? 'check' : 'clock'}"></i>
                    <b>${r.name.split(' ')[0]} ${r.name.split(' ')[1] || ''}</b>
                    ${r.note ? `<small>(${r.note})</small>` : ''}
                </span>
            `;
        }).join('');
    },

    handleSaveRsvp(e) {
        e.preventDefault();
        const eventId = document.getElementById('rsvpEventId').value;
        const studentId = document.getElementById('rsvpStudentSelect').value;
        const status = document.querySelector('input[name="rsvpStatus"]:checked')?.value || 'si';
        const note = document.getElementById('rsvpNote').value;

        if (!studentId) {
            this.showToast("Por favor selecciona tu nombre de la lista.", "error");
            return;
        }

        const res = StorageManager.registerEventRsvp(eventId, studentId, status, note);
        if (res.success) {
            const student = StorageManager.getStudentById(studentId);
            this.showToast(`¡Confirmación guardada para ${student.name.split(' ')[0]}!`, "success");
            this.closeModal('modalEventRsvp');
            this.renderPublicEvents();
            this.renderAdminEventsTable();
        } else {
            this.showToast(res.message, "error");
        }
    },

    // ==========================================
    // SECCIÓN PRINCIPIOS (TKD & DOJANG)
    // ==========================================
    renderTenetsAndPrinciples() {
        // 5 Principios del Taekwondo
        const tkdContainer = document.getElementById('tenetsGridContainer');
        if (tkdContainer) {
            tkdContainer.innerHTML = TENETS_TKD.map(t => `
                <div class="tenet-item">
                    <span class="tenet-num">${t.num}</span>
                    <h4>${t.name}</h4>
                    <span class="tenet-korean-subtitle">${t.korean}</span>
                    <p>${t.desc}</p>
                </div>
            `).join('');
        }

        // 6 Principios del Dojang INNAEDO
        const dojangContainer = document.getElementById('dojangPrinciplesContainer');
        if (dojangContainer) {
            dojangContainer.innerHTML = DOJANG_PRINCIPLES.map(dp => `
                <div class="dojang-principle-card">
                    <div class="principle-icon-wrap">
                        <i class="fas fa-${dp.icon}"></i>
                    </div>
                    <h4>${dp.name}</h4>
                    <p>${dp.desc}</p>
                </div>
            `).join('');
        }
    },

    // ==========================================
    // VISTA PÚBLICA & CONSULTA DE ALUMNOS
    // ==========================================
    renderPublicOverview() {
        const stats = StorageManager.getGlobalStats();
        const elTotalStudents = document.getElementById('publicTotalStudents');
        const elTotalGroups = document.getElementById('publicTotalGroups');
        const elAttendance = document.getElementById('publicGlobalAttendance');
        const tabCount = document.getElementById('adminTabStudentCount');

        if (elTotalStudents) elTotalStudents.textContent = stats.totalStudents;
        if (elTotalGroups) elTotalGroups.textContent = INITIAL_GROUPS.length;
        if (tabCount) tabCount.textContent = stats.totalStudents;

        const totalEff = stats.totalPresent + (stats.totalLate * 0.8);
        const totalSes = (stats.totalPresent + stats.totalAbsent + stats.totalLate);
        const avg = totalSes > 0 ? Math.round((totalEff / totalSes) * 100) : 0;
        if (elAttendance) elAttendance.textContent = `${avg}%`;
    },

    handlePublicSearch(query) {
        const resultsBox = document.getElementById('heroSearchResults');
        const btnClear = document.getElementById('btnClearHeroSearch');
        const cleanQuery = query.trim().toUpperCase();

        if (cleanQuery.length === 0) {
            resultsBox.classList.remove('active');
            resultsBox.innerHTML = '';
            if (btnClear) btnClear.style.display = 'none';
            return;
        }

        if (btnClear) btnClear.style.display = 'block';
        const students = StorageManager.getStudents(true);
        const matches = students.filter(s => s.name.toUpperCase().includes(cleanQuery));

        if (matches.length === 0) {
            resultsBox.innerHTML = `<div class="search-result-item" style="color: var(--text-muted); cursor: default;">No se encontraron alumnos con "${query}"</div>`;
        } else {
            resultsBox.innerHTML = matches.slice(0, 8).map(s => {
                const stats = StorageManager.getStudentStats(s.id);
                const belt = this.getBeltData(s.belt);
                return `
                    <div class="search-result-item" onclick="app.selectStudentFromSearch('${s.id}')">
                        <div class="search-res-info">
                            <div class="res-avatar" style="border: 2px solid ${belt.border || belt.color};">${s.name.charAt(0)}</div>
                            <div>
                                <div class="res-name">${s.name}</div>
                                <div class="res-group"><i class="fas fa-layer-group"></i> ${s.group} • <b>${belt.name}</b></div>
                            </div>
                        </div>
                        <div class="res-pct-badge" style="background: ${stats.percentage >= 80 ? '#ECFDF5' : '#FEF3C7'}; color: ${stats.percentage >= 80 ? '#059669' : '#D97706'}; border: 1px solid ${stats.percentage >= 80 ? '#A7F3D0' : '#FDE68A'};">
                            ${stats.percentage}% Asistencia
                        </div>
                    </div>
                `;
            }).join('');
        }
        resultsBox.classList.add('active');
    },

    clearPublicSearch() {
        const input = document.getElementById('publicHeroSearchInput');
        if (input) input.value = '';
        this.handlePublicSearch('');
    },

    selectStudentFromSearch(studentId) {
        document.getElementById('heroSearchResults').classList.remove('active');
        const lookupInput = document.getElementById('studentLookupInput');
        const student = StorageManager.getStudentById(studentId);
        if (student && lookupInput) {
            lookupInput.value = student.name;
            this.renderStudentPublicCard(studentId);
            this.scrollToSection('consulta');
        }
    },

    handleLookupInput(query) {
        const clean = query.trim().toUpperCase();
        if (clean.length < 2) {
            document.getElementById('studentLookupResult').innerHTML = `
                <div class="empty-lookup-state">
                    <i class="fas fa-user-check martial-pulse-icon"></i>
                    <p>Escribe tu nombre en el buscador superior para ver tu historial de asistencia.</p>
                </div>
            `;
            return;
        }

        const students = StorageManager.getStudents(true);
        const match = students.find(s => s.name.toUpperCase().includes(clean));
        if (match) {
            this.renderStudentPublicCard(match.id);
        } else {
            document.getElementById('studentLookupResult').innerHTML = `
                <div class="empty-lookup-state">
                    <i class="fas fa-search-minus" style="font-size: 2.5rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <p>No encontramos ningún alumno que coincida con "<b>${query}</b>". Verifica el nombre o consulta con el Sabonim.</p>
                </div>
            `;
        }
    },

    renderStudentPublicCard(studentId) {
        const student = StorageManager.getStudentById(studentId);
        if (!student) return;
        const stats = StorageManager.getStudentStats(studentId);
        const belt = this.getBeltData(student.belt);
        const container = document.getElementById('studentLookupResult');

        const allAtt = StorageManager.getAllAttendance();
        const dates = Object.keys(allAtt).sort().reverse().slice(0, 8);

        const historyBadges = dates.map(d => {
            const rec = allAtt[d] && allAtt[d][studentId];
            if (!rec) return '';
            const statusClass = rec.status;
            const statusLetter = statusClass === 'presente' ? 'P' : (statusClass === 'ausente' ? 'A' : (statusClass === 'tardanza' ? 'T' : 'E'));
            const dateShort = d.split('-').slice(1).join('/');
            return `
                <div class="day-badge ${statusClass}" title="${d}: ${rec.status} ${rec.note ? '(' + rec.note + ')' : ''}">
                    <span>${dateShort}</span>
                    <b>${statusLetter}</b>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="student-detail-profile">
                <div class="student-card-left">
                    <div class="student-large-avatar" style="border: 3px solid ${belt.border || belt.color};">${student.name.charAt(0)}</div>
                    <h3 class="student-name-big">${student.name}</h3>
                    <span class="student-group-tag"><i class="fas fa-users"></i> ${student.group}</span>
                    <div class="belt-display-badge" style="background: ${belt.badgeBg || belt.color}; color: ${belt.textColor || '#0F172A'}; border: 1.5px solid ${belt.border || '#CBD5E1'};">
                        <i class="fas fa-medal" style="color: ${belt.border || belt.color};"></i> ${belt.name}
                    </div>
                    <div class="text-gold font-bold" style="font-size: 0.85rem;">
                        <i class="fas fa-shield-alt"></i> Espíritu Indomable
                    </div>
                </div>

                <div class="student-card-right">
                    <div class="student-metrics-grid">
                        <div class="metric-mini-box">
                            <span class="metric-mini-val text-green">${stats.percentage}%</span>
                            <span class="metric-mini-label">Compromiso</span>
                        </div>
                        <div class="metric-mini-box">
                            <span class="metric-mini-val text-gold">${stats.streak} 🔥</span>
                            <span class="metric-mini-label">Racha Clases</span>
                        </div>
                        <div class="metric-mini-box">
                            <span class="metric-mini-val">${stats.present}</span>
                            <span class="metric-mini-label">Asistencias</span>
                        </div>
                        <div class="metric-mini-box">
                            <span class="metric-mini-val text-red">${stats.absent}</span>
                            <span class="metric-mini-label">Inasistencias</span>
                        </div>
                    </div>

                    <div class="student-history-timeline">
                        <div class="timeline-title"><i class="fas fa-history"></i> Últimas Sesiones Registradas:</div>
                        <div class="timeline-days-list">
                            ${historyBadges || '<span class="text-muted text-sm">Sin registros recientes de asistencia</span>'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderPublicGroups() {
        const grid = document.getElementById('publicGroupsGrid');
        if (!grid) return;
        const students = StorageManager.getStudents(true);

        grid.innerHTML = INITIAL_GROUPS.map(grp => {
            const groupStudents = students.filter(s => s.group === grp.id);
            const previewChips = groupStudents.slice(0, 5).map(s => `<span class="member-chip">${s.name.split(' ')[0]}</span>`).join('');
            const remainingCount = groupStudents.length > 5 ? `+${groupStudents.length - 5}` : '';

            return `
                <div class="group-card">
                    <div class="group-card-header">
                        <div class="group-card-icon"><i class="fas fa-${grp.icon}"></i></div>
                        <div>
                            <h3 class="group-card-title">${grp.name}</h3>
                            <span class="group-card-count">${groupStudents.length} Alumnos Activos</span>
                        </div>
                    </div>
                    <p class="group-card-desc">${grp.description}</p>
                    <div class="group-members-preview">
                        ${previewChips}
                        ${remainingCount ? `<span class="member-chip" style="background: var(--innaedo-red-light); color: var(--innaedo-red); font-weight: 800;">${remainingCount} más</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    },

    renderPublicHonorRoll() {
        const grid = document.getElementById('honorRollGrid');
        if (!grid) return;
        const top = StorageManager.getTopStudents(6);

        grid.innerHTML = top.map((st, idx) => {
            const rank = idx + 1;
            const belt = this.getBeltData(st.belt);
            return `
                <div class="honor-card rank-${rank}">
                    <div class="honor-medal">
                        ${rank === 1 ? '<i class="fas fa-crown"></i>' : '#' + rank}
                    </div>
                    <div class="honor-avatar" style="border-color: ${belt.border || belt.color};">${st.name.charAt(0)}</div>
                    <h4 class="honor-name">${st.name}</h4>
                    <span class="honor-group">${st.group} • ${belt.name.split('(')[0]}</span>
                    
                    <div class="honor-stats">
                        <div class="h-stat">
                            <span class="h-val text-green">${st.stats.percentage}%</span>
                            <span class="h-lbl">Asistencia</span>
                        </div>
                        <div class="h-stat">
                            <span class="h-val text-gold">${st.stats.streak} 🔥</span>
                            <span class="h-lbl">Racha</span>
                        </div>
                        <div class="h-stat">
                            <span class="h-val">${st.stats.present}</span>
                            <span class="h-lbl">Clases</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    // ==========================================
    // PANEL ADMINISTRATIVO: PESTAÑAS & TOMA DE ASISTENCIA
    // ==========================================
    switchAdminTab(tabName) {
        this.state.currentAdminTab = tabName;
        
        document.querySelectorAll('.admin-tab').forEach(b => {
            b.classList.toggle('active', b.dataset.tab === tabName);
        });

        document.querySelectorAll('.admin-tab-pane').forEach(p => {
            p.classList.remove('active');
        });

        if (tabName === 'attendance') {
            document.getElementById('adminTabAttendance').classList.add('active');
            this.renderAttendanceSheet();
        } else if (tabName === 'events') {
            document.getElementById('adminTabEvents').classList.add('active');
            this.renderAdminEventsTable();
        } else if (tabName === 'students') {
            document.getElementById('adminTabStudents').classList.add('active');
            this.renderStudentsCrudTable();
        } else if (tabName === 'reports') {
            document.getElementById('adminTabReports').classList.add('active');
            this.renderReportsTable();
        } else if (tabName === 'settings') {
            document.getElementById('adminTabSettings').classList.add('active');
            this.loadSettingsForm();        // La consulta de alumnos es la pantalla de inicio del portal.        setTimeout(() => {            const defaultSection = document.getElementById('consulta');            if (defaultSection) {                window.history.replaceState(null, '', '#consulta');                defaultSection.scrollIntoView({ behavior: 'auto', block: 'start' });            }        }, 150);
        }
    },

    loadDayAttendance(dateStr) {
        this.state.attendanceDate = dateStr;
        this.state.currentDayAttendance = StorageManager.getAttendanceForDate(dateStr) || {};
    },

    handleDateChange(newDate) {
        if (!newDate) return;
        this.loadDayAttendance(newDate);
        this.renderAttendanceSheet();
        this.showToast(`Cargando lista para: ${newDate}`, "info");
    },

    changeAttendanceDate(deltaDays) {
        const curr = new Date(this.state.attendanceDate + "T12:00:00");
        curr.setDate(curr.getDate() + deltaDays);
        const dateStr = getColombiaDateString(curr);
        document.getElementById('attendanceDatePicker').value = dateStr;
        this.handleDateChange(dateStr);
    },

    setAttendanceDateToday() {
        const todayStr = getColombiaDateString();
        document.getElementById('attendanceDatePicker').value = todayStr;
        this.handleDateChange(todayStr);
    },

    renderAdminGroupPills() {
        const container = document.getElementById('adminGroupFilterPills');
        if (!container) return;
        const students = StorageManager.getStudents(true);

        let pillsHtml = `
            <button class="group-pill active" onclick="app.setAttendanceGroupFilter('ALL', this)">
                Todos (${students.length})
            </button>
        `;

        INITIAL_GROUPS.forEach(grp => {
            const count = students.filter(s => s.group === grp.id).length;
            pillsHtml += `
                <button class="group-pill" onclick="app.setAttendanceGroupFilter('${grp.id}', this)">
                    ${grp.name} (${count})
                </button>
            `;
        });

        container.innerHTML = pillsHtml;
    },

    setAttendanceGroupFilter(groupId, btnElement) {
        this.state.attendanceGroupFilter = groupId;
        document.querySelectorAll('.group-pill').forEach(p => p.classList.remove('active'));
        if (btnElement) btnElement.classList.add('active');
        this.renderAttendanceSheet();
    },

    filterAttendanceStudents(query) {
        this.state.attendanceSearchQuery = query.trim().toUpperCase();
        this.renderAttendanceSheet();
    },

    renderAttendanceSheet() {
        const listContainer = document.getElementById('attendanceSheetList');
        if (!listContainer) return;

        let students = StorageManager.getStudents(true);

        if (this.state.attendanceGroupFilter !== 'ALL') {
            students = students.filter(s => s.group === this.state.attendanceGroupFilter);
        }

        if (this.state.attendanceSearchQuery) {
            students = students.filter(s => s.name.toUpperCase().includes(this.state.attendanceSearchQuery));
        }

        if (students.length === 0) {
            listContainer.innerHTML = `
                <div style="padding: 2.5rem; text-align: center; color: var(--text-muted);">
                    <i class="fas fa-user-slash" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
                    No se encontraron alumnos para los filtros seleccionados.
                </div>
            `;
            this.updateLiveAttendanceCounters();
            return;
        }

        listContainer.innerHTML = students.map(student => {
            const record = this.state.currentDayAttendance[student.id] || { status: "presente", note: "" };
            const belt = this.getBeltData(student.belt);

            return `
                <div class="attendance-row" id="att_row_${student.id}">
                    <div class="row-student-info">
                        <div class="mini-avatar" style="border: 2px solid ${belt.border || belt.color};">${student.name.charAt(0)}</div>
                        <div>
                            <div class="student-meta-name">${student.name}</div>
                            <span class="belt-pill-mini" style="background: ${belt.badgeBg || belt.color}; color: ${belt.textColor || '#0F172A'}; border: 1px solid ${belt.border || '#CBD5E1'};">
                                ${belt.name}
                            </span>
                        </div>
                    </div>

                    <div>
                        <span class="member-chip"><i class="fas fa-layer-group"></i> ${student.group}</span>
                    </div>

                    <div class="attendance-status-toggles">
                        <button class="status-btn presente ${record.status === 'presente' ? 'active' : ''}" 
                                onclick="app.setStudentAttendanceStatus('${student.id}', 'presente')" title="Presente">
                            <i class="fas fa-check"></i> P
                        </button>
                        <button class="status-btn ausente ${record.status === 'ausente' ? 'active' : ''}" 
                                onclick="app.setStudentAttendanceStatus('${student.id}', 'ausente')" title="Ausente">
                            <i class="fas fa-times"></i> A
                        </button>
                        <button class="status-btn tardanza ${record.status === 'tardanza' ? 'active' : ''}" 
                                onclick="app.setStudentAttendanceStatus('${student.id}', 'tardanza')" title="Tardanza">
                            <i class="fas fa-clock"></i> T
                        </button>
                        <button class="status-btn excusa ${record.status === 'excusa' ? 'active' : ''}" 
                                onclick="app.setStudentAttendanceStatus('${student.id}', 'excusa')" title="Excusa / Permiso">
                            <i class="fas fa-file-medical"></i> E
                        </button>
                    </div>

                    <div>
                        <input type="text" class="attendance-note-input" placeholder="Observación (ej. lesión, combate...)" 
                               value="${record.note || ''}" 
                               onchange="app.setStudentAttendanceNote('${student.id}', this.value)">
                    </div>
                </div>
            `;
        }).join('');

        this.updateLiveAttendanceCounters();
    },

    setStudentAttendanceStatus(studentId, status) {
        if (!this.state.currentDayAttendance[studentId]) {
            this.state.currentDayAttendance[studentId] = { status: "presente", note: "" };
        }
        this.state.currentDayAttendance[studentId].status = status;
        this.state.currentDayAttendance[studentId].updatedAt = new Date().toISOString();

        const row = document.getElementById(`att_row_${studentId}`);
        if (row) {
            const btns = row.querySelectorAll('.status-btn');
            btns.forEach(b => {
                b.classList.remove('active');
                if (b.classList.contains(status)) {
                    b.classList.add('active');
                }
            });
        }

        StorageManager.saveAttendanceForDate(this.state.attendanceDate, this.state.currentDayAttendance);
        this.updateLiveAttendanceCounters();
    },

    setStudentAttendanceNote(studentId, note) {
        if (!this.state.currentDayAttendance[studentId]) {
            this.state.currentDayAttendance[studentId] = { status: "presente", note: "" };
        }
        this.state.currentDayAttendance[studentId].note = note.trim();
        StorageManager.saveAttendanceForDate(this.state.attendanceDate, this.state.currentDayAttendance);
    },

    markAllCurrentGroup(status) {
        let students = StorageManager.getStudents(true);
        if (this.state.attendanceGroupFilter !== 'ALL') {
            students = students.filter(s => s.group === this.state.attendanceGroupFilter);
        }

        students.forEach(s => {
            if (!this.state.currentDayAttendance[s.id]) {
                this.state.currentDayAttendance[s.id] = { status: "presente", note: "" };
            }
            this.state.currentDayAttendance[s.id].status = status;
        });

        StorageManager.saveAttendanceForDate(this.state.attendanceDate, this.state.currentDayAttendance);
        this.renderAttendanceSheet();
        this.showToast(`Marcados todos como "${status.toUpperCase()}"`, "success");
    },

    updateLiveAttendanceCounters() {
        const students = StorageManager.getStudents(true);
        let present = 0, absent = 0, late = 0, excused = 0;

        students.forEach(s => {
            const rec = this.state.currentDayAttendance[s.id];
            const status = rec ? rec.status : 'presente';
            if (status === 'presente') present++;
            else if (status === 'ausente') absent++;
            else if (status === 'tardanza') late++;
            else if (status === 'excusa') excused++;
        });

        const elP = document.getElementById('dayCountPresent');
        const elA = document.getElementById('dayCountAbsent');
        const elL = document.getElementById('dayCountLate');
        const elE = document.getElementById('dayCountExcused');

        if (elP) elP.textContent = present;
        if (elA) elA.textContent = absent;
        if (elL) elL.textContent = late;
        if (elE) elE.textContent = excused;
    },

    saveCurrentAttendanceToast() {
        StorageManager.saveAttendanceForDate(this.state.attendanceDate, this.state.currentDayAttendance);
        this.showToast("¡Asistencia del día guardada exitosamente!", "success");
    },

    // ==========================================
    // ADMINISTRACIÓN DE EVENTOS & NOVEDADES (CRUD)
    // ==========================================
    renderAdminEventsTable() {
        const tbody = document.getElementById('adminEventsTableBody');
        if (!tbody) return;
        const events = StorageManager.getEvents();

        tbody.innerHTML = events.map(ev => {
            const rsvps = ev.rsvps || {};
            const rsvpCount = Object.keys(rsvps).length;

            return `
                <tr>
                    <td><b>${ev.date}</b> <br><small class="text-muted">${ev.time}</small></td>
                    <td>
                        <b class="text-blue">${ev.title}</b>
                        <p class="text-xs text-secondary mt-1" style="max-width: 320px;">${ev.description}</p>
                    </td>
                    <td><span class="member-chip">${ev.type}</span></td>
                    <td><small>${ev.location}</small></td>
                    <td>
                        <span class="live-counter pill-green">
                            <i class="fas fa-users"></i> ${rsvpCount} Respuestas
                        </span>
                        ${rsvpCount > 0 ? `
                            <button class="btn btn-sm btn-outline-info mt-1" onclick="StorageManager.exportEventAttendeesCSV('${ev.id}')" title="Descargar Lista">
                                <i class="fas fa-file-excel"></i> CSV
                            </button>
                        ` : ''}
                    </td>
                    <td class="text-right">
                        <button class="btn-icon" onclick="app.openEditEventModal('${ev.id}')" title="Editar Evento">
                            <i class="fas fa-edit text-blue"></i>
                        </button>
                        <button class="btn-icon" onclick="app.deleteAdminEvent('${ev.id}')" title="Eliminar Evento">
                            <i class="fas fa-trash-alt text-red"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    openAddEventModal() {
        document.getElementById('eventAdminModalTitle').innerHTML = '<i class="fas fa-calendar-plus text-red"></i> Publicar Evento / Aviso';
        document.getElementById('eventAdminFormId').value = '';
        document.getElementById('eventAdminTitle').value = '';
        document.getElementById('eventAdminType').value = 'evento';
        document.getElementById('eventAdminDate').value = getColombiaDateString();
        document.getElementById('eventAdminTime').value = '06:00 PM';
        document.getElementById('eventAdminLocation').value = 'Sede Principal Dojang';
        document.getElementById('eventAdminDesc').value = '';
        document.getElementById('eventAdminAllowRsvp').checked = true;
        document.getElementById('modalEventAdminForm').classList.add('active');
    },

    openEditEventModal(eventId) {
        const ev = StorageManager.getEventById(eventId);
        if (!ev) return;

        document.getElementById('eventAdminModalTitle').innerHTML = '<i class="fas fa-edit text-blue"></i> Editar Evento / Aviso';
        document.getElementById('eventAdminFormId').value = ev.id;
        document.getElementById('eventAdminTitle').value = ev.title;
        document.getElementById('eventAdminType').value = ev.type || 'evento';
        document.getElementById('eventAdminDate').value = ev.date;
        document.getElementById('eventAdminTime').value = ev.time || '';
        document.getElementById('eventAdminLocation').value = ev.location || '';
        document.getElementById('eventAdminDesc').value = ev.description || '';
        document.getElementById('eventAdminAllowRsvp').checked = ev.allowRsvp !== false;
        document.getElementById('modalEventAdminForm').classList.add('active');
    },

    handleSaveAdminEvent(e) {
        e.preventDefault();
        const id = document.getElementById('eventAdminFormId').value;
        const title = document.getElementById('eventAdminTitle').value;
        const type = document.getElementById('eventAdminType').value;
        const date = document.getElementById('eventAdminDate').value;
        const time = document.getElementById('eventAdminTime').value;
        const location = document.getElementById('eventAdminLocation').value;
        const description = document.getElementById('eventAdminDesc').value;
        const allowRsvp = document.getElementById('eventAdminAllowRsvp').checked;

        if (id) {
            StorageManager.updateEvent(id, { title, type, date, time, location, description, allowRsvp });
            this.showToast("Evento actualizado correctamente", "success");
        } else {
            StorageManager.addEvent({ title, type, date, time, location, description, allowRsvp });
            this.showToast("Nuevo evento o novedad publicado", "success");
        }

        this.closeModal('modalEventAdminForm');
        this.renderAdminEventsTable();
        this.renderPublicEvents();
    },

    deleteAdminEvent(eventId) {
        const ev = StorageManager.getEventById(eventId);
        if (!ev) return;
        if (confirm(`¿Estás seguro de eliminar el evento "${ev.title}"?`)) {
            StorageManager.deleteEvent(eventId);
            this.showToast("Evento eliminado", "info");
            this.renderAdminEventsTable();
            this.renderPublicEvents();
        }
    },

    // ==========================================
    // GESTIÓN DE ALUMNOS (CRUD)
    // ==========================================
    renderStudentsCrudTable() {
        const tbody = document.getElementById('crudStudentsTableBody');
        if (!tbody) return;

        const search = (document.getElementById('crudSearchInput')?.value || '').trim().toUpperCase();
        const groupFilter = document.getElementById('crudGroupFilterSelect')?.value || 'ALL';

        let students = StorageManager.getStudents();

        if (groupFilter !== 'ALL') {
            students = students.filter(s => s.group === groupFilter);
        }
        if (search) {
            students = students.filter(s => s.name.toUpperCase().includes(search));
        }

        tbody.innerHTML = students.map((s, idx) => {
            const stats = StorageManager.getStudentStats(s.id);
            const belt = this.getBeltData(s.belt);
            const isActive = s.active !== false;

            return `
                <tr>
                    <td><b>${idx + 1}</b></td>
                    <td>
                        <div class="row-student-info">
                            <div class="mini-avatar" style="border: 2px solid ${belt.border || belt.color};">${s.name.charAt(0)}</div>
                            <span class="font-bold">${s.name}</span>
                        </div>
                    </td>
                    <td><span class="member-chip">${s.group}</span></td>
                    <td>
                        <span class="belt-pill-mini" style="background: ${belt.badgeBg || belt.color}; color: ${belt.textColor || '#0F172A'}; border: 1px solid ${belt.border || '#CBD5E1'};">
                            ${belt.name}
                        </span>
                    </td>
                    <td><b>${stats.present}</b> / ${stats.totalSessions}</td>
                    <td>
                        <span style="font-weight: 900; color: ${stats.percentage >= 80 ? '#059669' : '#D97706'};">
                            ${stats.percentage}%
                        </span>
                    </td>
                    <td>${stats.streak} 🔥</td>
                    <td>
                        <span class="live-counter ${isActive ? 'pill-green' : 'pill-red'}" style="cursor: pointer;" onclick="app.toggleStudentStatus('${s.id}')">
                            ${isActive ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                    <td class="text-right">
                        <button class="btn-icon" onclick="app.openEditStudentModal('${s.id}')" title="Editar Alumno">
                            <i class="fas fa-edit text-blue"></i>
                        </button>
                        <button class="btn-icon" onclick="app.deleteStudent('${s.id}')" title="Eliminar Alumno">
                            <i class="fas fa-trash-alt text-red"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    openAddStudentModal() {
        document.getElementById('studentModalTitle').innerHTML = '<i class="fas fa-user-plus text-red"></i> Nuevo Alumno';
        document.getElementById('studentFormId').value = '';
        document.getElementById('studentFormName').value = '';
        document.getElementById('studentFormGroup').value = 'ADOLESCENTES';
        document.getElementById('studentFormBelt').value = 'blanco';
        document.getElementById('studentFormPhone').value = '';
        document.getElementById('studentFormActive').checked = true;
        document.getElementById('modalStudentForm').classList.add('active');
    },

    openEditStudentModal(studentId) {
        const student = StorageManager.getStudentById(studentId);
        if (!student) return;

        document.getElementById('studentModalTitle').innerHTML = '<i class="fas fa-user-edit text-blue"></i> Editar Alumno';
        document.getElementById('studentFormId').value = student.id;
        document.getElementById('studentFormName').value = student.name;
        document.getElementById('studentFormGroup').value = student.group;
        document.getElementById('studentFormBelt').value = student.belt || 'blanco';
        document.getElementById('studentFormPhone').value = student.phone || '';
        document.getElementById('studentFormActive').checked = student.active !== false;
        document.getElementById('modalStudentForm').classList.add('active');
    },

    handleSaveStudent(e) {
        e.preventDefault();
        const id = document.getElementById('studentFormId').value;
        const name = document.getElementById('studentFormName').value;
        const group = document.getElementById('studentFormGroup').value;
        const belt = document.getElementById('studentFormBelt').value;
        const phone = document.getElementById('studentFormPhone').value;
        const active = document.getElementById('studentFormActive').checked;

        if (id) {
            StorageManager.updateStudent(id, { name, group, belt, phone, active });
            this.showToast("Alumno actualizado correctamente", "success");
        } else {
            StorageManager.addStudent({ name, group, belt, phone, active });
            this.showToast("Nuevo alumno agregado exitosamente", "success");
        }

        this.closeModal('modalStudentForm');
        this.renderStudentsCrudTable();
        this.renderAdminGroupPills();
        this.renderAttendanceSheet();
        this.renderPublicOverview();
        this.renderPublicGroups();
    },

    deleteStudent(studentId) {
        const s = StorageManager.getStudentById(studentId);
        if (!s) return;
        if (confirm(`¿Estás seguro de eliminar al alumno "${s.name}" del Dojang?`)) {
            StorageManager.deleteStudent(studentId);
            this.showToast("Alumno eliminado", "info");
            this.renderStudentsCrudTable();
            this.renderAdminGroupPills();
            this.renderAttendanceSheet();
            this.renderPublicOverview();
        }
    },

    toggleStudentStatus(studentId) {
        const s = StorageManager.getStudentById(studentId);
        if (!s) return;
        const newStatus = !(s.active !== false);
        StorageManager.updateStudent(studentId, { active: newStatus });
        this.showToast(`Estado de ${s.name} cambiado a ${newStatus ? 'Activo' : 'Inactivo'}`, "info");
        this.renderStudentsCrudTable();
    },

    // ==========================================
    // HISTORIAL Y REPORTES
    // ==========================================
    renderReportsTable() {
        const tbody = document.getElementById('reportsTableBody');
        if (!tbody) return;

        const groupFilter = document.getElementById('reportsGroupFilter')?.value || 'ALL';
        let students = StorageManager.getStudents();

        if (groupFilter !== 'ALL') {
            students = students.filter(s => s.group === groupFilter);
        }

        const global = StorageManager.getGlobalStats();
        document.getElementById('repTotalStudents').textContent = global.totalStudents;
        document.getElementById('repTotalPresents').textContent = global.totalPresent;
        document.getElementById('repTotalClasses').textContent = global.totalClassesRecorded;
        document.getElementById('repAtRiskCount').textContent = global.atRiskCount;

        tbody.innerHTML = students.map(s => {
            const stats = StorageManager.getStudentStats(s.id);
            const belt = this.getBeltData(s.belt);
            const isAtRisk = stats.consecutiveAbsences >= 3;

            return `
                <tr>
                    <td><b>${s.name}</b></td>
                    <td><span class="member-chip">${s.group}</span></td>
                    <td>
                        <span class="belt-pill-mini" style="background: ${belt.badgeBg || belt.color}; color: ${belt.textColor || '#0F172A'}; border: 1px solid ${belt.border || '#CBD5E1'};">
                            ${belt.name}
                        </span>
                    </td>
                    <td>${stats.totalSessions}</td>
                    <td><b class="text-green">${stats.present}</b></td>
                    <td><b class="text-yellow">${stats.late}</b></td>
                    <td><b class="text-blue">${stats.excused}</b></td>
                    <td><b class="text-red">${stats.absent}</b></td>
                    <td>
                        <span style="font-weight: 900; color: ${stats.percentage >= 80 ? '#059669' : (stats.percentage >= 60 ? '#D97706' : '#DC2626')};">
                            ${stats.percentage}%
                        </span>
                    </td>
                    <td>${stats.streak} 🔥</td>
                    <td>
                        ${isAtRisk 
                            ? `<span class="live-counter pill-red"><i class="fas fa-exclamation-circle"></i> ${stats.consecutiveAbsences} Faltas seguidas</span>`
                            : `<span class="live-counter pill-green"><i class="fas fa-check"></i> Al Día</span>`
                        }
                    </td>
                </tr>
            `;
        }).join('');
    },

    // ==========================================
    // CONFIGURACIÓN & SEGURIDAD
    // ==========================================
    loadSettingsForm() {
        const creds = AuthManager.getCredentials();
        const elName = document.getElementById('settingInstructorName');
        const elUser = document.getElementById('settingUsername');
        if (elName) elName.value = creds.name || "Sabonim Principal";
        if (elUser) elUser.value = creds.user;
    },

    handleChangePassword(e) {
        e.preventDefault();
        const instructorName = document.getElementById('settingInstructorName').value;
        const username = document.getElementById('settingUsername').value;
        const currentPass = document.getElementById('settingCurrentPass').value;
        const newPass = document.getElementById('settingNewPass').value;

        const res = AuthManager.updatePassword(currentPass, newPass, username, instructorName);
        if (res.success) {
            this.showToast(res.message, "success");
            document.getElementById('settingCurrentPass').value = '';
            document.getElementById('settingNewPass').value = '';
            this.checkAuthStatus();
        } else {
            this.showToast(res.message, "error");
        }
    },

    handleImportJSON(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target.result;
            const res = StorageManager.importBackupJSON(content);
            if (res.success) {
                this.showToast(`¡Respaldo restaurado con éxito! (${res.count} alumnos)`, "success");
                this.renderAttendanceSheet();
                this.renderAdminEventsTable();
                this.renderStudentsCrudTable();
                this.renderReportsTable();
                this.renderPublicOverview();
                this.renderPublicEvents();
            } else {
                this.showToast(`Error al importar: ${res.error}`, "error");
            }
        };
        reader.readAsText(file);
    },

    confirmResetData() {
        if (confirm("¿Estás seguro de restablecer todos los datos iniciales? Se recuperarán los alumnos, cinturones y eventos originales.")) {
            StorageManager.resetToInitial();
            this.loadDayAttendance(this.state.attendanceDate);
            this.showToast("Datos iniciales restablecidos con éxito", "info");
            this.renderAttendanceSheet();
            this.renderAdminEventsTable();
            this.renderStudentsCrudTable();
            this.renderReportsTable();
            this.renderPublicOverview();
            this.renderPublicEvents();
        }
    },

    // ==========================================
    // HELPERS & TOASTS
    // ==========================================
    getBeltData(beltId) {
        return BELTS.find(b => b.id === beltId) || BELTS[0];
    },

    showToast(message, type = "info") {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';

        toast.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }
};

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    app.init(); window.addEventListener('load', () => { setTimeout(() => { const section = document.getElementById('consulta'); if (section) { window.history.replaceState(null, '', '#consulta'); this.scrollToSection('consulta'); } }, 250); }, { once: true });
});
