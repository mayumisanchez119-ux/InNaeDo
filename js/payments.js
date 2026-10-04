/** Mensualidades privadas. La nube confirma cada pago antes de emitir recibo. */
const PaymentsPanel = {
    payments: [],
    loaded: false,
    saving: false,
    requestId: null,
    selectedStudentId: '',
    loadVersion: 0,
    chargeTypes: { monthly: 'Mensualidad', exam: 'Examen', seminar: 'Seminario', uniform: 'Uniforme', other: 'Otro cobro' },
    methods: { cash: 'Efectivo', transfer: 'Transferencia' },
    chargeType(payment) { return payment.charge_type || 'monthly'; },
    methodLabel(payment) { return this.methods[payment.payment_method] || 'No registrada'; },
    updateChargeForm() {
        const type = document.getElementById('paymentType').value;
        document.getElementById('paymentMonthLabel').textContent = type === 'monthly' ? 'Mensualidad que está pagando' : 'Mes al que corresponde el cobro';
        document.getElementById('paymentDetail').required = type === 'other';
        document.getElementById('paymentDetailHint').textContent = type === 'other' ? '(obligatorio)' : '(opcional)';
    },

    escape(value) { return app.escapeReportText(value); },
    normalize(value) {
        return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    },
    money(value) {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(value));
    },
    monthLabel(value) {
        return new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric', timeZone: 'America/Bogota' })
            .format(new Date(value.slice(0, 7) + '-01T12:00:00-05:00'));
    },
    dateLabel(value) { return value.split('-').reverse().join('/'); },

    init() {
        const today = getColombiaDateString();
        document.getElementById('paymentDate').value = today;
        document.getElementById('paymentMonth').value = today.slice(0, 7);
        document.getElementById('paymentsFilterMonth').value = today.slice(0, 7);
        document.getElementById('paymentType').value = 'monthly';
        this.updateChargeForm();
        document.getElementById('paymentsStudentsBody').addEventListener('click', event => {
            const button = event.target.closest('[data-payment-student]');
            if (button) this.selectStudent(button.dataset.paymentStudent);
        });
        document.getElementById('paymentsHistoryBody').addEventListener('click', event => {
            const button = event.target.closest('[data-payment-receipt]');
            if (button) this.showReceipt(button.dataset.paymentReceipt);
        });
        this.render();
    },

    async open() {
        if (!AuthManager.isLoggedIn()) return;
        await this.refresh();
    },

    async refresh() {
        const version = ++this.loadVersion;
        const status = document.getElementById('paymentsSyncStatus');
        this.loaded = false;
        this.render();
        status.textContent = 'Consultando pagos...';
        try {
            // Paginación: conserva el historial aun después de los primeros 1000 pagos.
            const rows = [];
            for (let offset = 0; ; offset += 500) {
                const response = await StorageManager.cloudRequest(
                    `monthly_payments?select=*&order=created_at.desc,id.desc&limit=500&offset=${offset}`, {}, true
                );
                const batch = await response.json();
                rows.push(...batch);
                if (batch.length < 500) break;
            }
            if (version !== this.loadVersion || !AuthManager.isLoggedIn()) return;
            this.payments = rows;
            this.loaded = true;
            status.textContent = 'Pagos sincronizados. Pendiente = sin pago de mensualidad registrado en el mes elegido.';
            this.render();
        } catch (error) {
            if (version !== this.loadVersion) return;
            status.textContent = 'No se pudieron consultar los pagos. Pulsa Actualizar e inicia sesión de nuevo si es necesario.';
            this.render();
        }
    },

    clear() {
        this.loadVersion++;
        this.payments = [];
        this.loaded = false;
        this.selectedStudentId = '';
        this.requestId = null;
        document.getElementById('paymentReceipt').value = '';
        for (const id of ['paymentAmount', 'paymentNote', 'paymentDetail', 'paymentMethod']) {
            document.getElementById(id).value = '';
        }
        document.getElementById('paymentReceiptCard').hidden = true;
        document.getElementById('paymentSelectedStudent').textContent = 'Busca y selecciona un alumno en el listado.';
        this.render();
    },

    render() {
        const body = document.getElementById('paymentsStudentsBody');
        if (!body) return;
        document.getElementById('paymentSaveButton').disabled = !this.loaded || this.saving;
        if (!this.loaded) {
            body.innerHTML = '<tr><td colspan="5">Actualiza los pagos para consultar el estado de las mensualidades.</td></tr>';
            document.getElementById('paymentsHistoryBody').innerHTML = '';
            document.getElementById('paymentsSummary').textContent = '';
            return;
        }
        const month = document.getElementById('paymentsFilterMonth').value;
        if (!/^\d{4}-\d{2}$/.test(month)) {
            body.innerHTML = '<tr><td colspan="5">Selecciona un mes para consultar.</td></tr>';
            document.getElementById('paymentsHistoryBody').innerHTML = '';
            document.getElementById('paymentsSummary').textContent = '';
            return;
        }
        const query = this.normalize(document.getElementById('paymentsSearch').value.trim());
        const status = document.getElementById('paymentsStatusFilter').value;
        const group = document.getElementById('paymentsGroupFilter').value;
        const historyType = document.getElementById('paymentsTypeFilter').value;
        const active = StorageManager.getStudents(true);
        const groupSelect = document.getElementById('paymentsGroupFilter');
        const groups = [...new Set(active.map(student => student.group))].sort();
        groupSelect.innerHTML = '<option value="ALL">Todos los grupos</option>' + groups.map(value => `<option value="${this.escape(value)}">${this.escape(value)}</option>`).join('');
        groupSelect.value = groups.includes(group) ? group : 'ALL';
        const monthPayments = this.payments.filter(payment => payment.fee_month.slice(0, 7) === month);
        const monthlyPayments = monthPayments.filter(payment => this.chargeType(payment) === 'monthly');
        const paidIds = new Set(monthlyPayments.map(payment => payment.student_id));
        const paidCount = active.filter(student => paidIds.has(student.id)).length;
        const sum = payments => payments.reduce((total, payment) => total + Number(payment.amount_cop), 0);
        document.getElementById('paymentsSummary').textContent = `${this.monthLabel(month)}: ${paidCount} alumnos con mensualidad registrada · ${active.length - paidCount} pendientes · Mensualidades: ${this.money(sum(monthlyPayments))} · Otros cobros: ${this.money(sum(monthPayments.filter(payment => this.chargeType(payment) !== 'monthly')))}`;
        const students = active.filter(student =>
            (!query || this.normalize(student.name).includes(query)) &&
            (groupSelect.value === 'ALL' || student.group === groupSelect.value) &&
            (status === 'ALL' || (status === 'paid' ? paidIds.has(student.id) : !paidIds.has(student.id)))
        ).sort((a, b) => a.name.localeCompare(b.name, 'es'));
        body.innerHTML = students.map(student => {
            const payments = monthlyPayments.filter(payment => payment.student_id === student.id);
            const total = payments.reduce((sum, payment) => sum + Number(payment.amount_cop), 0);
            return `<tr><td><b>${this.escape(student.name)}</b></td><td>${this.escape(student.group)}</td>
                <td class="${payments.length ? 'text-green' : 'text-red'}">${payments.length ? 'Pago registrado' : 'Pendiente'}</td>
                <td>${payments.length ? this.money(total) : '—'}</td>
                <td><button type="button" class="btn btn-sm btn-outline-info" data-payment-student="${this.escape(student.id)}">Registrar pago</button></td></tr>`;
        }).join('') || '<tr><td colspan="5">No hay alumnos que coincidan con los filtros.</td></tr>';
        const history = monthPayments.filter(payment =>
            (historyType === 'ALL' || this.chargeType(payment) === historyType) &&
            (!query || this.normalize(payment.student_name).includes(query)) &&
            (groupSelect.value === 'ALL' || payment.group_name === groupSelect.value)
        );
        document.getElementById('paymentsHistoryBody').innerHTML = history.map(payment => `<tr>
            <td>${this.dateLabel(payment.paid_on)}</td><td>${this.escape(payment.student_name)}</td>
            <td>${this.escape(this.chargeTypes[this.chargeType(payment)])}</td><td>${this.escape(this.monthLabel(payment.fee_month))}</td>
            <td>${this.escape(payment.charge_detail || '—')}</td><td>${this.money(payment.amount_cop)}</td><td>${this.escape(this.methodLabel(payment))}</td>
            <td>${this.escape(payment.note || '—')}</td><td><button type="button" class="btn btn-sm btn-outline-info" data-payment-receipt="${this.escape(payment.id)}">Ver comprobante</button></td>
            </tr>`).join('') || '<tr><td colspan="9">No hay pagos registrados para este mes y búsqueda.</td></tr>';
    },

    selectStudent(id) {
        if (this.saving) return;
        const student = StorageManager.getStudentById(id);
        if (!student || student.active === false) return;
        this.selectedStudentId = id;
        this.requestId = null;
        document.getElementById('paymentSelectedStudent').textContent = `${student.name} · ${student.group}`;
        document.getElementById('paymentMonth').value = document.getElementById('paymentsFilterMonth').value;
        document.getElementById('paymentReceiptCard').hidden = true;
        document.getElementById('paymentAmount').value = '';
        document.getElementById('paymentNote').value = '';
        document.getElementById('paymentDetail').value = '';
        document.getElementById('paymentMethod').value = '';
        document.getElementById('paymentAmount').focus();
    },

    async save(event) {
        event.preventDefault();
        if (this.saving || !this.loaded) return;
        const student = StorageManager.getStudentById(this.selectedStudentId);
        const amount = Number(document.getElementById('paymentAmount').value);
        const paidOn = document.getElementById('paymentDate').value;
        const month = document.getElementById('paymentMonth').value;
        const chargeType = document.getElementById('paymentType').value;
        const paymentMethod = document.getElementById('paymentMethod').value;
        const chargeDetail = document.getElementById('paymentDetail').value.trim();
        if (!Object.hasOwn(this.chargeTypes, chargeType)) return app.showToast('Selecciona un tipo de cobro válido.', 'error');
        if (!Object.hasOwn(this.methods, paymentMethod)) return app.showToast('Selecciona efectivo o transferencia.', 'error');
        if (chargeDetail.length > 200 || (chargeType === 'other' && !chargeDetail)) return app.showToast('Escribe el detalle del otro cobro (máximo 200 caracteres).', 'error');
        if (!student || student.active === false) return app.showToast('Selecciona un alumno activo.', 'error');
        if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 999999999999) return app.showToast('Escribe un valor válido en pesos colombianos.', 'error');
        if (!/^\d{4}-\d{2}$/.test(month) || !/^\d{4}-\d{2}-\d{2}$/.test(paidOn) || paidOn > getColombiaDateString()) {
            return app.showToast('Revisa el mes y la fecha de pago. La fecha no puede ser futura.', 'error');
        }
        const previous = this.payments.filter(payment => payment.student_id === student.id && payment.fee_month.slice(0, 7) === month && this.chargeType(payment) === chargeType);
        if (previous.length && !confirm(`Ya hay ${previous.length} pago(s) por ${this.chargeTypes[chargeType]} de ${student.name} para ${this.monthLabel(month)}. ¿Registrar otro pago por ${this.money(amount)}?`)) return;
        this.requestId ||= crypto.randomUUID();
        const row = {
            id: this.requestId,
            student_id: student.id,
            student_name: student.name,
            group_name: student.group,
            fee_month: month + '-01',
            paid_on: paidOn,
            amount_cop: amount,
            charge_type: chargeType,
            payment_method: paymentMethod,
            charge_detail: chargeDetail,
            note: document.getElementById('paymentNote').value.trim()
        };
        this.saving = true;
        this.render();
        const button = document.getElementById('paymentSaveButton');
        button.textContent = 'Guardando pago...';
        // Un UUID por intento permite reintentar sin registrar dos veces el mismo pago.
        try {
            const response = await StorageManager.cloudRequest('monthly_payments?on_conflict=id', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Prefer: 'resolution=ignore-duplicates,return=representation' },
                body: JSON.stringify(row)
            }, true);
            let [saved] = await response.json();
            if (!saved) {
                const existing = await StorageManager.cloudRequest(`monthly_payments?id=eq.${encodeURIComponent(row.id)}&select=*`, {}, true);
                [saved] = await existing.json();
            }
            if (!saved) throw new Error('No se confirmó el pago.');
            this.payments = [saved, ...this.payments.filter(payment => payment.id !== saved.id)];
            document.getElementById('paymentsFilterMonth').value = month;
            this.showReceipt(saved.id);
            this.requestId = null;
            this.selectedStudentId = '';
            document.getElementById('paymentSelectedStudent').textContent = 'Pago guardado. Selecciona un alumno para registrar otro pago.';
            document.getElementById('paymentAmount').value = '';
            document.getElementById('paymentNote').value = '';
            document.getElementById('paymentDetail').value = '';
            document.getElementById('paymentMethod').value = '';
            app.showToast('Pago guardado. El comprobante está listo para copiar.', 'success');
        } catch (error) {
            app.showToast('No se pudo confirmar el pago. Revisa la conexión o inicia sesión nuevamente y reintenta.', 'error');
        } finally {
            this.saving = false;
            button.textContent = 'Guardar pago y generar comprobante';
            this.render();
        }
    },

    receipt(payment) {
        return [
            '🥋 TAEKWONDO INNAEDO',
            'COMPROBANTE DE PAGO',
            `Recibo: ${payment.id}`,
            `Alumno: ${payment.student_name}`,
            `Grupo: ${payment.group_name}`,
            `Concepto: ${this.chargeTypes[this.chargeType(payment)]}`,
            `${this.chargeType(payment) === 'monthly' ? 'Mensualidad' : 'Mes del cobro'}: ${this.monthLabel(payment.fee_month)}`,
            payment.charge_detail ? `Detalle: ${payment.charge_detail}` : '',
            `Fecha de pago: ${this.dateLabel(payment.paid_on)}`,
            `Valor recibido: ${this.money(payment.amount_cop)}`,
            `Forma de pago: ${this.methodLabel(payment)}`,
            payment.note ? `Observación: ${payment.note}` : '',
            'Pago recibido y registrado. ¡Gracias por tu compromiso con INNAEDO!'
        ].filter(Boolean).join('\n');
    },
    showReceipt(id) {
        const payment = this.payments.find(item => item.id === id);
        if (!payment) return;
        document.getElementById('paymentReceipt').value = this.receipt(payment);
        document.getElementById('paymentReceiptCard').hidden = false;
    },
    async copyReceipt() {
        const field = document.getElementById('paymentReceipt');
        if (!field.value) return;
        try {
            await navigator.clipboard.writeText(field.value);
            app.showToast('Comprobante copiado. Ya puedes pegarlo en el mensaje al alumno.', 'success');
        } catch (error) {
            field.focus();
            field.select();
            app.showToast('Seleccioné el comprobante. Mantén pulsado o usa Ctrl+C para copiarlo.', 'info');
        }
    }
};
document.addEventListener('DOMContentLoaded', () => PaymentsPanel.init());
