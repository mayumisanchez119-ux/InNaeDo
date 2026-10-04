const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const students = [
    { id: 'kid-1', name: 'María Niño', group: 'NIÑOS', active: true },
    { id: 'adult-1', name: 'Carlos Adulto', group: 'ADULTOS', active: true }
];
const fields = new Map();
function field(id) {
    if (!fields.has(id)) fields.set(id, { value: '', innerHTML: '', textContent: '', hidden: true, focus() {}, select() {}, addEventListener() {} });
    return fields.get(id);
}
const toasts = [];
let fail = false;
const ledger = new Map();
const context = {
    console, Intl, Date, crypto: require('node:crypto').webcrypto,
    document: { getElementById: field, addEventListener() {} },
    AuthManager: { isLoggedIn: () => true },
    app: { escapeReportText: value => String(value), showToast: (...args) => toasts.push(args) },
    getColombiaDateString: () => '2026-10-04', confirm: () => true,
    StorageManager: {
        getStudents: () => students,
        getStudentById: id => students.find(student => student.id === id),
        async cloudRequest(path, options = {}, requiresAuth) {
            assert.equal(requiresAuth, true);
            if (fail) throw new Error('offline');
            if (options.method === 'POST') {
                const row = JSON.parse(options.body);
                if (ledger.has(row.id)) return { json: async () => [] };
                ledger.set(row.id, row);
                return { json: async () => [row] };
            }
            if (path.includes('id=eq.')) {
                const id = path.split('id=eq.')[1].split('&')[0];
                return { json: async () => ledger.has(id) ? [ledger.get(id)] : [] };
            }
            return { json: async () => [...ledger.values()] };
        }
    }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync('js/payments.js', 'utf8') + '\nthis.panel = PaymentsPanel;', context);
const panel = context.panel;
async function run() {
    panel.init();
    field('paymentsTypeFilter').value = 'ALL';
    field('paymentsStatusFilter').value = 'pending';
    field('paymentsGroupFilter').value = 'ALL';
    await panel.refresh();
    assert.match(field('paymentsStudentsBody').innerHTML, /María Niño/);
    panel.selectStudent('kid-1');
    field('paymentMethod').value = 'cash';
    field('paymentAmount').value = '80000';
    field('paymentDate').value = '2026-10-04';
    field('paymentMonth').value = '2026-09'; // Pago tardío de septiembre.
    await panel.save({ preventDefault() {} });
    assert.equal(ledger.size, 1);
    assert.equal([...ledger.values()][0].fee_month, '2026-09-01');
    assert.equal([...ledger.values()][0].payment_method, 'cash');
    assert.equal([...ledger.values()][0].charge_type, 'monthly');
    assert.match(field('paymentReceipt').value, /Forma de pago: Efectivo/);
    assert.match(field('paymentReceipt').value, /septiembre de 2026/);
    assert.match(field('paymentReceipt').value, /04\/10\/2026/);
    assert.match(field('paymentReceipt').value, /80\.000/);
    assert.doesNotMatch(field('paymentsStudentsBody').innerHTML, /María Niño/);
    assert.match(field('paymentsStudentsBody').innerHTML, /Carlos Adulto/);
    field('paymentsFilterMonth').value = '2026-10';
    panel.render();
    assert.match(field('paymentsStudentsBody').innerHTML, /María Niño/);
    panel.selectStudent('adult-1');
    field('paymentMethod').value = 'transfer';
    field('paymentAmount').value = '90000';
    fail = true;
    await panel.save({ preventDefault() {} });
    assert.equal(ledger.size, 1);
    assert.equal(panel.selectedStudentId, 'adult-1');
    assert.match(toasts.at(-1)[0], /No se pudo confirmar/);
    fail = false;
    await panel.save({ preventDefault() {} });
    assert.equal(ledger.size, 2);
    assert.match(field('paymentReceipt').value, /Forma de pago: Transferencia/);
    // Otro cobro no cambia el estado de mensualidad.
    panel.selectStudent('kid-1');
    field('paymentType').value = 'exam';
    field('paymentMethod').value = 'transfer';
    field('paymentDetail').value = 'Examen cinturón amarillo';
    field('paymentNote').value = 'Referencia 123';
    field('paymentAmount').value = '150000';
    await panel.save({ preventDefault() {} });
    assert.equal(ledger.size, 3);
    assert.match(field('paymentsStudentsBody').innerHTML, /María Niño/);
    assert.match(field('paymentReceipt').value, /Concepto: Examen/);
    assert.match(field('paymentReceipt').value, /Detalle: Examen cinturón amarillo/);
    assert.match(field('paymentReceipt').value, /Observación: Referencia 123/);
    field('paymentsTypeFilter').value = 'exam';
    panel.render();
    assert.match(field('paymentsHistoryBody').innerHTML, /María Niño/);
    assert.doesNotMatch(field('paymentsHistoryBody').innerHTML, /Carlos Adulto/);
    // Forma de pago requerida, detalle obligatorio para otro cobro.
    panel.selectStudent('kid-1');
    field('paymentAmount').value = '30000';
    await panel.save({ preventDefault() {} });
    assert.equal(ledger.size, 3);
    field('paymentMethod').value = 'cash';
    field('paymentType').value = 'other';
    panel.updateChargeForm();
    assert.equal(field('paymentDetail').required, true);
    await panel.save({ preventDefault() {} });
    assert.equal(ledger.size, 3);
    // Los pagos antiguos siguen siendo mensualidades, sin inventar forma de pago.
    assert.equal(panel.chargeType({}), 'monthly');
    assert.equal(panel.methodLabel({}), 'No registrada');
    for (const type of ['seminar', 'uniform', 'other']) {
        panel.selectStudent('kid-1');
        field('paymentType').value = type;
        field('paymentMethod').value = 'cash';
        field('paymentDetail').value = 'Detalle de ' + type;
        field('paymentAmount').value = '40000';
        await panel.save({ preventDefault() {} });
        assert.equal([...ledger.values()].at(-1).charge_type, type);
        assert.match(field('paymentsStudentsBody').innerHTML, /María Niño/);
    }
    await panel.refresh();
    assert.equal(panel.payments.length, 6);
    panel.clear();
    assert.equal(panel.payments.length, 0);
    assert.equal(field('paymentReceipt').value, '');
    assert.equal(field('paymentMethod').value, '');
    console.log('PASS: mensualidad, examen, seminario, uniforme, otros; métodos separados, pendientes, filtros, recibos, errores, reintentos, datos antiguos y limpieza.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
