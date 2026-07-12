/* ============================================================================
 * TransitOps — frontend SPA (vanilla JS, no build step)
 * Talks to the FastAPI backend under /api. Hash-based routing.
 * ==========================================================================*/

const State = {
  token: localStorage.getItem('to_token') || null,
  user: JSON.parse(localStorage.getItem('to_user') || 'null'),
  route: 'dashboard',
};

/* ---- Role-based UI permissions — mirrors the PDF permission matrix.
       Backend enforces the real thing; Admin passes everything. ------------*/
const PERMS = {
  vehicles:       ['Fleet Manager'],                     // registry CRUD
  drivers:        ['Safety Officer'],                    // licence data, suspend, safety score
  trips:          ['Fleet Manager'],                     // create / dispatch / cancel
  trips_complete: ['Fleet Manager', 'Driver'],           // execution: complete a trip
  maintenance:    ['Fleet Manager'],
  fuel:           ['Fleet Manager', 'Driver'],
  expenses:       ['Fleet Manager', 'Financial Analyst'],
  revenue:        ['Fleet Manager', 'Financial Analyst'],
  acq_cost:       ['Fleet Manager', 'Financial Analyst'],
  documents:      ['Safety Officer', 'Fleet Manager'],
  reminders:      ['Safety Officer', 'Fleet Manager'],
  incidents:      ['Safety Officer'],
};
const can = (area) => !!State.user &&
  (State.user.role === 'Admin' || (PERMS[area] || []).includes(State.user.role));

const NAV = [
  { id: 'dashboard',   label: 'Dashboard',      icon: '📊' },
  { id: 'vehicles',    label: 'Vehicles',       icon: '🚙' },
  { id: 'drivers',     label: 'Drivers',        icon: '🧑‍✈️' },
  { id: 'trips',       label: 'Trips',          icon: '🗺️' },
  { id: 'maintenance', label: 'Maintenance',    icon: '🔧' },
  { id: 'fuel',        label: 'Fuel & Expenses',icon: '⛽' },
  { id: 'incidents',   label: 'Incidents',      icon: '🚨' },
  { id: 'documents',   label: 'Documents / OCR',icon: '📄' },
  { id: 'reports',     label: 'Reports',        icon: '📈' },
];

/* ---- Star rating renderer (1-3 stars, half-star precision) ---------------*/
function stars(value, band) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  let s = '★'.repeat(full) + (half ? '½' : '');
  const color = band === 'green' ? 'text-emerald-500' : band === 'red' ? 'text-red-500' : 'text-amber-500';
  return `<span class="${color} font-semibold" title="${value} stars (max 3)">${s || '—'}</span>`;
}
async function ratingMap(kind) {
  try {
    const rows = await api(`/ratings/${kind}`);
    const key = kind === 'drivers' ? 'driver_id' : 'vehicle_id';
    return Object.fromEntries(rows.map(r => [r[key], r]));
  } catch { return {}; }
}

const DEMO_ACCOUNTS = [
  { role: 'Fleet Manager',    email: 'manager@transitops.com' },
  { role: 'Driver',           email: 'driver@transitops.com' },
  { role: 'Safety Officer',   email: 'safety@transitops.com' },
  { role: 'Financial Analyst',email: 'finance@transitops.com' },
  { role: 'Admin',            email: 'admin@transitops.com' },
];

/* ============================ API helper =================================*/
async function api(path, { method = 'GET', body = null, form = null } = {}) {
  const headers = {};
  if (State.token) headers['Authorization'] = `Bearer ${State.token}`;
  let payload;
  if (form) { payload = form; }
  else if (body) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  const res = await fetch(`/api${path}`, { method, headers, body: payload });
  if (res.status === 401) { logout(); throw new Error('Session expired — please sign in again.'); }
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json() : await res.blob();
  if (!res.ok) {
    const msg = (data && data.detail) ? (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)) : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

/* ============================ Tiny helpers ==============================*/
const $ = (sel, el = document) => el.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const num = (n) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 1 });
const initials = (name) => (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

function toast(message, type = 'info') {
  const colors = { info: 'bg-slate-800', success: 'bg-emerald-600', error: 'bg-red-600', warn: 'bg-amber-500' };
  const el = document.createElement('div');
  el.className = `toast-in ${colors[type] || colors.info} text-white text-sm px-4 py-3 rounded-xl shadow-lg flex items-start gap-2`;
  el.innerHTML = `<span>${type === 'error' ? '⛔' : type === 'success' ? '✅' : type === 'warn' ? '⚠️' : 'ℹ️'}</span><span class="flex-1">${esc(message)}</span>`;
  $('#toast-host').appendChild(el);
  setTimeout(() => { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3600);
}

const STATUS_BADGE = {
  'Available': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'On Trip': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'In Shop': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'Retired': 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  'Off Duty': 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  'Suspended': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  'Draft': 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  'Dispatched': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'Completed': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'Cancelled': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  'Open': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'Closed': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};
const badge = (status) => `<span class="px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[status] || 'bg-slate-200 text-slate-600'}">${esc(status)}</span>`;

/* ============================ Modal ====================================*/
function openModal(title, innerHTML, onMount) {
  const host = $('#modal-host'), card = $('#modal-card');
  card.innerHTML = `
    <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 rounded-t-2xl">
      <h3 class="text-lg font-bold">${esc(title)}</h3>
      <button id="modal-close" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">✕</button>
    </div>
    <div class="p-6">${innerHTML}</div>`;
  host.classList.remove('hidden'); host.classList.add('flex');
  $('#modal-close').onclick = closeModal;
  host.onclick = (e) => { if (e.target === host) closeModal(); };
  if (onMount) onMount(card);
}
function closeModal() { const h = $('#modal-host'); h.classList.add('hidden'); h.classList.remove('flex'); $('#modal-card').innerHTML = ''; }

const field = (label, name, opts = {}) => {
  const { type = 'text', value = '', required = false, step = null, placeholder = '' } = opts;
  return `<div>
    <label class="block text-sm font-medium mb-1">${esc(label)}</label>
    <input name="${name}" type="${type}" ${step ? `step="${step}"` : ''} ${required ? 'required' : ''}
      value="${esc(value)}" placeholder="${esc(placeholder)}"
      class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 outline-none">
  </div>`;
};
const selectField = (label, name, options, value = '') => `<div>
    <label class="block text-sm font-medium mb-1">${esc(label)}</label>
    <select name="${name}" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 outline-none">
      ${options.map(o => { const v = o.value ?? o; const l = o.label ?? o; return `<option value="${esc(v)}" ${String(v) === String(value) ? 'selected' : ''}>${esc(l)}</option>`; }).join('')}
    </select></div>`;
const formData = (formEl) => { const o = {}; new FormData(formEl).forEach((v, k) => o[k] = v); return o; };

/* ============================ Auth =====================================*/
function renderDemoAccounts() {
  $('#demo-accounts').innerHTML = DEMO_ACCOUNTS.map(a =>
    `<button data-email="${a.email}" class="demo-btn px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-brand-50 dark:hover:bg-slate-800 text-left">
      <div class="font-semibold">${esc(a.role)}</div>
      <div class="text-[10px] text-slate-400 truncate">${esc(a.email)}</div>
    </button>`).join('');
  document.querySelectorAll('.demo-btn').forEach(b => b.onclick = () => {
    $('#login-email').value = b.dataset.email; $('#login-password').value = 'transitops123';
  });
}

async function doLogin(email, password) {
  const data = await api('/auth/login-json', { method: 'POST', body: { email, password } });
  State.token = data.access_token;
  State.user = { name: data.name, role: data.role, email: data.email };
  localStorage.setItem('to_token', State.token);
  localStorage.setItem('to_user', JSON.stringify(State.user));
}

function logout() {
  State.token = null; State.user = null;
  localStorage.removeItem('to_token'); localStorage.removeItem('to_user');
  $('#app').classList.add('hidden');
  $('#login-screen').classList.remove('hidden');
}

function showApp() {
  $('#login-screen').classList.add('hidden');
  $('#app').classList.remove('hidden');
  $('#user-name').textContent = State.user.name;
  $('#user-role').textContent = State.user.role;
  $('#user-avatar').textContent = initials(State.user.name);
  renderNav();
  navigate(location.hash.replace('#', '') || 'dashboard');
}

/* ============================ Nav + routing ============================*/
function renderNav() {
  $('#nav').innerHTML = NAV.map(n =>
    `<a href="#${n.id}" data-route="${n.id}"
        class="nav-link flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
       <span class="text-lg">${n.icon}</span><span class="font-medium">${n.label}</span>
     </a>`).join('') +
    `<div class="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-400 px-3">
       Signed in as<br><span class="font-semibold text-slate-500 dark:text-slate-300">${esc(State.user.role)}</span>
     </div>`;
  document.querySelectorAll('.nav-link').forEach(a => a.onclick = () => closeSidebar());
}

function highlightNav() {
  document.querySelectorAll('.nav-link').forEach(a => {
    const active = a.dataset.route === State.route;
    a.classList.toggle('bg-brand-600', active);
    a.classList.toggle('text-white', active);
    a.classList.toggle('hover:bg-brand-600', active);
  });
}

const PAGES = {}; // filled below
async function navigate(route) {
  if (!PAGES[route]) route = 'dashboard';
  State.route = route;
  location.hash = route;
  $('#page-title').textContent = NAV.find(n => n.id === route)?.label || 'TransitOps';
  highlightNav();
  const page = $('#page');
  page.innerHTML = `<div class="text-slate-400 text-sm">Loading…</div>`;
  try { await PAGES[route](page); }
  catch (e) { page.innerHTML = `<div class="text-red-600">⛔ ${esc(e.message)}</div>`; }
}
window.addEventListener('hashchange', () => { const r = location.hash.replace('#', ''); if (r && r !== State.route) navigate(r); });

/* ============================ Shared table UI ==========================*/
function toolbar({ search = true, onSearch, filters = [], actions = '' }) {
  const wrap = document.createElement('div');
  wrap.className = 'flex flex-wrap items-center gap-2 mb-4';
  wrap.innerHTML =
    (search ? `<input id="tb-search" placeholder="🔍 Search…" class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm w-full sm:w-64 focus:ring-2 focus:ring-brand-500 outline-none">` : '') +
    filters.map(f => `<select data-filter="${f.name}" class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
        <option value="">${esc(f.label)}</option>
        ${f.options.map(o => `<option value="${esc(o)}">${esc(o)}</option>`).join('')}
      </select>`).join('') +
    `<div class="flex-1"></div>${actions}`;
  if (search && onSearch) { let t; wrap.querySelector('#tb-search').addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => onSearch(e.target.value), 250); }); }
  return wrap;
}
const card = (inner, cls = '') => `<div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 ${cls}">${inner}</div>`;
const tableShell = (headers) => `
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead><tr class="text-left text-xs uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">
        ${headers.map(h => `<th class="px-4 py-3 font-semibold">${esc(h)}</th>`).join('')}
      </tr></thead><tbody></tbody></table></div>`;
const emptyRow = (cols, msg = 'No records yet.') => `<tr><td colspan="${cols}" class="px-4 py-10 text-center text-slate-400">${esc(msg)}</td></tr>`;
const actionBtn = (label, cls = '') => `<button class="px-2.5 py-1 rounded-lg text-xs font-medium ${cls}">${label}</button>`;

/* ============================ DASHBOARD ================================*/
let charts = {};
PAGES.dashboard = async function (page) {
  const [filters, ov] = await Promise.all([api('/dashboard/filters'), api('/dashboard/overview')]);
  page.innerHTML = `
    <div class="mb-2 text-xs uppercase tracking-wider text-slate-400">Fleet overview</div>
    <div id="overview-strip" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6"></div>
    <div class="mb-2 text-xs uppercase tracking-wider text-slate-400">Fleet detail</div>
    <div id="dash-filters" class="flex flex-wrap gap-2 mb-4"></div>
    <div id="kpi-grid" class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"></div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      ${card(`<div class="p-4"><h3 class="font-bold mb-3">Fleet Status</h3><div class="h-64"><canvas id="chart-status"></canvas></div></div>`)}
      ${card(`<div class="p-4"><h3 class="font-bold mb-3">Cost vs Revenue (fleet)</h3><div class="h-64"><canvas id="chart-cost"></canvas></div></div>`)}
    </div>`;
  const fbar = $('#dash-filters');
  fbar.innerHTML = [
    { name: 'type', label: 'All types', options: filters.types },
    { name: 'status', label: 'All statuses', options: filters.statuses },
    { name: 'region', label: 'All regions', options: filters.regions },
  ].map(f => `<select data-df="${f.name}" class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm">
      <option value="">${f.label}</option>${f.options.map(o => `<option>${esc(o)}</option>`).join('')}</select>`).join('');
  fbar.querySelectorAll('[data-df]').forEach(s => s.onchange = loadKpis);

  // The six consolidated high-level metrics (shown to every role)
  const netColor = ov.net_profit >= 0 ? 'text-emerald-600' : 'text-red-600';
  const flagColor = ov.open_safety_flags > 0 ? 'text-red-600' : 'text-emerald-600';
  const compColor = ov.compliance_rate >= 90 ? 'text-emerald-600' : ov.compliance_rate >= 75 ? 'text-amber-600' : 'text-red-600';
  const strip = [
    ['Active Trips', ov.active_trips, '🚚', 'text-blue-600'],
    ['Fleet Utilization', ov.fleet_utilization + '%', '📊', 'text-brand-600'],
    ['Compliance Rate', ov.compliance_rate + '%', '🛡️', compColor],
    ['Net Profit', money(ov.net_profit), '💰', netColor],
    ['In Maintenance', ov.vehicles_in_maintenance, '🔧', 'text-amber-600'],
    ['Safety Flags', ov.open_safety_flags, '⚠️', flagColor],
  ];
  $('#overview-strip').innerHTML = strip.map(([l, v, i, c]) => `
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 fade-in">
      <div class="flex items-center justify-between"><span class="text-[11px] font-medium text-slate-400 uppercase tracking-wide">${esc(l)}</span><span>${i}</span></div>
      <div class="text-2xl font-extrabold mt-1 ${c}">${esc(v)}</div>
    </div>`).join('');

  await loadKpis();

  async function loadKpis() {
    const q = new URLSearchParams();
    fbar.querySelectorAll('[data-df]').forEach(s => { if (s.value) q.set(s.dataset.df, s.value); });
    const k = await api('/dashboard/kpis?' + q.toString());
    const tiles = [
      ['Active Vehicles', k.active_vehicles, '🚙', 'text-brand-600'],
      ['Available', k.available_vehicles, '✅', 'text-emerald-600'],
      ['In Maintenance', k.in_maintenance, '🔧', 'text-amber-600'],
      ['Fleet Utilization', k.fleet_utilization + '%', '📊', 'text-indigo-600'],
      ['Active Trips', k.active_trips, '🚚', 'text-blue-600'],
      ['Pending Trips', k.pending_trips, '🕒', 'text-slate-500'],
      ['Drivers On Duty', k.drivers_on_duty, '🧑‍✈️', 'text-blue-600'],
      ['Open Maintenance', k.open_maintenance, '🛠️', 'text-amber-600'],
    ];
    $('#kpi-grid').innerHTML = tiles.map(([label, val, icon, color]) => `
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 fade-in">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-slate-400 uppercase tracking-wide">${esc(label)}</span>
          <span class="text-lg">${icon}</span>
        </div>
        <div class="text-3xl font-extrabold mt-2 ${color}">${esc(val)}</div>
      </div>`).join('');
    drawStatusChart(k.status_breakdown);
    drawCostChart();
  }
};

function chartTextColor() { return document.documentElement.classList.contains('dark') ? '#cbd5e1' : '#475569'; }
function drawStatusChart(bd) {
  const ctx = $('#chart-status'); if (!ctx) return;
  charts.status?.destroy();
  charts.status = new Chart(ctx, {
    type: 'doughnut',
    data: { labels: Object.keys(bd), datasets: [{ data: Object.values(bd),
      backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#94a3b8'], borderWidth: 0 }] },
    options: { plugins: { legend: { position: 'bottom', labels: { color: chartTextColor() } } }, maintainAspectRatio: false }
  });
}
async function drawCostChart() {
  const ctx = $('#chart-cost'); if (!ctx) return;
  const s = await api('/reports/summary'); const t = s.totals;
  charts.cost?.destroy();
  charts.cost = new Chart(ctx, {
    type: 'bar',
    data: { labels: ['Fuel', 'Maintenance', 'Other', 'Revenue'],
      datasets: [{ label: '₹', data: [t.fuel_cost, t.maintenance_cost, t.other_expenses, t.revenue],
        backgroundColor: ['#6366f1', '#f59e0b', '#94a3b8', '#10b981'], borderRadius: 6 }] },
    options: { plugins: { legend: { display: false } }, maintainAspectRatio: false,
      scales: { x: { ticks: { color: chartTextColor() }, grid: { display: false } },
                y: { ticks: { color: chartTextColor() }, grid: { color: 'rgba(148,163,184,.15)' } } } }
  });
}

/* ============================ VEHICLES ================================*/
const VEHICLE_STATUSES = ['Available', 'On Trip', 'In Shop', 'Retired'];
PAGES.vehicles = async function (page) {
  const filters = await api('/dashboard/filters');
  const actions = can('vehicles') ? `<button id="add-vehicle" class="px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold">+ Add Vehicle</button>` : '';
  page.innerHTML = '';
  const tb = toolbar({ onSearch: v => load({ search: v }), actions,
    filters: [{ name: 'status', label: 'All statuses', options: VEHICLE_STATUSES },
              { name: 'type', label: 'All types', options: filters.types }] });
  page.appendChild(tb);
  const host = document.createElement('div'); page.appendChild(host);
  tb.querySelectorAll('[data-filter]').forEach(s => s.onchange = () => load());
  if (can('vehicles')) tb.querySelector('#add-vehicle').onclick = () => vehicleForm();

  async function load(extra = {}) {
    const q = new URLSearchParams(extra);
    tb.querySelectorAll('[data-filter]').forEach(s => { if (s.value) q.set(s.dataset.filter, s.value); });
    const [rows, rmap] = await Promise.all([api('/vehicles?' + q.toString()), ratingMap('vehicles')]);
    host.innerHTML = card(tableShell(['Reg. No', 'Name / Model', 'Type', 'Capacity', 'Odometer', 'Acq. Cost', 'Rating', 'Status', '']));
    const tbody = host.querySelector('tbody');
    if (!rows.length) { tbody.innerHTML = emptyRow(9); return; }
    tbody.innerHTML = rows.map(v => `<tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40">
      <td class="px-4 py-3 font-mono font-semibold">${esc(v.registration_number)}</td>
      <td class="px-4 py-3">${esc(v.name)}</td>
      <td class="px-4 py-3">${esc(v.type)}</td>
      <td class="px-4 py-3">${num(v.max_load_capacity)} kg</td>
      <td class="px-4 py-3">${num(v.odometer)} km</td>
      <td class="px-4 py-3">${money(v.acquisition_cost)}</td>
      <td class="px-4 py-3">${rmap[v.id] ? stars(rmap[v.id].stars, rmap[v.id].band) : '—'}</td>
      <td class="px-4 py-3">${badge(v.status)}</td>
      <td class="px-4 py-3 text-right whitespace-nowrap">
        ${can('vehicles') ? actionBtn('Edit', 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200') + ' ' + actionBtn('Delete', 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30') : '<span class="text-xs text-slate-400">view only</span>'}
      </td></tr>`).join('');
    if (can('vehicles')) tbody.querySelectorAll('tr').forEach((tr, i) => {
      const [edit, del] = tr.querySelectorAll('button');
      edit.onclick = () => vehicleForm(rows[i]);
      del.onclick = () => confirmDelete(`vehicle ${rows[i].registration_number}`, async () => { await api(`/vehicles/${rows[i].id}`, { method: 'DELETE' }); toast('Vehicle removed', 'success'); load(); });
    });
  }
  load();

  function vehicleForm(v = null) {
    openModal(v ? 'Edit Vehicle' : 'Add Vehicle', `<form id="vf" class="space-y-3">
      ${field('Registration Number', 'registration_number', { value: v?.registration_number || '', required: true, placeholder: 'VAN-05' })}
      ${field('Name / Model', 'name', { value: v?.name || '', required: true })}
      <div class="grid grid-cols-2 gap-3">
        ${field('Type', 'type', { value: v?.type || '', required: true, placeholder: 'Van / Truck / Car' })}
        ${field('Region', 'region', { value: v?.region || '' })}
      </div>
      <div class="grid grid-cols-2 gap-3">
        ${field('Max Load (kg)', 'max_load_capacity', { type: 'number', step: '1', value: v?.max_load_capacity ?? '', required: true })}
        ${field('Odometer (km)', 'odometer', { type: 'number', step: '1', value: v?.odometer ?? 0 })}
      </div>
      <div class="grid grid-cols-2 gap-3">
        ${field('Acquisition Cost', 'acquisition_cost', { type: 'number', step: '1', value: v?.acquisition_cost ?? 0 })}
        ${field('Acquisition Date', 'acquisition_date', { type: 'date', value: v?.acquisition_date || '' })}
      </div>
      <div class="grid grid-cols-2 gap-3">
        ${field('Service Interval (km)', 'service_interval_km', { type: 'number', step: '500', value: v?.service_interval_km ?? 10000 })}
        ${selectField('Status', 'status', VEHICLE_STATUSES, v?.status || 'Available')}
      </div>
      <button class="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold">${v ? 'Save changes' : 'Create vehicle'}</button>
    </form>`, (root) => {
      root.querySelector('#vf').onsubmit = async (e) => {
        e.preventDefault();
        const d = formData(e.target);
        ['max_load_capacity', 'odometer', 'acquisition_cost', 'service_interval_km'].forEach(k => d[k] = parseFloat(d[k] || 0));
        if (!d.acquisition_date) delete d.acquisition_date;
        try {
          if (v) await api(`/vehicles/${v.id}`, { method: 'PUT', body: d });
          else await api('/vehicles', { method: 'POST', body: d });
          toast(v ? 'Vehicle updated' : 'Vehicle created', 'success'); closeModal(); load();
        } catch (err) { toast(err.message, 'error'); }
      };
    });
  }
};

/* ============================ DRIVERS ================================*/
const DRIVER_STATUSES = ['Available', 'On Trip', 'Off Duty', 'Suspended'];
PAGES.drivers = async function (page) {
  const actions = (can('reminders') ? `<button id="send-reminders" class="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold">✉️ Licence Reminders</button> ` : '') +
    (can('drivers') ? `<button id="add-driver" class="px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold">+ Add Driver</button>` : '');
  page.innerHTML = '';
  const tb = toolbar({ onSearch: v => load({ search: v }), actions,
    filters: [{ name: 'status', label: 'All statuses', options: DRIVER_STATUSES }] });
  page.appendChild(tb);
  const host = document.createElement('div'); page.appendChild(host);
  tb.querySelectorAll('[data-filter]').forEach(s => s.onchange = () => load());
  if (can('drivers')) tb.querySelector('#add-driver').onclick = () => driverForm();
  if (can('reminders')) tb.querySelector('#send-reminders').onclick = remindersModal;

  async function load(extra = {}) {
    const q = new URLSearchParams(extra);
    tb.querySelectorAll('[data-filter]').forEach(s => { if (s.value) q.set(s.dataset.filter, s.value); });
    const [rows, rmap] = await Promise.all([api('/drivers?' + q.toString()), ratingMap('drivers')]);
    host.innerHTML = card(tableShell(['Name', 'Licence No', 'Category', 'Expiry', 'Safety', 'Rating', 'Status', '']));
    const tbody = host.querySelector('tbody');
    if (!rows.length) { tbody.innerHTML = emptyRow(8); return; }
    tbody.innerHTML = rows.map(d => `<tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40">
      <td class="px-4 py-3 font-semibold">${esc(d.name)}</td>
      <td class="px-4 py-3 font-mono text-xs">${esc(d.license_number)}</td>
      <td class="px-4 py-3">${esc(d.license_category || '—')}</td>
      <td class="px-4 py-3">${d.license_expiry ? `<span class="${d.license_expired ? 'text-red-600 font-semibold' : ''}">${esc(d.license_expiry)}${d.license_expired ? ' ⚠️' : ''}</span>` : '—'}</td>
      <td class="px-4 py-3">${scoreBar(d.safety_score)}</td>
      <td class="px-4 py-3">${rmap[d.id] ? stars(rmap[d.id].stars, rmap[d.id].band) : '—'}</td>
      <td class="px-4 py-3">${badge(d.status)}</td>
      <td class="px-4 py-3 text-right whitespace-nowrap">
        ${can('drivers') ? actionBtn('Edit', 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200') + ' ' + actionBtn('Delete', 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30') : '<span class="text-xs text-slate-400">view only</span>'}
      </td></tr>`).join('');
    if (can('drivers')) tbody.querySelectorAll('tr').forEach((tr, i) => {
      const [edit, del] = tr.querySelectorAll('button');
      edit.onclick = () => driverForm(rows[i]);
      del.onclick = () => confirmDelete(`driver ${rows[i].name}`, async () => { await api(`/drivers/${rows[i].id}`, { method: 'DELETE' }); toast('Driver removed', 'success'); load(); });
    });
  }
  load();

  function driverForm(d = null) {
    openModal(d ? 'Edit Driver' : 'Add Driver', `
      <div class="mb-4 p-3 rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-slate-800">
        <div class="text-sm font-semibold mb-1">🪪 Auto-fill from licence image (OCR)</div>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-2">Upload the driver's licence — instead of typing, the OCR reads the number, category, expiry &amp; name for you.</p>
        <input id="df-lic" type="file" accept="image/*" class="block w-full text-xs mb-2 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-brand-600 file:text-white hover:file:bg-brand-700">
        <button type="button" id="df-scan" class="w-full py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold">Scan &amp; auto-fill</button>
        <div id="df-scan-result" class="mt-2 text-xs"></div>
      </div>
      <form id="df" class="space-y-3">
      ${field('Name', 'name', { value: d?.name || '', required: true })}
      <div class="grid grid-cols-2 gap-3">
        ${field('Licence Number', 'license_number', { value: d?.license_number || '', required: true, placeholder: 'TN02 20240006663' })}
        ${field('Licence Category', 'license_category', { value: d?.license_category || '', placeholder: 'LMV, HMV' })}
      </div>
      <div class="grid grid-cols-2 gap-3">
        ${field('Licence Expiry', 'license_expiry', { type: 'date', value: d?.license_expiry || '' })}
        ${field('Contact Number', 'contact_number', { value: d?.contact_number || '' })}
      </div>
      <div class="grid grid-cols-2 gap-3">
        ${field('Email (for reminders)', 'email', { type: 'email', value: d?.email || '' })}
        ${field('Safety Score', 'safety_score', { type: 'number', step: '1', value: d?.safety_score ?? 100 })}
      </div>
      ${selectField('Status', 'status', DRIVER_STATUSES, d?.status || 'Available')}
      <button class="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold">${d ? 'Save changes' : 'Create driver'}</button>
    </form>`, (root) => {
      const scanBtn = root.querySelector('#df-scan');
      scanBtn.onclick = async () => {
        const file = root.querySelector('#df-lic').files[0];
        if (!file) { toast('Choose a licence image first', 'warn'); return; }
        scanBtn.disabled = true; scanBtn.textContent = 'Scanning… (OCR)';
        const fd = new FormData(); fd.append('file', file);
        const res = root.querySelector('#df-scan-result');
        try {
          const r = await api('/documents/scan-licence', { method: 'POST', form: fd });
          if (!r.is_licence) {
            res.innerHTML = `<span class="text-red-600">⛔ ${esc(r.error || 'Not recognised as a licence.')}</span>`;
          } else {
            const f = r.fields, form = root.querySelector('#df');
            if (f.name) form.name.value = f.name;
            if (f.license_no) form.license_number.value = f.license_no;
            if (f.classes && f.classes.length) form.license_category.value = f.classes.join(', ');
            if (f.validity) form.license_expiry.value = f.validity;
            res.innerHTML = renderOcr(r);
            toast('Licence scanned — fields filled in below', 'success');
          }
        } catch (err) { res.innerHTML = `<span class="text-red-600">${esc(err.message)}</span>`; }
        finally { scanBtn.disabled = false; scanBtn.textContent = 'Scan & auto-fill'; }
      };
      root.querySelector('#df').onsubmit = async (e) => {
        e.preventDefault();
        const data = formData(e.target);
        data.safety_score = parseFloat(data.safety_score || 0);
        if (!data.license_expiry) delete data.license_expiry;
        try {
          if (d) await api(`/drivers/${d.id}`, { method: 'PUT', body: data });
          else await api('/drivers', { method: 'POST', body: data });
          toast(d ? 'Driver updated' : 'Driver created', 'success'); closeModal(); load();
        } catch (err) { toast(err.message, 'error'); }
      };
    });
  }
};
function scoreBar(score) {
  const s = Math.max(0, Math.min(100, score || 0));
  const color = s >= 80 ? 'bg-emerald-500' : s >= 60 ? 'bg-amber-500' : 'bg-red-500';
  return `<div class="flex items-center gap-2"><div class="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden"><div class="${color} h-full" style="width:${s}%"></div></div><span class="text-xs">${num(s)}</span></div>`;
}

async function remindersModal() {
  openModal('Licence Expiry Reminders', `<div id="rem-body" class="text-sm text-slate-400">Loading due drivers…</div>`, async (root) => {
    try {
      const data = await api('/reminders/due');
      const body = root.querySelector('#rem-body');
      if (!data.drivers.length) { body.innerHTML = `<p class="text-slate-500">No licences expiring within ${data.window_days} days. ✅</p>`; return; }
      body.innerHTML = `
        <p class="mb-3 text-slate-600 dark:text-slate-300">These ${data.drivers.length} driver(s) have a licence expiring within ${data.window_days} days (uses your Gmail sender):</p>
        <div class="space-y-2 mb-4 max-h-60 overflow-y-auto">${data.drivers.map(d => `
          <div class="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
            <div><div class="font-semibold">${esc(d.name)}</div><div class="text-xs text-slate-400">${esc(d.email || 'no email')}</div></div>
            <div class="text-right"><div class="${d.expired ? 'text-red-600' : 'text-amber-600'} font-semibold text-sm">${d.expired ? 'EXPIRED' : d.days_left + 'd left'}</div><div class="text-xs text-slate-400">${esc(d.expiry_date)}</div></div>
          </div>`).join('')}</div>
        <button id="rem-send" class="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold">Send reminder emails now</button>`;
      body.querySelector('#rem-send').onclick = async (e) => {
        e.target.disabled = true; e.target.textContent = 'Sending…';
        try {
          const r = await api('/reminders/send', { method: 'POST' });
          if (r.error) toast(r.error, 'error');
          else toast(`Sent ${r.sent} of ${r.total} reminder email(s).`, 'success');
          closeModal();
        } catch (err) { toast(err.message, 'error'); e.target.disabled = false; e.target.textContent = 'Send reminder emails now'; }
      };
    } catch (err) { root.querySelector('#rem-body').innerHTML = `<p class="text-red-600">${esc(err.message)}</p>`; }
  });
}

/* ============================ TRIPS ==================================*/
const TRIP_STATUSES = ['Draft', 'Dispatched', 'Completed', 'Cancelled'];
PAGES.trips = async function (page) {
  const actions = can('trips') ? `<button id="add-trip" class="px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold">+ Create Trip</button>` : '';
  page.innerHTML = '';
  const tb = toolbar({ onSearch: v => load({ search: v }), actions,
    filters: [{ name: 'status', label: 'All statuses', options: TRIP_STATUSES }] });
  page.appendChild(tb);
  const host = document.createElement('div'); page.appendChild(host);
  tb.querySelectorAll('[data-filter]').forEach(s => s.onchange = () => load());
  if (can('trips')) tb.querySelector('#add-trip').onclick = () => tripForm();

  async function load(extra = {}) {
    const q = new URLSearchParams(extra);
    tb.querySelectorAll('[data-filter]').forEach(s => { if (s.value) q.set(s.dataset.filter, s.value); });
    const rows = await api('/trips?' + q.toString());
    host.innerHTML = card(tableShell(['#', 'Route', 'Vehicle', 'Driver', 'Cargo', 'Distance', 'Status', 'Actions']));
    const tbody = host.querySelector('tbody');
    if (!rows.length) { tbody.innerHTML = emptyRow(8); return; }
    tbody.innerHTML = rows.map(t => `<tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40">
      <td class="px-4 py-3 text-slate-400">#${t.id}</td>
      <td class="px-4 py-3 font-medium">${esc(t.source)} → ${esc(t.destination)}</td>
      <td class="px-4 py-3 font-mono text-xs">${esc(t.vehicle_name || '')}</td>
      <td class="px-4 py-3">${esc(t.driver_name || '')}</td>
      <td class="px-4 py-3">${num(t.cargo_weight)} kg</td>
      <td class="px-4 py-3">${num(t.planned_distance)} km</td>
      <td class="px-4 py-3">${badge(t.status)}</td>
      <td class="px-4 py-3 text-right whitespace-nowrap" data-actions></td></tr>`).join('');
    tbody.querySelectorAll('tr').forEach((tr, i) => {
      const t = rows[i]; const cell = tr.querySelector('[data-actions]'); const btns = [];
      if (t.status === 'Draft' && can('trips')) {
        btns.push(['Dispatch', 'bg-blue-600 text-white hover:bg-blue-700', () => act(t.id, 'dispatch')]);
        btns.push(['Cancel', 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800', () => act(t.id, 'cancel')]);
      }
      if (t.status === 'Dispatched') {
        if (can('trips_complete')) btns.push(['Complete', 'bg-emerald-600 text-white hover:bg-emerald-700', () => completeForm(t)]);
        if (can('trips')) btns.push(['Cancel', 'text-red-600 hover:bg-red-50', () => act(t.id, 'cancel')]);
      }
      if (can('revenue')) btns.push(['₹ Revenue', 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200', () => revenueForm(t)]);
      cell.innerHTML = btns.length ? btns.map(([l, c]) => `<button class="px-2.5 py-1 rounded-lg text-xs font-medium ${c}">${l}</button>`).join(' ') : '<span class="text-xs text-slate-400">—</span>';
      cell.querySelectorAll('button').forEach((b, bi) => b.onclick = btns[bi][2]);
    });
  }
  async function act(id, action) { try { await api(`/trips/${id}/${action}`, { method: 'POST' }); toast(`Trip ${action}ed`, 'success'); load(); } catch (e) { toast(e.message, 'error'); } }
  load();

  async function tripForm() {
    const [vehicles, drivers] = await Promise.all([api('/vehicles/dispatchable'), api('/drivers/dispatchable')]);
    if (!vehicles.length || !drivers.length) {
      openModal('Create Trip', `<p class="text-slate-500">You need at least one <b>available vehicle</b> and one <b>eligible driver</b> to create a trip.<br><br>${!vehicles.length ? '⚠️ No dispatchable vehicles (all On Trip / In Shop / Retired).<br>' : ''}${!drivers.length ? '⚠️ No dispatchable drivers (all On Trip / Suspended / expired licence).' : ''}</p>`);
      return;
    }
    openModal('Create Trip', `<form id="tf" class="space-y-3">
      <div class="grid grid-cols-2 gap-3">
        ${field('Source', 'source', { required: true, placeholder: 'Chennai' })}
        ${field('Destination', 'destination', { required: true, placeholder: 'Madurai' })}
      </div>
      <div class="grid grid-cols-3 gap-3">
        ${field('Cargo (kg)', 'cargo_weight', { type: 'number', step: '1', value: 0 })}
        ${field('Distance (km)', 'planned_distance', { type: 'number', step: '1', value: 0 })}
        ${field('Duration (hrs)', 'planned_duration', { type: 'number', step: '0.5', value: 0 })}
      </div>
      <div class="p-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-slate-800">
        <button type="button" id="tf-suggest" class="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold">✨ Suggest best vehicle + driver</button>
        <p id="tf-suggest-result" class="text-xs text-slate-500 dark:text-slate-400 mt-2">Ranks eligible options by capacity fit, driver safety, maintenance risk, fair rotation &amp; idle time.</p>
      </div>
      ${selectField('Vehicle (available only)', 'vehicle_id', vehicles.map(v => ({ value: v.id, label: `${v.registration_number} — ${v.name} (max ${v.max_load_capacity}kg)` })))}
      ${selectField('Driver (eligible only)', 'driver_id', drivers.map(d => ({ value: d.id, label: `${d.name} — ${d.license_category || 'licence'}` })))}
      <div class="grid grid-cols-2 gap-3">
        ${field('Revenue', 'revenue', { type: 'number', step: '1', value: 0 })}
        <div class="flex items-end"><button type="button" id="tf-rev" class="w-full py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-sm font-medium">💡 Suggest revenue</button></div>
      </div>
      <p class="text-xs text-slate-400">Cargo must not exceed the selected vehicle's capacity — the server enforces this.</p>
      <button class="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold">Create draft trip</button>
    </form>`, (root) => {
      const form = root.querySelector('#tf');
      root.querySelector('#tf-suggest').onclick = async () => {
        const cargo = parseFloat(form.cargo_weight.value || 0);
        try {
          const r = await api('/trips/suggest', { method: 'POST', body: { cargo_weight: cargo, vehicle_type: null } });
          const box = root.querySelector('#tf-suggest-result');
          if (!r.best) { box.innerHTML = '<span class="text-amber-600">⚠️ No eligible vehicle+driver for that cargo weight.</span>'; return; }
          form.vehicle_id.value = r.best.vehicle_id;
          form.driver_id.value = r.best.driver_id;
          box.innerHTML = `✅ Suggested <b>${esc(r.best.vehicle)}</b> + <b>${esc(r.best.driver)}</b> — score ${r.best.score}
            <span class="text-slate-400">(fit ${r.best.capacity_fit}, safety ${r.best.safety}, maint ${r.best.maintenance_risk})</span>`;
          toast('Best match pre-selected', 'success');
        } catch (err) { toast(err.message, 'error'); }
      };
      root.querySelector('#tf-rev').onclick = async () => {
        const dist = parseFloat(form.planned_distance.value || 0);
        const cargo = parseFloat(form.cargo_weight.value || 0);
        if (!dist || !cargo) { toast('Enter cargo + distance first', 'warn'); return; }
        try {
          const r = await api(`/reports/suggest-revenue?distance=${dist}&cargo=${cargo}`);
          form.revenue.value = r.suggested_revenue;
          toast(`Suggested ₹${r.suggested_revenue} (${r.basis})`, 'info');
        } catch (err) { toast(err.message, 'error'); }
      };
      form.onsubmit = async (e) => {
        e.preventDefault();
        const d = formData(e.target);
        ['vehicle_id', 'driver_id'].forEach(k => d[k] = parseInt(d[k]));
        ['cargo_weight', 'planned_distance', 'planned_duration', 'revenue'].forEach(k => d[k] = parseFloat(d[k] || 0));
        try { await api('/trips', { method: 'POST', body: d }); toast('Trip created (Draft)', 'success'); closeModal(); load(); }
        catch (err) { toast(err.message, 'error'); }
      };
    });
  }

  function completeForm(t) {
    openModal(`Complete Trip #${t.id}`, `<form id="cf" class="space-y-3">
      <p class="text-sm text-slate-500">Enter the final odometer and fuel consumed. Vehicle & driver return to Available.</p>
      ${field('Final Odometer (km)', 'final_odometer', { type: 'number', step: '1', required: true })}
      ${field('Fuel Consumed (litres)', 'fuel_consumed', { type: 'number', step: '0.1', required: true })}
      ${field('Revenue (optional)', 'revenue', { type: 'number', step: '1', value: t.revenue || 0 })}
      <button class="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">Complete trip</button>
    </form>`, (root) => {
      root.querySelector('#cf').onsubmit = async (e) => {
        e.preventDefault();
        const d = formData(e.target);
        ['final_odometer', 'fuel_consumed', 'revenue'].forEach(k => d[k] = parseFloat(d[k] || 0));
        try { await api(`/trips/${t.id}/complete`, { method: 'POST', body: d }); toast('Trip completed', 'success'); closeModal(); load(); }
        catch (err) { toast(err.message, 'error'); }
      };
    });
  }

  function revenueForm(t) {
    openModal(`Set Revenue — Trip #${t.id}`, `<form id="rf" class="space-y-3">
      <p class="text-sm text-slate-500">Revenue feeds the Net Profit &amp; Vehicle ROI figures.</p>
      ${field('Revenue (₹)', 'revenue', { type: 'number', step: '1', value: t.revenue || 0, required: true })}
      <button class="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold">Save revenue</button>
    </form>`, (root) => {
      root.querySelector('#rf').onsubmit = async (e) => {
        e.preventDefault();
        const revenue = parseFloat(formData(e.target).revenue || 0);
        try { await api(`/trips/${t.id}/revenue`, { method: 'PUT', body: { revenue } }); toast('Revenue updated', 'success'); closeModal(); load(); }
        catch (err) { toast(err.message, 'error'); }
      };
    });
  }
};

/* ============================ MAINTENANCE ============================*/
PAGES.maintenance = async function (page) {
  const actions = can('maintenance') ? `<button id="add-m" class="px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold">+ Log Maintenance</button>` : '';
  page.innerHTML = '';
  const tb = toolbar({ search: false, actions, filters: [{ name: 'status', label: 'All statuses', options: ['Open', 'Closed'] }] });
  page.appendChild(tb);
  const host = document.createElement('div'); page.appendChild(host);
  tb.querySelectorAll('[data-filter]').forEach(s => s.onchange = () => load());
  if (can('maintenance')) tb.querySelector('#add-m').onclick = () => mForm();

  async function load() {
    const q = new URLSearchParams();
    tb.querySelectorAll('[data-filter]').forEach(s => { if (s.value) q.set(s.dataset.filter, s.value); });
    const rows = await api('/maintenance?' + q.toString());
    host.innerHTML = card(tableShell(['Vehicle', 'Service', 'Description', 'Cost', 'Date', 'Status', '']));
    const tbody = host.querySelector('tbody');
    if (!rows.length) { tbody.innerHTML = emptyRow(7); return; }
    tbody.innerHTML = rows.map(m => `<tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40">
      <td class="px-4 py-3 font-mono text-xs font-semibold">${esc(m.vehicle_name || '')}</td>
      <td class="px-4 py-3 font-medium">${esc(m.service_type)}</td>
      <td class="px-4 py-3 text-slate-500">${esc(m.description || '—')}</td>
      <td class="px-4 py-3">${money(m.cost)}</td>
      <td class="px-4 py-3">${esc(m.service_date || '')}</td>
      <td class="px-4 py-3">${badge(m.status)}</td>
      <td class="px-4 py-3 text-right">${(can('maintenance') && m.status === 'Open') ? actionBtn('Close ✔', 'bg-emerald-600 text-white hover:bg-emerald-700') : ''}</td></tr>`).join('');
    if (can('maintenance')) tbody.querySelectorAll('tr').forEach((tr, i) => {
      const b = tr.querySelector('button'); if (b) b.onclick = async () => { try { await api(`/maintenance/${rows[i].id}/close`, { method: 'POST' }); toast('Maintenance closed — vehicle restored', 'success'); load(); } catch (e) { toast(e.message, 'error'); } };
    });
  }
  load();

  async function mForm() {
    const vehicles = (await api('/vehicles')).filter(v => v.status !== 'Retired');
    openModal('Log Maintenance', `<form id="mf" class="space-y-3">
      <p class="text-sm text-slate-500">Opening a record moves the vehicle to <b>In Shop</b> and hides it from dispatch.</p>
      ${selectField('Vehicle', 'vehicle_id', vehicles.map(v => ({ value: v.id, label: `${v.registration_number} — ${v.name} (${v.status})` })))}
      ${field('Service Type', 'service_type', { required: true, placeholder: 'Oil Change' })}
      ${field('Description', 'description', {})}
      <div class="grid grid-cols-2 gap-3">
        ${field('Cost', 'cost', { type: 'number', step: '1', value: 0 })}
        ${selectField('Type', 'is_planned', [{ value: 'true', label: 'Planned service' }, { value: 'false', label: 'Unplanned repair' }], 'true')}
      </div>
      <div class="grid grid-cols-2 gap-3">
        ${field('Service Date', 'service_date', { type: 'date' })}
        ${field('Expected Return (ETA)', 'expected_completion_date', { type: 'date' })}
      </div>
      <button class="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold">Create record</button>
    </form>`, (root) => {
      root.querySelector('#mf').onsubmit = async (e) => {
        e.preventDefault();
        const d = formData(e.target); d.vehicle_id = parseInt(d.vehicle_id); d.cost = parseFloat(d.cost || 0);
        d.is_planned = d.is_planned === 'true';
        if (!d.service_date) delete d.service_date;
        if (!d.expected_completion_date) delete d.expected_completion_date;
        try { await api('/maintenance', { method: 'POST', body: d }); toast('Maintenance logged — vehicle In Shop', 'success'); closeModal(); load(); }
        catch (err) { toast(err.message, 'error'); }
      };
    });
  }
};

/* ============================ FUEL & EXPENSES ========================*/
PAGES.fuel = async function (page) {
  page.innerHTML = `
    <div class="flex flex-wrap gap-2 mb-4">
      ${can('fuel') ? `<button id="add-fuel" class="px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold">+ Fuel Log</button>` : ''}
      ${can('expenses') ? `<button id="add-exp" class="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold">+ Expense</button>` : ''}
    </div>
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div><h3 class="font-bold mb-2">⛽ Fuel Logs</h3><div id="fuel-host"></div></div>
      <div><h3 class="font-bold mb-2">🧾 Expenses (tolls, misc)</h3><div id="exp-host"></div></div>
    </div>`;
  if (can('fuel')) $('#add-fuel').onclick = fuelForm;
  if (can('expenses')) $('#add-exp').onclick = expForm;

  async function loadFuel() {
    const rows = await api('/fuel');
    $('#fuel-host').innerHTML = card(tableShell(['Vehicle', 'Litres', 'Cost', 'Odometer', 'Date', '']));
    const tb = $('#fuel-host tbody');
    tb.innerHTML = rows.length ? rows.map(f => `<tr class="border-b border-slate-100 dark:border-slate-800">
      <td class="px-4 py-2.5 font-mono text-xs font-semibold">${esc(f.vehicle_name || '')}</td>
      <td class="px-4 py-2.5">${num(f.liters)} L</td>
      <td class="px-4 py-2.5">${money(f.cost)}</td>
      <td class="px-4 py-2.5">${f.odometer ? num(f.odometer) + ' km' : '—'}</td>
      <td class="px-4 py-2.5">${esc(f.log_date || '')}</td>
      <td class="px-4 py-2.5 text-right">${can('fuel') ? actionBtn('✕', 'text-red-600 hover:bg-red-50') : ''}</td></tr>`).join('') : emptyRow(6);
    if (can('fuel')) tb.querySelectorAll('button').forEach((b, i) => b.onclick = () => confirmDelete('this fuel log', async () => { await api(`/fuel/${rows[i].id}`, { method: 'DELETE' }); toast('Deleted', 'success'); loadFuel(); }));
  }
  async function loadExp() {
    const rows = await api('/expenses');
    $('#exp-host').innerHTML = card(tableShell(['Vehicle', 'Category', 'Amount', 'Description', 'Date', '']));
    const tb = $('#exp-host tbody');
    tb.innerHTML = rows.length ? rows.map(x => `<tr class="border-b border-slate-100 dark:border-slate-800">
      <td class="px-4 py-2.5 font-mono text-xs font-semibold">${esc(x.vehicle_name || '—')}</td>
      <td class="px-4 py-2.5">${badge(x.category)}</td>
      <td class="px-4 py-2.5">${money(x.amount)}</td>
      <td class="px-4 py-2.5 text-slate-500">${esc(x.description || '—')}</td>
      <td class="px-4 py-2.5">${esc(x.expense_date || '')}</td>
      <td class="px-4 py-2.5 text-right">${can('expenses') ? actionBtn('✕', 'text-red-600 hover:bg-red-50') : ''}</td></tr>`).join('') : emptyRow(6);
    if (can('expenses')) tb.querySelectorAll('button').forEach((b, i) => b.onclick = () => confirmDelete('this expense', async () => { await api(`/expenses/${rows[i].id}`, { method: 'DELETE' }); toast('Deleted', 'success'); loadExp(); }));
  }
  loadFuel(); loadExp();

  async function fuelForm() {
    const vehicles = await api('/vehicles');
    openModal('Add Fuel Log', `<form id="ff" class="space-y-3">
      ${selectField('Vehicle', 'vehicle_id', vehicles.map(v => ({ value: v.id, label: v.registration_number + ' — ' + v.name })))}
      <div class="grid grid-cols-2 gap-3">
        ${field('Litres', 'liters', { type: 'number', step: '0.1', required: true })}
        ${field('Cost', 'cost', { type: 'number', step: '1', value: 0 })}
      </div>
      <div class="grid grid-cols-2 gap-3">
        ${field('Odometer (km)', 'odometer', { type: 'number', step: '1' })}
        ${field('Date', 'log_date', { type: 'date' })}
      </div>
      <button class="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold">Save fuel log</button>
    </form>`, (root) => {
      root.querySelector('#ff').onsubmit = async (e) => {
        e.preventDefault(); const d = formData(e.target);
        d.vehicle_id = parseInt(d.vehicle_id); ['liters', 'cost', 'odometer'].forEach(k => d[k] = d[k] ? parseFloat(d[k]) : null);
        if (!d.log_date) delete d.log_date; if (d.odometer === null) delete d.odometer;
        try { await api('/fuel', { method: 'POST', body: d }); toast('Fuel log added', 'success'); closeModal(); loadFuel(); }
        catch (err) { toast(err.message, 'error'); }
      };
    });
  }
  async function expForm() {
    const vehicles = await api('/vehicles');
    openModal('Add Expense', `<form id="ef" class="space-y-3">
      ${selectField('Vehicle (optional)', 'vehicle_id', [{ value: '', label: '— none —' }].concat(vehicles.map(v => ({ value: v.id, label: v.registration_number }))))}
      ${selectField('Category', 'category', ['Toll', 'Fine', 'Parking', 'Other'], 'Toll')}
      <div class="grid grid-cols-2 gap-3">
        ${field('Amount', 'amount', { type: 'number', step: '1', required: true })}
        ${field('Date', 'expense_date', { type: 'date' })}
      </div>
      ${field('Description', 'description', {})}
      <button class="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold">Save expense</button>
    </form>`, (root) => {
      root.querySelector('#ef').onsubmit = async (e) => {
        e.preventDefault(); const d = formData(e.target);
        d.amount = parseFloat(d.amount || 0); d.vehicle_id = d.vehicle_id ? parseInt(d.vehicle_id) : null;
        if (!d.vehicle_id) delete d.vehicle_id; if (!d.expense_date) delete d.expense_date;
        try { await api('/expenses', { method: 'POST', body: d }); toast('Expense added', 'success'); closeModal(); loadExp(); }
        catch (err) { toast(err.message, 'error'); }
      };
    });
  }
};

/* ============================ DOCUMENTS / OCR ========================*/
PAGES.documents = async function (page) {
  page.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      ${card(`<div class="p-5">
        <h3 class="font-bold mb-1">🪪 Verify a Driving Licence (OCR)</h3>
        <p class="text-sm text-slate-500 mb-4">Upload a licence image — your OCR pipeline extracts the fields and runs the Tier-2 authenticity checks.</p>
        <input id="scan-file" type="file" accept="image/*" class="block w-full text-sm mb-3
          file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-600 file:text-white hover:file:bg-brand-700">
        <button id="scan-btn" class="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold disabled:opacity-50">Scan licence</button>
        <div id="scan-result" class="mt-4"></div>
      </div>`)}
      ${card(`<div class="p-5">
        <h3 class="font-bold mb-1">📎 Attach Document to Driver / Vehicle</h3>
        <p class="text-sm text-slate-500 mb-4">Store RC, insurance or a licence. Licences are auto-OCR'd and can back-fill the driver's details.</p>
        <div id="upload-host">${can('documents') ? '' : '<p class="text-sm text-amber-600">Your role can view documents but not upload.</p>'}</div>
      </div>`)}
    </div>
    <h3 class="font-bold mt-6 mb-2">Stored Documents</h3>
    <div id="docs-host"></div>`;

  $('#scan-btn').onclick = async () => {
    const f = $('#scan-file').files[0];
    if (!f) { toast('Choose an image first', 'warn'); return; }
    const btn = $('#scan-btn'); btn.disabled = true; btn.textContent = 'Scanning… (OCR)';
    const fd = new FormData(); fd.append('file', f);
    try {
      const r = await api('/documents/scan-licence', { method: 'POST', form: fd });
      $('#scan-result').innerHTML = renderOcr(r);
    } catch (e) { $('#scan-result').innerHTML = `<p class="text-red-600 text-sm">${esc(e.message)}</p>`; }
    finally { btn.disabled = false; btn.textContent = 'Scan licence'; }
  };

  if (can('documents')) {
    const [vehicles, drivers] = await Promise.all([api('/vehicles'), api('/drivers')]);
    $('#upload-host').innerHTML = `<form id="uf" class="space-y-3">
      <input name="file" type="file" required class="block w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-700 file:text-white">
      ${selectField('Document Type', 'doc_type', ['Driving Licence', 'RC', 'Insurance', 'Permit', 'Other'], 'Driving Licence')}
      <div class="grid grid-cols-2 gap-3">
        ${selectField('Driver', 'driver_id', [{ value: '', label: '— none —' }].concat(drivers.map(d => ({ value: d.id, label: d.name }))))}
        ${selectField('Vehicle', 'vehicle_id', [{ value: '', label: '— none —' }].concat(vehicles.map(v => ({ value: v.id, label: v.registration_number }))))}
      </div>
      <button class="w-full py-2.5 rounded-lg bg-slate-700 hover:bg-slate-800 text-white font-semibold">Upload document</button>
    </form>`;
    $('#uf').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      if (!fd.get('driver_id')) fd.delete('driver_id');
      if (!fd.get('vehicle_id')) fd.delete('vehicle_id');
      try { await api('/documents/upload', { method: 'POST', form: fd }); toast('Document uploaded', 'success'); e.target.reset(); loadDocs(); }
      catch (err) { toast(err.message, 'error'); }
    };
  }

  async function loadDocs() {
    const rows = await api('/documents');
    $('#docs-host').innerHTML = card(tableShell(['File', 'Type', 'Linked to', 'OCR Verdict', 'Uploaded', '']));
    const tb = $('#docs-host tbody');
    tb.innerHTML = rows.length ? rows.map(d => `<tr class="border-b border-slate-100 dark:border-slate-800">
      <td class="px-4 py-2.5">${esc(d.filename)}</td>
      <td class="px-4 py-2.5">${esc(d.doc_type)}</td>
      <td class="px-4 py-2.5 text-xs text-slate-500">${d.driver_id ? 'Driver #' + d.driver_id : ''}${d.vehicle_id ? 'Vehicle #' + d.vehicle_id : ''}</td>
      <td class="px-4 py-2.5">${d.ocr_verdict ? badge(d.ocr_verdict === 'VERIFIED' ? 'Completed' : d.ocr_verdict === 'SUSPECT' ? 'Suspended' : 'Open') + ' <span class="text-xs">' + esc(d.ocr_verdict) + '</span>' : '—'}</td>
      <td class="px-4 py-2.5 text-xs">${esc((d.created_at || '').slice(0, 10))}</td>
      <td class="px-4 py-2.5 text-right">${can('documents') ? actionBtn('✕', 'text-red-600 hover:bg-red-50') : ''}</td></tr>`).join('') : emptyRow(6, 'No documents uploaded.');
    if (can('documents')) tb.querySelectorAll('button').forEach((b, i) => b.onclick = () => confirmDelete('this document', async () => { await api(`/documents/${rows[i].id}`, { method: 'DELETE' }); toast('Deleted', 'success'); loadDocs(); }));
  }
  loadDocs();
};

function renderOcr(r) {
  if (!r.is_licence) return `<div class="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">⛔ ${esc(r.error || 'Not recognised as a driving licence.')}</div>`;
  const f = r.fields, v = r.verdict;
  const rows = [['Name', f.name], ['Licence No', f.license_no], ['Issue Date', f.issue_date], ['Validity', f.validity], ['Classes', (f.classes || []).join(', ')]];
  return `
    <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm space-y-1 mb-3">
      ${rows.map(([k, val]) => `<div class="flex justify-between gap-3"><span class="text-slate-400">${k}</span><span class="font-medium text-right">${esc(val || '🔒 masked')}</span></div>`).join('')}
    </div>
    <div class="p-3 rounded-lg text-sm font-semibold ${v.name === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : v.name === 'SUSPECT' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}">
      ${esc(v.icon)} ${esc(v.name)} — <span class="font-normal">${esc(v.message)}</span>
    </div>
    <details class="mt-2 text-xs"><summary class="cursor-pointer text-slate-400">Consistency checks (${r.checks.length})</summary>
      <div class="mt-2 space-y-1">${r.checks.map(c => `<div>${c.status === 'pass' ? '✅' : c.status === 'fail' ? '❌' : '⚠️'} <b>${esc(c.label)}</b>: ${esc(c.detail)}</div>`).join('')}</div>
    </details>`;
}

/* ============================ INCIDENTS ==============================*/
const SEVERITY_BADGE = {
  Low: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  High: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};
PAGES.incidents = async function (page) {
  const actions = can('incidents') ? `<button id="add-i" class="px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold">+ Log Incident</button>` : '';
  page.innerHTML = '';
  const tb = toolbar({ search: false, actions, filters: [{ name: 'status', label: 'All statuses', options: ['Open', 'Resolved'] }] });
  page.appendChild(tb);
  const host = document.createElement('div'); page.appendChild(host);
  tb.querySelectorAll('[data-filter]').forEach(s => s.onchange = () => load());
  if (can('incidents')) tb.querySelector('#add-i').onclick = () => iForm();

  async function load() {
    const q = new URLSearchParams();
    tb.querySelectorAll('[data-filter]').forEach(s => { if (s.value) q.set(s.dataset.filter, s.value); });
    const rows = await api('/incidents?' + q.toString());
    host.innerHTML = card(tableShell(['Driver', 'Severity', 'Description', 'When', 'Status', '']));
    const tbody = host.querySelector('tbody');
    if (!rows.length) { tbody.innerHTML = emptyRow(6, 'No incidents logged. ✅'); return; }
    tbody.innerHTML = rows.map(i => `<tr class="border-b border-slate-100 dark:border-slate-800">
      <td class="px-4 py-3 font-semibold">${esc(i.driver_name || '#' + i.driver_id)}</td>
      <td class="px-4 py-3"><span class="px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_BADGE[i.severity] || ''}">${esc(i.severity)}</span></td>
      <td class="px-4 py-3 text-slate-500">${esc(i.description)}</td>
      <td class="px-4 py-3 text-xs">${esc((i.occurred_at || '').slice(0, 10))}</td>
      <td class="px-4 py-3">${badge(i.status)}</td>
      <td class="px-4 py-3 text-right whitespace-nowrap" data-a></td></tr>`).join('');
    if (can('incidents')) tbody.querySelectorAll('tr').forEach((tr, idx) => {
      const i = rows[idx]; const cell = tr.querySelector('[data-a]'); const btns = [];
      if (i.status === 'Open') btns.push(['Resolve', 'bg-emerald-600 text-white hover:bg-emerald-700', async () => { await api(`/incidents/${i.id}/resolve`, { method: 'POST' }); toast('Resolved', 'success'); load(); }]);
      btns.push(['✕', 'text-red-600 hover:bg-red-50', () => confirmDelete('this incident', async () => { await api(`/incidents/${i.id}`, { method: 'DELETE' }); toast('Deleted', 'success'); load(); })]);
      cell.innerHTML = btns.map(([l, c]) => `<button class="px-2.5 py-1 rounded-lg text-xs font-medium ${c}">${l}</button>`).join(' ');
      cell.querySelectorAll('button').forEach((b, bi) => b.onclick = btns[bi][2]);
    });
  }
  load();

  async function iForm() {
    const drivers = await api('/drivers');
    openModal('Log Safety Incident', `<form id="if" class="space-y-3">
      ${selectField('Driver', 'driver_id', drivers.map(d => ({ value: d.id, label: d.name })))}
      ${selectField('Severity', 'severity', ['Low', 'Medium', 'High'], 'Low')}
      <div>
        <label class="block text-sm font-medium mb-1">Description</label>
        <textarea name="description" required rows="3" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 outline-none" placeholder="What happened?"></textarea>
      </div>
      <button class="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold">Log incident</button>
    </form>`, (root) => {
      root.querySelector('#if').onsubmit = async (e) => {
        e.preventDefault();
        const d = formData(e.target); d.driver_id = parseInt(d.driver_id);
        try { await api('/incidents', { method: 'POST', body: d }); toast('Incident logged', 'success'); closeModal(); load(); }
        catch (err) { toast(err.message, 'error'); }
      };
    });
  }
};

/* ============================ REPORTS ================================*/
PAGES.reports = async function (page) {
  const s = await api('/reports/summary');
  const t = s.totals;
  const kpi = (label, val, color) => `<div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
    <div class="text-xs uppercase tracking-wide text-slate-400">${label}</div>
    <div class="text-2xl font-extrabold mt-1 ${color}">${val}</div></div>`;
  page.innerHTML = `
    <div class="flex justify-end gap-2 mb-4">
      <button id="csv" class="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold">⬇ Export CSV</button>
      <button id="pdf" class="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold">⬇ Export PDF</button>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      ${kpi('Operational Cost', money(t.operational_cost), 'text-amber-600')}
      ${kpi('Revenue', money(t.revenue), 'text-emerald-600')}
      ${kpi('Net', money(t.net), t.net >= 0 ? 'text-emerald-600' : 'text-red-600')}
      ${kpi('Fleet Efficiency', t.fleet_efficiency_km_per_l + ' km/L', 'text-brand-600')}
    </div>
    <h3 class="font-bold mb-2">Per-Vehicle Analytics</h3>
    <div id="rep-host"></div>
    <h3 class="font-bold mt-6 mb-2">🚩 Anomaly Detection <span class="text-xs font-normal text-slate-400">— fuel / expense entries &gt; 2σ from the rolling average</span></h3>
    <div id="anom-host"></div>`;
  $('#csv').onclick = () => downloadReport('csv');
  $('#pdf').onclick = () => downloadReport('pdf');
  api('/reports/anomalies').then(a => {
    const h = $('#anom-host'); if (!h) return;
    if (!a.flags.length) { h.innerHTML = card(`<div class="p-4 text-sm text-emerald-600">✅ No anomalies detected — all fuel &amp; expense entries look normal.</div>`); return; }
    h.innerHTML = card(tableShell(['Type', 'Vehicle / Category', 'Flag']));
    $('#anom-host tbody').innerHTML = a.flags.map(f => `<tr class="border-b border-slate-100 dark:border-slate-800">
      <td class="px-4 py-2.5">${badge(f.type === 'Fuel' ? 'On Trip' : 'In Shop')} ${esc(f.type)}</td>
      <td class="px-4 py-2.5 font-mono text-xs">${esc(f.vehicle)}</td>
      <td class="px-4 py-2.5 text-amber-600">⚠️ ${esc(f.detail)}</td></tr>`).join('');
  }).catch(() => {});
  $('#rep-host').innerHTML = card(tableShell(['Vehicle', 'Type', 'Distance', 'Efficiency', 'Fuel ₹', 'Maint. ₹', 'Op. Cost', 'Revenue', 'ROI']));
  const tb = $('#rep-host tbody');
  tb.innerHTML = s.vehicles.length ? s.vehicles.map(v => `<tr class="border-b border-slate-100 dark:border-slate-800">
    <td class="px-4 py-2.5 font-mono text-xs font-semibold">${esc(v.registration_number)}</td>
    <td class="px-4 py-2.5">${esc(v.type)}</td>
    <td class="px-4 py-2.5">${num(v.distance_km)} km</td>
    <td class="px-4 py-2.5">${v.fuel_efficiency_km_per_l} km/L</td>
    <td class="px-4 py-2.5">${money(v.fuel_cost)}</td>
    <td class="px-4 py-2.5">${money(v.maintenance_cost)}</td>
    <td class="px-4 py-2.5">${money(v.operational_cost)}</td>
    <td class="px-4 py-2.5">${money(v.revenue)}</td>
    <td class="px-4 py-2.5"><span class="font-semibold ${v.roi >= 0 ? 'text-emerald-600' : 'text-red-600'}">${(v.roi * 100).toFixed(1)}%</span></td></tr>`).join('') : emptyRow(9);
};
async function downloadReport(kind) {
  try {
    const blob = await api(`/reports/export.${kind}`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `transitops_report.${kind}`; a.click();
    URL.revokeObjectURL(url); toast(`${kind.toUpperCase()} downloaded`, 'success');
  } catch (e) { toast(e.message, 'error'); }
}

/* ============================ Confirm dialog ========================*/
function confirmDelete(what, onYes) {
  openModal('Please confirm', `<p class="text-sm text-slate-600 dark:text-slate-300 mb-5">Are you sure you want to delete <b>${esc(what)}</b>? This cannot be undone.</p>
    <div class="flex gap-2"><button id="cd-no" class="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 font-medium">Cancel</button>
    <button id="cd-yes" class="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold">Delete</button></div>`, (root) => {
    root.querySelector('#cd-no').onclick = closeModal;
    root.querySelector('#cd-yes').onclick = async () => { try { await onYes(); closeModal(); } catch (e) { toast(e.message, 'error'); } };
  });
}

/* ============================ Theme + chrome ========================*/
function applyTheme() {
  const dark = localStorage.getItem('to_theme') === 'dark' ||
    (!localStorage.getItem('to_theme') && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  const t = $('#theme-toggle'); if (t) t.textContent = dark ? '☀️' : '🌙';
}
function openSidebar() { $('#sidebar').classList.remove('-translate-x-full'); $('#backdrop').classList.remove('hidden'); }
function closeSidebar() { $('#sidebar').classList.add('-translate-x-full'); $('#backdrop').classList.add('hidden'); }

/* ============================ Boot ==================================*/
function wireChrome() {
  $('#login-form').onsubmit = async (e) => {
    e.preventDefault();
    const err = $('#login-error'); err.classList.add('hidden');
    try { await doLogin($('#login-email').value.trim(), $('#login-password').value); showApp(); }
    catch (ex) { err.textContent = ex.message; err.classList.remove('hidden'); }
  };
  $('#logout-btn').onclick = logout;
  $('#menu-btn').onclick = openSidebar;
  $('#backdrop').onclick = closeSidebar;
  $('#theme-toggle').onclick = () => {
    const dark = !document.documentElement.classList.contains('dark');
    localStorage.setItem('to_theme', dark ? 'dark' : 'light');
    applyTheme();
    if (State.user && State.route === 'dashboard') navigate('dashboard'); // redraw charts with new colors
  };
  renderDemoAccounts();
}

applyTheme();
wireChrome();
if (State.token && State.user) { showApp(); }
