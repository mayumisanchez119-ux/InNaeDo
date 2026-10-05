const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('js/auth.js', 'utf8');
function storage() {
    const values = new Map();
    return { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}
function setup(local = storage()) {
    const calls = [];
    const ctx = { console, Date, localStorage: local, sessionStorage: storage(),
        STORAGE_KEYS: { AUTH_SESSION: 'test-session' }, SUPABASE_EVENTS_URL: 'https://example.supabase.co', SUPABASE_EVENTS_KEY: 'public',
        fetch: async (url, options) => {
            calls.push({ url, options });
            return { ok: true, json: async () => ({ access_token: 'access-' + calls.length, refresh_token: 'refresh-' + calls.length, expires_in: 3600 }) };
        } };
    vm.createContext(ctx);
    vm.runInContext(source + '\nthis.auth = AuthManager;', ctx);
    return { ctx, auth: ctx.auth, calls };
}
async function run() {
    const first = setup();
    assert.equal((await first.auth.login('Admin', 'test-secret')).success, true);
    assert.equal(first.ctx.localStorage.getItem(first.auth.rememberedKey()), null);
    assert.doesNotMatch(first.ctx.sessionStorage.getItem('test-session'), /test-secret|password/);
    assert.equal(setup(first.ctx.localStorage).auth.isLoggedIn(), false);
    await first.auth.login('Admin', 'test-secret', true);
    assert.equal(first.ctx.sessionStorage.getItem('test-session'), null);
    assert.doesNotMatch(first.ctx.localStorage.getItem(first.auth.rememberedKey()), /test-secret|password/);
    const reopened = setup(first.ctx.localStorage);
    assert.equal(await reopened.auth.ensureSession(), true);
    assert.equal(reopened.calls.length, 0);
    reopened.auth.storeSession({ ...reopened.auth.getCurrentUser(), expiresAt: Date.now() - 1 });
    assert.deepEqual(await Promise.all([reopened.auth.ensureSession(), reopened.auth.ensureSession()]), [true, true]);
    assert.equal(reopened.calls.length, 1);
    assert.match(reopened.calls[0].url, /grant_type=refresh_token/);
    assert.equal(reopened.auth.getCurrentUser().refreshToken, 'refresh-1');
    reopened.auth.logout();
    assert.equal(reopened.auth.getCurrentUser(), null);
    assert.match(reopened.calls.at(-1).url, /logout\?scope=local/);
    const invalid = setup();
    await invalid.auth.login('Admin', 'test-secret', true);
    invalid.auth.storeSession({ ...invalid.auth.getCurrentUser(), expiresAt: 1 });
    invalid.ctx.fetch = async () => ({ ok: false, status: 401 });
    assert.equal(await invalid.auth.ensureSession(), false);
    assert.equal(invalid.auth.getCurrentUser(), null);
    const offline = setup();
    await offline.auth.login('Admin', 'test-secret', true);
    offline.auth.storeSession({ ...offline.auth.getCurrentUser(), expiresAt: 1 });
    offline.ctx.fetch = async () => { throw new Error('offline'); };
    assert.equal(await offline.auth.ensureSession(), false);
    assert.ok(offline.auth.getCurrentUser().refreshToken);
    let complete;
    offline.ctx.fetch = () => new Promise(resolve => { complete = resolve; });
    const pending = offline.auth.ensureSession();
    offline.auth.logout();
    complete({ ok: true, json: async () => ({ access_token: 'late', refresh_token: 'late', expires_in: 3600 }) });
    assert.equal(await pending, false);
    assert.equal(offline.auth.getCurrentUser(), null);
    console.log('PASS: acceso recordado opcional, sin contraseña almacenada, reapertura, renovación concurrente, errores, cierre local y protección de sesión cerrada.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
