/* TransitOps — SPA Application Logic
   ============================================================ */

// Icons (SVG paths from Heroicons)
const ICONS = {
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>`,
  trips: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  vehicles: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
  maintenance: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
  documents: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  roster: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  profile: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  compliance: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  incident: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  finance: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  report: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
};

const Role = {
  FLEET_MANAGER: "Fleet Manager",
  DRIVER: "Driver",
  SAFETY_OFFICER: "Safety Officer",
  FINANCIAL_ANALYST: "Financial Analyst",
  ADMIN: "Admin"
};

const ACCENTS = {
  [Role.FLEET_MANAGER]: { color: "#4f46e5", light: "#eef2ff" },
  [Role.DRIVER]: { color: "#0d9488", light: "#f0fdfa" },
  [Role.SAFETY_OFFICER]: { color: "#d97706", light: "#fffbeb" },
  [Role.FINANCIAL_ANALYST]: { color: "#059669", light: "#ecfdf5" },
  [Role.ADMIN]: { color: "#7c3aed", light: "#f5f3ff" }
};

// Global App State
let state = {
  token: localStorage.getItem("token"),
  role: localStorage.getItem("role"),
  name: localStorage.getItem("name"),
  email: localStorage.getItem("email"),
  currentPage: "dashboard",
  theme: localStorage.getItem("theme") || "light",
  activeAccidentsCount: 0
};

// Initialize theme
document.documentElement.setAttribute("data-theme", state.theme);

// Toast utility
function showToast(message, type = "success") {
  const host = document.getElementById("toast-host");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    ${type === 'success' ? '<span style="color:var(--c-green)">✓</span>' : '<span style="color:var(--c-red)">✗</span>'}
    <span>${message}</span>
  `;
  host.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// Request helper
async function request(url, options = {}) {
  options.headers = options.headers || {};
  if (state.token) {
    options.headers["Authorization"] = `Bearer ${state.token}`;
  }
  options.headers["Content-Type"] = "application/json";
  
  try {
    const res = await fetch(url, options);
    if (res.status === 401 || res.status === 403) {
      logout();
      throw new Error("Session expired.");
    }
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Server error.");
    }
    return await res.json();
  } catch (err) {
    showToast(err.message, "error");
    throw err;
  }
}

// Set active theme UI icons
function updateThemeIcon() {
  const moon = document.getElementById("theme-icon-moon");
  const sun = document.getElementById("theme-icon-sun");
  if (state.theme === "dark") {
    moon.style.display = "none";
    sun.style.display = "block";
  } else {
    moon.style.display = "block";
    sun.style.display = "none";
  }
}

// Dark Mode Toggle
document.getElementById("theme-toggle").addEventListener("click", () => {
  state.theme = state.theme === "light" ? "dark" : "light";
  localStorage.setItem("theme", state.theme);
  document.documentElement.setAttribute("data-theme", state.theme);
  updateThemeIcon();
});

// Mobile Sidebar Toggle
document.getElementById("menu-btn").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("sidebar-overlay").classList.toggle("visible");
});
document.getElementById("sidebar-overlay").addEventListener("click", () => {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebar-overlay").classList.remove("visible");
});

// Rating Stars Renderer
function renderStars(rating, band = "") {
  let colorClass = "";
  if (band === "green") colorClass = "green";
  else if (band === "amber") colorClass = "amber";
  else if (band === "red") colorClass = "red";
  
  let fullStars = Math.floor(rating);
  let halfStar = rating % 1 >= 0.5 ? 1 : 0;
  let emptyStars = 3 - fullStars - halfStar;
  
  let starsStr = "";
  for (let i = 0; i < fullStars; i++) starsStr += "★";
  if (halfStar) starsStr += "½";
  for (let i = 0; i < emptyStars; i++) starsStr += "☆";
  
  return `<span class="stars ${colorClass}">${starsStr} (${rating})</span>`;
}

// Setup Accent colors dynamically based on logged role
function applyAccentColors(role) {
  const accent = ACCENTS[role] || ACCENTS[Role.DRIVER];
  document.documentElement.style.setProperty("--c-accent", accent.color);
  document.documentElement.style.setProperty("--c-accent-light", accent.light);
}

// Sign-in tab toggle
document.getElementById("tab-login").addEventListener("click", () => {
  document.getElementById("tab-login").classList.add("active");
  document.getElementById("login-form-wrap").style.display = "block";
});

// Login Form Submit
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  const errorEl = document.getElementById("login-error");
  errorEl.classList.remove("visible");
  
  try {
    const res = await fetch("/api/auth/login-json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Invalid email or password.");
    }
    const data = await res.ok ? await res.json() : {};
    loginSuccess(data);
  } catch (err) {
    errorEl.innerText = err.message;
    errorEl.classList.add("visible");
  }
});

// Signup Form Submit
document.getElementById("signup-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("su-name").value;
  const email = document.getElementById("su-email").value;
  const password = document.getElementById("su-password").value;
  const phone = document.getElementById("su-phone").value;
  const licNum = document.getElementById("su-lic-num").value;
  const licCat = document.getElementById("su-lic-cat").value;
  const licExp = document.getElementById("su-lic-expiry").value || null;
  const errorEl = document.getElementById("signup-error");
  errorEl.classList.remove("visible");
  
  try {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, email, password, license_number: licNum,
        license_category: licCat, license_expiry: licExp, contact_number: phone
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Sign up failed.");
    }
    const data = await res.json();
    showToast("Registration successful!");
    loginSuccess(data);
  } catch (err) {
    errorEl.innerText = err.message;
    errorEl.classList.add("visible");
  }
});

// Demo accounts filler
const DEMO_ACCS = [
  { role: "Fleet Manager", email: "manager@transitops.com" },
  { role: "Driver", email: "driver@transitops.com" },
  { role: "Safety Officer", email: "safety@transitops.com" },
  { role: "Financial Analyst", email: "finance@transitops.com" },
  { role: "Admin", email: "admin@transitops.com" }
];
const demoHost = document.getElementById("demo-accounts");
DEMO_ACCS.forEach(acc => {
  const btn = document.createElement("button");
  btn.className = "btn btn-secondary btn-sm";
  btn.innerText = acc.role;
  btn.addEventListener("click", () => {
    document.getElementById("login-email").value = acc.email;
    document.getElementById("login-password").value = "transitops123";
    document.getElementById("login-btn").click();
  });
  demoHost.appendChild(btn);
});

function loginSuccess(data) {
  state.token = data.access_token;
  state.role = data.role;
  state.name = data.name;
  state.email = data.email;
  
  localStorage.setItem("token", data.access_token);
  localStorage.setItem("role", data.role);
  localStorage.setItem("name", data.name);
  localStorage.setItem("email", data.email);
  
  initApp();
}

function logout() {
  state.token = null;
  state.role = null;
  state.name = null;
  state.email = null;
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("name");
  localStorage.removeItem("email");
  
  document.getElementById("app").classList.remove("visible");
  document.getElementById("auth-screen").style.display = "flex";
}

document.getElementById("logout-btn").addEventListener("click", logout);

// Initialize Navigation and views
function buildSidebarNav() {
  const nav = document.getElementById("nav");
  nav.innerHTML = "";
  
  let menu = [];
  if (state.role === Role.ADMIN) {
    menu = [
      { page: "admin_overview", label: "System Overview", icon: "dashboard" },
      { page: "admin_users", label: "User Accounts", icon: "users" }
    ];
  } else if (state.role === Role.FLEET_MANAGER) {
    menu = [
      { page: "dashboard", label: "Dashboard", icon: "dashboard" },
      { page: "trips", label: "Trip Board", icon: "trips" },
      { page: "vehicles", label: "Vehicle Registry", icon: "vehicles" },
      { page: "maintenance", label: "Maintenance Logs", icon: "maintenance" },
      { page: "documents", label: "Vehicle Documents", icon: "documents" },
      { page: "roster", label: "Driver Roster", icon: "roster" }
    ];
  } else if (state.role === Role.DRIVER) {
    menu = [
      { page: "driver_trips", label: "My Trips", icon: "trips" },
      { page: "driver_vehicle", label: "My Vehicle", icon: "vehicles" },
      { page: "driver_profile", label: "My Profile", icon: "profile" }
    ];
  } else if (state.role === Role.SAFETY_OFFICER) {
    menu = [
      { page: "safety_compliance", label: "Compliance Board", icon: "compliance" },
      { page: "safety_drivers", label: "Driver Directory", icon: "roster" },
      { page: "safety_scores", label: "Safety Ratings", icon: "profile" },
      { page: "safety_incidents", label: "Incident Log", icon: "incident" }
    ];
  } else if (state.role === Role.FINANCIAL_ANALYST) {
    menu = [
      { page: "finance_dashboard", label: "Financial Dashboard", icon: "finance" },
      { page: "finance_revenue", label: "Revenue & Costs", icon: "trips" },
      { page: "finance_expenses", label: "Fuel & Expenses", icon: "vehicles" },
      { page: "finance_maint", label: "Maintenance Cost", icon: "maintenance" },
      { page: "finance_reports", label: "Reports & Export", icon: "report" }
    ];
  }
  
  menu.forEach(item => {
    const btn = document.createElement("button");
    btn.className = `nav-item ${state.currentPage === item.page ? 'active' : ''}`;
    btn.innerHTML = `${ICONS[item.icon]} <span>${item.label}</span>`;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.currentPage = item.page;
      document.getElementById("sidebar").classList.remove("open");
      document.getElementById("sidebar-overlay").classList.remove("visible");
      renderPage();
    });
    nav.appendChild(btn);
  });
}

// Show modal utility
function showModal(title, bodyHtml, footerHtml) {
  const card = document.getElementById("modal-card");
  card.innerHTML = `
    <div class="modal-header">
      <h3 class="modal-title">${title}</h3>
      <button class="icon-btn" id="modal-close-btn">&times;</button>
    </div>
    <div class="modal-body">${bodyHtml}</div>
    <div class="modal-footer">${footerHtml}</div>
  `;
  document.getElementById("modal-backdrop").classList.add("open");
  
  document.getElementById("modal-close-btn").addEventListener("click", closeModal);
}

function closeModal() {
  document.getElementById("modal-backdrop").classList.remove("open");
}

// Consolidated global metrics strip
async function renderOverviewStrip(hostEl) {
  try {
    const data = await request("/api/reports/summary");
    const complianceData = await request("/api/drivers");
    const activeTripsCount = (await request("/api/trips")).filter(t => t.status === "Dispatched").length;
    const incidentsData = await request("/api/incidents");
    const maintenanceData = await request("/api/maintenance");
    const vehiclesData = await request("/api/vehicles");
    
    // Fleet utilization calculation
    const activeVehicles = vehiclesData.filter(v => v.status !== "Retired");
    const onTripVehicles = vehiclesData.filter(v => v.status === "On Trip");
    const utilizationPct = activeVehicles.length ? Math.round((onTripVehicles.length / activeVehicles.length) * 100) : 0;
    
    // Compliance rate calculation
    const nonSuspendedDrivers = complianceData.filter(d => d.status !== "Suspended");
    const compliantDrivers = nonSuspendedDrivers.filter(d => !d.license_expired);
    const complianceRate = nonSuspendedDrivers.length ? Math.round((compliantDrivers.length / nonSuspendedDrivers.length) * 100) : 100;
    
    // In maintenance
    const inShopCount = vehiclesData.filter(v => v.status === "In Shop").length;
    
    // Safety flags
    const openIncidents = incidentsData.filter(i => i.status === "Open").length;
    const safetyFlags = complianceData.filter(d => d.status === "Suspended").length + openIncidents;
    
    hostEl.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Active Trips</div>
          <div class="kpi-value">${activeTripsCount}</div>
          <div class="kpi-sub text-muted">Trips currently on road</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Fleet Utilization</div>
          <div class="kpi-value">${utilizationPct}%</div>
          <div class="kpi-sub text-muted">Out of ${activeVehicles.length} active assets</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Compliance Rate</div>
          <div class="kpi-value ${complianceRate < 90 ? 'kpi-negative' : 'kpi-positive'}">${complianceRate}%</div>
          <div class="kpi-sub text-muted">Drivers with valid licenses</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Net Profit</div>
          <div class="kpi-value ${data.totals.net >= 0 ? 'kpi-positive' : 'kpi-negative'}">₹${data.totals.net.toLocaleString()}</div>
          <div class="kpi-sub text-muted">Total revenue vs expenses</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">In Maintenance</div>
          <div class="kpi-value">${inShopCount}</div>
          <div class="kpi-sub text-muted">Vehicles currently in shop</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Safety Flags</div>
          <div class="kpi-value ${safetyFlags > 0 ? 'kpi-negative' : 'kpi-neutral'}">${safetyFlags}</div>
          <div class="kpi-sub text-muted">Unresolved incidents / blocks</div>
        </div>
      </div>
    `;
  } catch (e) {
    hostEl.innerHTML = `<div class="alert alert-error">Failed to load global metrics strip.</div>`;
  }
}

// APP INITIALIZATION
function initApp() {
  document.getElementById("auth-screen").style.display = "none";
  document.getElementById("app").classList.add("visible");
  
  applyAccentColors(state.role);
  
  // Set user shell details
  document.getElementById("user-name").innerText = state.name;
  document.getElementById("user-role").innerText = state.role;
  document.getElementById("user-avatar").innerText = state.name ? state.name.substring(0,2).toUpperCase() : "US";
  
  // Determine default starting page based on role
  if (state.role === Role.ADMIN) state.currentPage = "admin_overview";
  else if (state.role === Role.FLEET_MANAGER) state.currentPage = "dashboard";
  else if (state.role === Role.DRIVER) state.currentPage = "driver_trips";
  else if (state.role === Role.SAFETY_OFFICER) state.currentPage = "safety_compliance";
  else if (state.role === Role.FINANCIAL_ANALYST) state.currentPage = "finance_dashboard";
  
  updateThemeIcon();
  buildSidebarNav();
  renderPage();
}

// Main page router/renderer
function renderPage() {
  const pageHost = document.getElementById("page");
  pageHost.innerHTML = `<div class="empty-state">Loading page views...</div>`;
  
  document.getElementById("page-title").innerText = state.currentPage.replace("_", " ").toUpperCase();
  
  switch(state.currentPage) {
    case "dashboard":
      renderFleetDashboard(pageHost);
      break;
    case "trips":
      renderTripManagement(pageHost);
      break;
    case "vehicles":
      renderVehicleRegistry(pageHost);
      break;
    case "maintenance":
      renderMaintenanceLogs(pageHost);
      break;
    case "documents":
      renderVehicleDocuments(pageHost);
      break;
    case "roster":
      renderDriverRoster(pageHost);
      break;
    case "driver_trips":
      renderDriverTrips(pageHost);
      break;
    case "driver_vehicle":
      renderDriverVehicle(pageHost);
      break;
    case "driver_profile":
      renderDriverProfile(pageHost);
      break;
    case "safety_compliance":
      renderSafetyCompliance(pageHost);
      break;
    case "safety_drivers":
      renderSafetyDrivers(pageHost);
      break;
    case "safety_scores":
      renderSafetyScores(pageHost);
      break;
    case "safety_incidents":
      renderSafetyIncidents(pageHost);
      break;
    case "finance_dashboard":
      renderFinanceDashboard(pageHost);
      break;
    case "finance_revenue":
      renderFinanceRevenue(pageHost);
      break;
    case "finance_expenses":
      renderFinanceExpenses(pageHost);
      break;
    case "finance_maint":
      renderFinanceMaint(pageHost);
      break;
    case "finance_reports":
      renderFinanceReports(pageHost);
      break;
    case "admin_overview":
      renderAdminOverview(pageHost);
      break;
    case "admin_users":
      renderAdminUsers(pageHost);
      break;
    default:
      pageHost.innerHTML = `<div class="empty-state">Page not found or role RBAC restricted.</div>`;
  }
}

// -------------------------------------------------------------
// FLEET MANAGER PAGES (6)
// -------------------------------------------------------------

async function renderFleetDashboard(host) {
  host.innerHTML = `
    <div id="metrics-strip"></div>
    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-title">Fleet Status Overview</div>
        <div class="chart-body"><canvas id="fleetStatusChart"></canvas></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Idle Vehicle Alerts (Status: Available & Idle)</div>
        <div class="chart-body" id="idle-vehicles-list">Loading...</div>
      </div>
    </div>
  `;
  
  const strip = document.getElementById("metrics-strip");
  renderOverviewStrip(strip);
  
  try {
    const vehicles = await request("/api/vehicles");
    const trips = await request("/api/trips");
    
    // Status breakdown chart
    const statusCounts = { Available: 0, "On Trip": 0, "In Shop": 0, Retired: 0 };
    vehicles.forEach(v => { statusCounts[v.status] = (statusCounts[v.status] || 0) + 1; });
    
    new Chart(document.getElementById("fleetStatusChart"), {
      type: "doughnut",
      data: {
        labels: Object.keys(statusCounts),
        datasets: [{
          data: Object.values(statusCounts),
          backgroundColor: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"]
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
    
    // Compute idle vehicles
    const idleListHost = document.getElementById("idle-vehicles-list");
    const idleVehicles = [];
    const now = new Date();
    
    vehicles.forEach(v => {
      if (v.status === "Available") {
        const vTrips = trips.filter(t => t.vehicle_id === v.id && t.status === "Completed");
        if (vTrips.length === 0) {
          idleVehicles.push({ vehicle: v, days: 99 }); // never dispatched
        } else {
          const lastTrip = vTrips.sort((a,b) => new Date(b.completed_at) - new Date(a.completed_at))[0];
          const diffTime = Math.abs(now - new Date(lastTrip.completed_at));
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays > 3) {
            idleVehicles.push({ vehicle: v, days: diffDays });
          }
        }
      }
    });
    
    if (idleVehicles.length === 0) {
      idleListHost.innerHTML = `<div class="empty-state"><p>All active vehicles are running efficiently.</p></div>`;
    } else {
      idleListHost.innerHTML = `
        <table class="text-sm">
          <thead>
            <tr><th>Reg Number</th><th>Model</th><th>Idle Time</th></tr>
          </thead>
          <tbody>
            ${idleVehicles.map(item => `
              <tr>
                <td><span class="fw-600">${item.vehicle.registration_number}</span></td>
                <td>${item.vehicle.name}</td>
                <td><span class="badge badge-amber">${item.days === 99 ? 'Never Dispatched' : item.days + ' days idle'}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
    }
  } catch(e) {}
}

async function renderTripManagement(host) {
  host.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-header-title">Trip Dispatch & Operations Board</h2>
        <p class="page-header-sub">Dispatch new trips, monitor active tasks, or reassign drivers</p>
      </div>
      <button class="btn btn-primary" id="btn-new-trip">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        New Trip Dispatch
      </button>
    </div>
    
    <div class="toolbar">
      <div class="toolbar-left">
        <button class="btn btn-secondary active" id="tab-all-trips">All Trips</button>
        <button class="btn btn-secondary" id="tab-dispatched-trips">Active</button>
        <button class="btn btn-secondary" id="tab-draft-trips">Drafts</button>
      </div>
    </div>
    
    <div class="card">
      <div class="table-wrap">
        <table id="trips-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Source / Destination</th>
              <th>Vehicle</th>
              <th>Driver</th>
              <th>Cargo Load</th>
              <th>Distance / ETA</th>
              <th>Revenue</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="trips-tbody">
            <tr><td colspan="9" class="text-muted" style="text-align:center">Loading trips logs...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  let tripsFilter = "all";
  
  async function loadTrips() {
    try {
      const trips = await request("/api/trips");
      const tbody = document.getElementById("trips-tbody");
      tbody.innerHTML = "";
      
      const filtered = trips.filter(t => {
        if (tripsFilter === "dispatched") return t.status === "Dispatched";
        if (tripsFilter === "draft") return t.status === "Draft";
        return true;
      });
      
      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center" class="text-muted">No trips match this filter.</td></tr>`;
        return;
      }
      
      filtered.forEach(t => {
        let statusBadge = "badge-gray";
        if (t.status === "Completed") statusBadge = "badge-green";
        else if (t.status === "Dispatched") statusBadge = "badge-blue";
        else if (t.status === "Cancelled") statusBadge = "badge-red";
        else if (t.status === "Draft") statusBadge = "badge-amber";
        
        tbody.innerHTML += `
          <tr>
            <td><span class="fw-600">TRIP-${t.id}</span></td>
            <td>
              <div class="fw-600">${t.source}</div>
              <div class="text-muted text-sm">➔ ${t.destination}</div>
            </td>
            <td>${t.vehicle_name || 'Unassigned'}</td>
            <td>${t.driver_name || 'Unassigned'}</td>
            <td>${t.cargo_weight.toLocaleString()} kg</td>
            <td>
              <div>${t.planned_distance} km</div>
              <div class="text-sm text-muted">${t.planned_duration || 0} hrs</div>
            </td>
            <td>₹${t.revenue.toLocaleString()}</td>
            <td><span class="badge ${statusBadge}">${t.status}</span></td>
            <td class="table-actions">
              ${t.status === "Draft" ? `
                <button class="btn btn-secondary btn-sm" onclick="dispatchTrip(${t.id})">Dispatch</button>
                <button class="btn btn-secondary btn-sm" onclick="editTripModal(${t.id})">Reassign</button>
                <button class="btn btn-danger btn-sm" onclick="deleteTrip(${t.id})">Delete</button>
              ` : ""}
              ${t.status === "Dispatched" ? `
                <button class="btn btn-secondary btn-sm" onclick="editTripModal(${t.id})">Reassign</button>
                <button class="btn btn-secondary btn-sm" onclick="cancelTrip(${t.id})">Cancel</button>
              ` : ""}
            </td>
          </tr>
        `;
      });
    } catch(e) {}
  }
  
  document.getElementById("tab-all-trips").addEventListener("click", () => {
    tripsFilter = "all";
    loadTrips();
  });
  document.getElementById("tab-dispatched-trips").addEventListener("click", () => {
    tripsFilter = "dispatched";
    loadTrips();
  });
  document.getElementById("tab-draft-trips").addEventListener("click", () => {
    tripsFilter = "draft";
    loadTrips();
  });
  
  document.getElementById("btn-new-trip").addEventListener("click", () => showNewTripModal(loadTrips));
  
  loadTrips();
}

window.dispatchTrip = async function(id) {
  if (confirm("Are you sure you want to dispatch this trip? Both driver and vehicle status will change to On Trip.")) {
    await request(`/api/trips/${id}/dispatch`, { method: "POST" });
    showToast("Trip dispatched successfully!");
    renderPage();
  }
};

window.cancelTrip = async function(id) {
  if (confirm("Are you sure you want to cancel this active trip? Vehicle and driver will be set back to Available.")) {
    await request(`/api/trips/${id}/cancel`, { method: "POST" });
    showToast("Trip cancelled successfully.");
    renderPage();
  }
};

window.deleteTrip = async function(id) {
  if (confirm("Are you sure you want to delete this trip record?")) {
    await request(`/api/trips/${id}`, { method: "DELETE" });
    showToast("Trip deleted.");
    renderPage();
  }
};

window.editTripModal = async function(id) {
  try {
    const trip = await request(`/api/trips/${id}`);
    const vehicles = await request("/api/vehicles");
    const drivers = await request("/api/drivers");
    
    // For vehicle dropdown: allow currently assigned vehicle OR any available vehicle
    const eligibleVehicles = vehicles.filter(v => v.status === "Available" || v.id === trip.vehicle_id);
    // For driver dropdown: allow currently assigned driver OR any available non-expired driver
    const eligibleDrivers = drivers.filter(d => (d.status === "Available" && !d.license_expired) || d.id === trip.driver_id);
    
    const isDraft = trip.status === "Draft";
    
    const bodyHtml = `
      <form id="edit-trip-form">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Source Location</label>
            <input id="et-source" type="text" class="form-control" value="${trip.source}" ${isDraft ? '' : 'disabled'} required>
          </div>
          <div class="form-group">
            <label class="form-label">Destination Location</label>
            <input id="et-destination" type="text" class="form-control" value="${trip.destination}" ${isDraft ? '' : 'disabled'} required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Cargo Weight (kg)</label>
            <input id="et-cargo" type="number" class="form-control" value="${trip.cargo_weight}" ${isDraft ? '' : 'disabled'} required>
          </div>
          <div class="form-group">
            <label class="form-label">Planned Distance (km)</label>
            <input id="et-distance" type="number" class="form-control" value="${trip.planned_distance}" ${isDraft ? '' : 'disabled'} required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Planned Duration (hrs)</label>
            <input id="et-duration" type="number" step="0.1" class="form-control" value="${trip.planned_duration || 0}" ${isDraft ? '' : 'disabled'} required>
          </div>
          <div class="form-group">
            <label class="form-label">Revenue (₹)</label>
            <input id="et-revenue" type="number" class="form-control" value="${trip.revenue}" required>
          </div>
        </div>
        
        ${isDraft ? `
        <div style="margin: 16px 0; padding: 12px; background:var(--c-bg); border-radius:var(--radius); display:flex; align-items:center; justify-content:space-between">
          <div>
            <div class="fw-600 text-sm">Smart Suggestion Algorithm</div>
            <div class="text-muted text-sm">Finds the optimal vehicle and driver match</div>
          </div>
          <button type="button" class="btn btn-primary btn-sm" id="btn-edit-suggest">Assign Driver/Vehicle</button>
        </div>
        ` : ''}
        
        <div class="form-group">
          <label class="form-label">Assigned Vehicle</label>
          <select id="et-vehicle" class="form-control" required>
            ${eligibleVehicles.map(v => `<option value="${v.id}" ${v.id === trip.vehicle_id ? 'selected' : ''}>${v.registration_number} (${v.name} - max ${v.max_load_capacity}kg) ${v.id === trip.vehicle_id ? '[CURRENT]' : ''}</option>`).join("")}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Assigned Driver</label>
          <select id="et-driver" class="form-control" required>
            ${eligibleDrivers.map(d => `<option value="${d.id}" ${d.id === trip.driver_id ? 'selected' : ''}>${d.name} (${d.license_category}) ${d.id === trip.driver_id ? '[CURRENT]' : ''}</option>`).join("")}
          </select>
        </div>
      </form>
    `;
    
    const footerHtml = `
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="btn-save-trip-edit">Save Changes</button>
    `;
    
    showModal(`Reassign Trip - TRIP-${trip.id}`, bodyHtml, footerHtml);
    
    if (isDraft) {
      document.getElementById("btn-edit-suggest").addEventListener("click", async () => {
        const cargo = document.getElementById("et-cargo").value;
        if (!cargo) {
          showToast("Please enter cargo weight to calculate suggestions.", "error");
          return;
        }
        const res = await request("/api/trips/suggest", {
          method: "POST",
          body: JSON.stringify({ cargo_weight: parseFloat(cargo) })
        });
        if (res && res.best && res.best.vehicle_id && res.best.driver_id) {
          document.getElementById("et-vehicle").value = res.best.vehicle_id;
          document.getElementById("et-driver").value = res.best.driver_id;
          showToast(`Suggested: ${res.best.vehicle} & ${res.best.driver} (Score: ${Math.round(res.best.score * 100)}%)`);
        } else {
          showToast("No eligible vehicle/driver match found for this load capacity.", "error");
        }
      });
    }
    
    document.getElementById("btn-save-trip-edit").addEventListener("click", async () => {
      const body = {
        vehicle_id: parseInt(document.getElementById("et-vehicle").value),
        driver_id: parseInt(document.getElementById("et-driver").value),
        revenue: parseFloat(document.getElementById("et-revenue").value || 0)
      };
      if (isDraft) {
        body.source = document.getElementById("et-source").value;
        body.destination = document.getElementById("et-destination").value;
        body.cargo_weight = parseFloat(document.getElementById("et-cargo").value);
        body.planned_distance = parseFloat(document.getElementById("et-distance").value);
        body.planned_duration = parseFloat(document.getElementById("et-duration").value);
      }
      
      await request(`/api/trips/${trip.id}`, {
        method: "PUT",
        body: JSON.stringify(body)
      });
      showToast("Trip updated & reassigned successfully!");
      closeModal();
      renderPage();
    });
  } catch(e) {}
};

async function showNewTripModal(callback) {
  try {
    const vehicles = await request("/api/vehicles");
    const drivers = await request("/api/drivers");
    
    const availVehicles = vehicles.filter(v => v.status === "Available");
    const availDrivers = drivers.filter(d => d.status === "Available" && !d.license_expired);
    
    const bodyHtml = `
      <form id="new-trip-form">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Source Location</label>
            <input id="t-source" type="text" class="form-control" placeholder="Origin" required>
          </div>
          <div class="form-group">
            <label class="form-label">Destination Location</label>
            <input id="t-destination" type="text" class="form-control" placeholder="Destination" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Cargo Weight (kg)</label>
            <input id="t-cargo" type="number" class="form-control" value="100" required>
          </div>
          <div class="form-group">
            <label class="form-label">Planned Distance (km)</label>
            <input id="t-distance" type="number" class="form-control" value="100" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Planned Duration (hrs)</label>
            <input id="t-duration" type="number" step="0.1" class="form-control" value="3.5" required>
          </div>
          <div class="form-group">
            <label class="form-label">Revenue (₹)</label>
            <input id="t-revenue" type="number" class="form-control" required>
          </div>
        </div>
        
        <div style="margin: 16px 0; padding: 12px; background:var(--c-bg); border-radius:var(--radius); display:flex; align-items:center; justify-content:space-between">
          <div>
            <div class="fw-600 text-sm">Smart Suggestion Algorithm</div>
            <div class="text-muted text-sm">Finds the optimal vehicle and driver match</div>
          </div>
          <button type="button" class="btn btn-primary btn-sm" id="btn-smart-suggest">Assign Driver/Vehicle</button>
        </div>
        
        <div class="form-group">
          <label class="form-label">Select Vehicle</label>
          <select id="t-vehicle" class="form-control" required>
            <option value="">-- Choose Available Vehicle --</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Select Driver</label>
          <select id="t-driver" class="form-control" required>
            <option value="">-- Choose Available Driver --</option>
            ${availDrivers.map(d => `<option value="${d.id}">${d.name} (${d.license_category})</option>`).join("")}
          </select>
        </div>
      </form>
    `;
    
    const footerHtml = `
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="btn-submit-trip">Create Draft</button>
    `;
    
    showModal("Create New Dispatch", bodyHtml, footerHtml);
    
    
    
    // Smart suggestion action
    document.getElementById("btn-smart-suggest").addEventListener("click", async () => {
      const cargo = document.getElementById("t-cargo").value;
      if (!cargo) {
        showToast("Please enter cargo weight to calculate suggestions.", "error");
        return;
      }
      const res = await request("/api/trips/suggest", {
        method: "POST",
        body: JSON.stringify({ cargo_weight: parseFloat(cargo) })
      });
      if (res && res.best && res.best.vehicle_id && res.best.driver_id) {
        document.getElementById("t-vehicle").value = res.best.vehicle_id;
        document.getElementById("t-driver").value = res.best.driver_id;
        showToast(`Suggested: ${res.best.vehicle} & ${res.best.driver} (Score: ${Math.round(res.best.score * 100)}%)`);
      } else {
        showToast("No eligible vehicle/driver match found for this load capacity.", "error");
      }
    });
    
    // Form Submit
    document.getElementById("btn-submit-trip").addEventListener("click", async () => {
      const body = {
        source: document.getElementById("t-source").value,
        destination: document.getElementById("t-destination").value,
        vehicle_id: parseInt(document.getElementById("t-vehicle").value),
        driver_id: parseInt(document.getElementById("t-driver").value),
        cargo_weight: parseFloat(document.getElementById("t-cargo").value),
        planned_distance: parseFloat(document.getElementById("t-distance").value),
        planned_duration: parseFloat(document.getElementById("t-duration").value),
        revenue: parseFloat(document.getElementById("t-revenue").value || 0)
      };
      
      if (!body.source || !body.destination || !body.vehicle_id || !body.driver_id) {
        showToast("Please complete all form inputs.", "error");
        return;
      }
      
      await request("/api/trips", {
        method: "POST",
        body: JSON.stringify(body)
      });
      showToast("Draft trip created successfully!");
      closeModal();
      callback();
    });

    // Handle vehicle dropdown dynamic filtering based on cargo
    const updateVehicleDropdown = () => {
        const cargo = parseFloat(document.getElementById("t-cargo").value || 0);
        const vSelect = document.getElementById("t-vehicle");
        const currentVal = vSelect.value;
        const validVehicles = availVehicles.filter(v => v.max_load_capacity >= cargo);
        vSelect.innerHTML = '<option value="">-- Choose Available Vehicle --</option>' + 
            validVehicles.map(v => `<option value="${v.id}">${v.registration_number} (${v.name} - max ${v.max_load_capacity}kg)</option>`).join("");
        if (validVehicles.find(v => v.id == currentVal)) {
            vSelect.value = currentVal;
        }
    };
    document.getElementById("t-cargo").addEventListener("input", updateVehicleDropdown);
    updateVehicleDropdown();
    
  } catch(e) {}
}

async function renderVehicleRegistry(host) {
  host.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-header-title">Master Vehicle Registry</h2>
        <p class="page-header-sub">Manage fleet assets, configurations, and active statuses</p>
      </div>
      <button class="btn btn-primary" id="btn-add-vehicle">Add Vehicle</button>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Reg Number</th>
              <th>Model Name</th>
              <th>Type</th>
              <th>Capacity</th>
              <th>Current Odometer</th>
              <th>Acquisition Cost</th>
              <th>Health Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="vehicles-tbody">
            <tr><td colspan="8" style="text-align:center" class="text-muted">Loading fleet list...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  async function loadVehicles() {
    try {
      const vehicles = await request("/api/vehicles");
      const ratings = await request("/api/ratings/vehicles");
      const tbody = document.getElementById("vehicles-tbody");
      tbody.innerHTML = "";
      
      vehicles.forEach(v => {
        const rating = ratings.find(r => r.vehicle_id === v.id);
        const starsHtml = rating ? renderStars(rating.stars, rating.band) : 'Not Rated';
        
        let statusBadge = "badge-gray";
        if (v.status === "Available") statusBadge = "badge-green";
        else if (v.status === "On Trip") statusBadge = "badge-blue";
        else if (v.status === "In Shop") statusBadge = "badge-amber";
        else if (v.status === "Retired") statusBadge = "badge-red";
        
        tbody.innerHTML += `
          <tr>
            <td><span class="fw-600">${v.registration_number}</span></td>
            <td>${v.name}</td>
            <td>${v.type}</td>
            <td>${v.max_load_capacity.toLocaleString()} kg</td>
            <td>${v.odometer.toLocaleString()} km</td>
            <td>₹${v.acquisition_cost.toLocaleString()}</td>
            <td>${starsHtml}</td>
            <td><span class="badge ${statusBadge}">${v.status}</span></td>
          </tr>
        `;
      });
    } catch(e) {}
  }
  
  document.getElementById("btn-add-vehicle").addEventListener("click", () => {
    const bodyHtml = `
      <form id="new-vehicle-form">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Registration Number</label>
            <input id="v-reg" type="text" class="form-control" placeholder="Plate number" required>
          </div>
          <div class="form-group">
            <label class="form-label">Model/Name</label>
            <input id="v-name" type="text" class="form-control" placeholder="Model name" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Vehicle Type</label>
            <select id="v-type" class="form-control" required>
              <option value="Van">Van</option>
              <option value="Truck">Truck</option>
              <option value="Car">Car</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Max Load Capacity (kg)</label>
            <input id="v-capacity" type="number" class="form-control" value="1000" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Current Odometer (km)</label>
            <input id="v-odo" type="number" class="form-control" value="0" required>
          </div>
          <div class="form-group">
            <label class="form-label">Acquisition Cost (₹)</label>
            <input id="v-cost" type="number" class="form-control" value="500000" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Service Interval (km)</label>
            <input id="v-interval" type="number" class="form-control" value="10000" required>
          </div>
          <div class="form-group">
            <label class="form-label">Acquisition Date</label>
            <input id="v-acqdate" type="date" class="form-control" required>
          </div>
        </div>
      </form>
    `;
    const footerHtml = `
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="btn-submit-vehicle">Save Vehicle</button>
    `;
    showModal("Register New Fleet Asset", bodyHtml, footerHtml);
    
    document.getElementById("btn-submit-vehicle").addEventListener("click", async () => {
      const body = {
        registration_number: document.getElementById("v-reg").value,
        name: document.getElementById("v-name").value,
        type: document.getElementById("v-type").value,
        max_load_capacity: parseFloat(document.getElementById("v-capacity").value),
        odometer: parseFloat(document.getElementById("v-odo").value),
        acquisition_cost: parseFloat(document.getElementById("v-cost").value),
        service_interval_km: parseFloat(document.getElementById("v-interval").value),
        acquisition_date: document.getElementById("v-acqdate").value || null,
        status: "Available"
      };
      
      await request("/api/vehicles", {
        method: "POST",
        body: JSON.stringify(body)
      });
      showToast("Vehicle registered successfully!");
      closeModal();
      loadVehicles();
    });
  });
  
  loadVehicles();
}

async function renderMaintenanceLogs(host) {
  host.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-header-title">Preventive & Corrective Maintenance</h2>
        <p class="page-header-sub">Log repairs and manage vehicle shop status</p>
      </div>
      <button class="btn btn-primary" id="btn-log-maint">New Maintenance Entry</button>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Vehicle</th>
              <th>Service Type</th>
              <th>Description</th>
              <th>Cost</th>
              <th>Classification</th>
              <th>Expected Return</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="maint-tbody">
            <tr><td colspan="9" style="text-align:center" class="text-muted">Loading maintenance dashboard...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  async function loadLogs() {
    try {
      const logs = await request("/api/maintenance");
      const tbody = document.getElementById("maint-tbody");
      tbody.innerHTML = "";
      
      if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center" class="text-muted">No maintenance logs found.</td></tr>`;
        return;
      }
      
      logs.forEach(l => {
        let statusBadge = l.status === "Open" ? "badge-amber" : "badge-green";
        tbody.innerHTML += `
          <tr>
            <td><span class="fw-600">MNT-${l.id}</span></td>
            <td>${l.vehicle_name}</td>
            <td><span class="fw-600">${l.service_type}</span></td>
            <td>${l.description || 'No notes'}</td>
            <td>₹${l.cost.toLocaleString()}</td>
            <td><span class="badge ${l.is_planned ? 'badge-blue' : 'badge-red'}">${l.is_planned ? 'Planned' : 'Unplanned'}</span></td>
            <td>${l.expected_completion_date || 'N/A'}</td>
            <td><span class="badge ${statusBadge}">${l.status}</span></td>
            <td class="table-actions">
              ${l.status === "Open" ? `<button class="btn btn-secondary btn-sm" onclick="closeMaint(${l.id})">Close Record</button>` : 'Closed'}
            </td>
          </tr>
        `;
      });
    } catch(e) {}
  }
  
  document.getElementById("btn-log-maint").addEventListener("click", async () => {
    const vehicles = await request("/api/vehicles");
    const activeVehicles = vehicles.filter(v => v.status !== "Retired");
    
    const bodyHtml = `
      <form id="new-maint-form">
        <div class="form-group">
          <label class="form-label">Select Vehicle</label>
          <select id="m-vehicle" class="form-control" required>
            ${activeVehicles.map(v => `<option value="${v.id}">${v.registration_number} (${v.name})</option>`).join("")}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Service Type</label>
          <input id="m-type" type="text" class="form-control" placeholder="e.g. Oil Change, Clutch Fix" required>
        </div>
        <div class="form-group">
          <label class="form-label">Description / Symptoms</label>
          <textarea id="m-desc" class="form-control" rows="2" placeholder="Details..."></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Estimated Cost (₹)</label>
            <input id="m-cost" type="number" class="form-control" value="0">
          </div>
          <div class="form-group">
            <label class="form-label">Service Nature</label>
            <select id="m-planned" class="form-control">
              <option value="true">Routine Planned Service</option>
              <option value="false">Unplanned Breakdown / Repair</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Expected Completion Date</label>
          <input id="m-eta" type="date" class="form-control" required>
        </div>
      </form>
    `;
    const footerHtml = `
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="btn-submit-maint">Put in Shop</button>
    `;
    showModal("Create Maintenance Record", bodyHtml, footerHtml);
    
    document.getElementById("btn-submit-maint").addEventListener("click", async () => {
      const body = {
        vehicle_id: parseInt(document.getElementById("m-vehicle").value),
        service_type: document.getElementById("m-type").value,
        description: document.getElementById("m-desc").value,
        cost: parseFloat(document.getElementById("m-cost").value || 0),
        is_planned: document.getElementById("m-planned").value === "true",
        expected_completion_date: document.getElementById("m-eta").value || null
      };
      
      await request("/api/maintenance", {
        method: "POST",
        body: JSON.stringify(body)
      });
      showToast("Vehicle has been moved to Shop.");
      closeModal();
      loadLogs();
    });
  });
  
  loadLogs();
}

window.closeMaint = async function(id) {
  if (confirm("Are you sure you want to close this record? Vehicle status will be set back to Available.")) {
    await request(`/api/maintenance/${id}/close`, { method: "POST" });
    showToast("Maintenance record closed successfully.");
    renderPage();
  }
};

async function renderVehicleDocuments(host) {
  host.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-header-title">Document Expiry Tracker</h2>
        <p class="page-header-sub">Monitor permits, registrations, and insurance deadlines</p>
      </div>
    </div>
    
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Document Type</th>
              <th>Document Number</th>
              <th>Expiry Date</th>
              <th>Days Left</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="docs-tbody">
            <tr><td colspan="6" style="text-align:center" class="text-muted">Analyzing documents expiry dates...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  try {
    const docs = await request("/api/documents");
    const tbody = document.getElementById("docs-tbody");
    tbody.innerHTML = "";
    
    const vDocs = docs.filter(d => d.vehicle_id !== null);
    if (vDocs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center" class="text-muted">No vehicle documents registered.</td></tr>`;
      return;
    }
    
    const now = new Date();
    vDocs.forEach(d => {
      const exp = new Date(d.expiry_date);
      const diffTime = exp - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let statusBadge = "badge-green";
      let statusText = "Valid";
      
      if (diffDays < 0) {
        statusBadge = "badge-red";
        statusText = "Expired";
      } else if (diffDays <= 30) {
        statusBadge = "badge-amber";
        statusText = "Expiring Soon";
      }
      
      tbody.innerHTML += `
        <tr>
          <td><span class="fw-600">${d.vehicle_name}</span></td>
          <td>${d.doc_type}</td>
          <td>${d.document_number || 'N/A'}</td>
          <td>${d.expiry_date}</td>
          <td><span class="fw-600">${diffDays < 0 ? 'Expired' : diffDays + ' days left'}</span></td>
          <td><span class="badge ${statusBadge}">${statusText}</span></td>
        </tr>
      `;
    });
  } catch(e) {}
}

async function renderDriverRoster(host) {
  host.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-header-title">Operational Driver Roster</h2>
        <p class="page-header-sub">Read-only roster for active driver status and categories</p>
      </div>
      <button class="btn btn-primary" id="btn-add-driver">Add Driver</button>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Driver Name</th>
              <th>License Category</th>
              <th>License Expiry</th>
              <th>Contact Number</th>
              <th>Operational Status</th>
            </tr>
          </thead>
          <tbody id="roster-tbody">
            <tr><td colspan="5" style="text-align:center" class="text-muted">Loading driver roster...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  try {
    const drivers = await request("/api/drivers");
    const tbody = document.getElementById("roster-tbody");
    tbody.innerHTML = "";
    
    drivers.forEach(d => {
      let statusBadge = "badge-gray";
      if (d.status === "Available") statusBadge = "badge-green";
      else if (d.status === "On Trip") statusBadge = "badge-blue";
      else if (d.status === "Suspended") statusBadge = "badge-red";
      
      tbody.innerHTML += `
        <tr>
          <td><span class="fw-600">${d.name}</span></td>
          <td>${d.license_category || 'N/A'}</td>
          <td>${d.license_expiry || 'N/A'}</td>
          <td>${d.contact_number || 'N/A'}</td>
          <td><span class="badge ${statusBadge}">${d.status}</span></td>
        </tr>
      `;
    });
  } catch(e) {}

  document.getElementById("btn-add-driver").addEventListener("click", () => {
    const bodyHtml = `
      <form id="new-driver-form">
        <div class="form-group" style="padding: 10px; background: var(--c-bg); border-radius: var(--radius); border: 1px dashed var(--c-accent);">
          <label class="form-label">Upload License (Auto-fill with OCR)</label>
          <div style="display: flex; gap: 8px;">
            <input type="file" id="d-license-img" class="form-control" accept="image/*" style="flex:1">
            <button type="button" class="btn btn-secondary btn-sm" id="btn-scan-ocr">Scan</button>
          </div>
          <div id="ocr-status" class="text-sm text-muted mt-2"></div>
        </div>
        <div class="form-row mt-3">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input id="d-name" type="text" class="form-control" required>
          </div>
          <div class="form-group">
            <label class="form-label">Email (For reminders)</label>
            <input id="d-email" type="email" class="form-control" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">License Number</label>
            <input id="d-lic-num" type="text" class="form-control" required>
          </div>
          <div class="form-group">
            <label class="form-label">License Category</label>
            <input id="d-lic-cat" type="text" class="form-control" placeholder="LMV, HMV">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">License Expiry</label>
            <input id="d-lic-exp" type="date" class="form-control" required>
          </div>
          <div class="form-group">
            <label class="form-label">Contact Phone</label>
            <input id="d-phone" type="text" class="form-control">
          </div>
        </div>
      </form>
    `;
    const footerHtml = `
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="btn-submit-driver">Create Driver</button>
    `;
    showModal("Register New Driver", bodyHtml, footerHtml);
    
    let uploadedFile = null;

    document.getElementById("d-license-img").addEventListener("change", () => {
      document.getElementById("btn-scan-ocr").click();
    });
 
    document.getElementById("btn-scan-ocr").addEventListener("click", async () => {
      const fileInput = document.getElementById("d-license-img");
      if (!fileInput.files || fileInput.files.length === 0) {
        showToast("Select an image first", "error");
        return;
      }
      uploadedFile = fileInput.files[0];
      const formData = new FormData();
      formData.append("file", uploadedFile);
      
      const status = document.getElementById("ocr-status");
      status.innerHTML = `<span style="color:var(--c-amber)">Scanning license via OCR...</span>`;
      
      try {
        const res = await fetch("/api/documents/scan-licence", {
          method: "POST",
          headers: { "Authorization": `Bearer ${state.token}` },
          body: formData
        });
        if (!res.ok) throw new Error("OCR Failed");
        const data = await res.json();
        
        if (data.is_licence && data.fields) {
          if (data.fields.name) document.getElementById("d-name").value = data.fields.name;
          if (data.fields.license_no) document.getElementById("d-lic-num").value = data.fields.license_no;
          if (data.fields.classes) document.getElementById("d-lic-cat").value = data.fields.classes.join(", ");
          status.innerHTML = `<span style="color:var(--c-green)">OCR Success! Verify fields below. Verdict: ${data.verdict.name}</span>`;
          showToast("License scanned successfully");
        } else {
          status.innerHTML = `<span style="color:var(--c-red)">Not recognized as a valid driving license.</span>`;
        }
      } catch(e) {
        status.innerHTML = `<span style="color:var(--c-red)">OCR Error: ${e.message}</span>`;
      }
    });

    document.getElementById("btn-submit-driver").addEventListener("click", async () => {
      const body = {
        name: document.getElementById("d-name").value,
        email: document.getElementById("d-email").value,
        license_number: document.getElementById("d-lic-num").value,
        license_category: document.getElementById("d-lic-cat").value,
        license_expiry: document.getElementById("d-lic-exp").value || null,
        contact_number: document.getElementById("d-phone").value,
        status: "Available"
      };
      
      if (!body.name || !body.license_number) {
        showToast("Name and License Number are required", "error");
        return;
      }

      try {
        const dRes = await request("/api/drivers", {
          method: "POST",
          body: JSON.stringify(body)
        });
        
        if (uploadedFile) {
          const docForm = new FormData();
          docForm.append("file", uploadedFile);
          docForm.append("doc_type", "Driving Licence");
          docForm.append("driver_id", dRes.id);
          
          await fetch("/api/documents/upload", {
            method: "POST",
            headers: { "Authorization": `Bearer ${state.token}` },
            body: docForm
          });
        }
        
        showToast("Driver added successfully!");
        closeModal();
        // reload list
        renderDriverRoster(document.getElementById("page"));
      } catch(e) {}
    });
  });
}

// -------------------------------------------------------------
// DRIVER PAGES (4)
// -------------------------------------------------------------

async function renderDriverTrips(host) {
  host.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-header-title">My Dispatched Tasks</h2>
        <p class="page-header-sub">Execute active routes or view completed trip logs</p>
      </div>
    </div>
    
    <div id="driver-active-trip-section" class="mb-4"></div>
    
    <div class="card">
      <div class="card-header"><span class="card-title">Completed Trip History</span></div>
      <div class="card-body">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Trip ID</th>
                <th>Source/Destination</th>
                <th>Vehicle Used</th>
                <th>Cargo Load</th>
                <th>Total Fuel Cost</th>
                <th>Odometer Range</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="driver-trips-tbody">
              <tr><td colspan="7" style="text-align:center" class="text-muted">Checking trip logs...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  
  try {
    const trips = await request("/api/trips");
    const activeSection = document.getElementById("driver-active-trip-section");
    const tbody = document.getElementById("driver-trips-tbody");
    tbody.innerHTML = "";
    
    const drivers = await request("/api/drivers");
    const meDriver = drivers.find(d => d.email === state.email);
    const myDriverId = meDriver ? meDriver.id : -1;
    
    // Filter trips for this driver
    const driverTrips = trips.filter(t => t.driver_id === myDriverId);
    const activeTrip = driverTrips.find(t => t.status === "Dispatched");
    
    if (activeTrip) {
      activeSection.innerHTML = `
        <div class="card" style="border-left: 5px solid var(--c-accent)">
          <div class="card-header"><span class="card-title">Active Dispatched Trip</span></div>
          <div class="card-body">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px">
              <div>
                <div style="font-size:1.2rem; font-weight:700">${activeTrip.source} ➔ ${activeTrip.destination}</div>
                <div class="text-muted text-sm" style="margin-top:4px">Vehicle: ${activeTrip.vehicle_name} | Cargo weight: ${activeTrip.cargo_weight} kg</div>
                <div class="text-muted text-sm">Estimated Distance: ${activeTrip.planned_distance} km | Duration: ${activeTrip.planned_duration} hrs</div>
              </div>
              <button class="btn btn-primary" onclick="renderDriverTripExecution(${activeTrip.id})">Execute & Complete Trip</button>
            </div>
          </div>
        </div>
      `;
    } else {
      activeSection.innerHTML = `
        <div class="alert alert-info">
          No active dispatched trips. Sit tight or report to the Fleet Manager for schedules.
        </div>
      `;
    }
    
    const completedTrips = driverTrips.filter(t => t.status === "Completed" || t.status === "Cancelled");
    if (completedTrips.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center" class="text-muted">No completed trip history.</td></tr>`;
      return;
    }
    
    completedTrips.forEach(t => {
      tbody.innerHTML += `
        <tr>
          <td><span class="fw-600">TRIP-${t.id}</span></td>
          <td>${t.source} ➔ ${t.destination}</td>
          <td>${t.vehicle_name}</td>
          <td>${t.cargo_weight.toLocaleString()} kg</td>
          <td>${t.fuel_consumed ? t.fuel_consumed + ' L' : 'N/A'}</td>
          <td>${t.start_odometer} - ${t.final_odometer} km</td>
          <td><span class="badge ${t.status === 'Completed' ? 'badge-green' : 'badge-red'}">${t.status}</span></td>
        </tr>
      `;
    });
    
  } catch(e) {}
}

window.renderDriverTripExecution = async function(tripId) {
  const host = document.getElementById("page");
  document.getElementById("page-title").innerText = "TRIP EXECUTION";
  
  try {
    const trip = await request(`/api/trips/${tripId}`);
    
    host.innerHTML = `
      <div class="page-header">
        <div>
          <h2 class="page-header-title">Execute Trip - TRIP-${trip.id}</h2>
          <p class="page-header-sub">Submit logs and final odometer range on completion</p>
        </div>
      </div>
      
      <div class="card" style="max-width: 500px; margin: 0 auto">
        <div class="card-body">
          <form id="trip-complete-form">
            <div class="form-group">
              <label class="form-label">Current Start Odometer</label>
              <input type="text" class="form-control" value="${trip.start_odometer || 0} km" disabled>
            </div>
            <div class="form-group">
              <label class="form-label">Final Odometer Reading (km)</label>
              <input id="c-final-odo" type="number" class="form-control" required min="${trip.start_odometer || 0}">
            </div>
            <div class="form-group">
              <label class="form-label">Fuel Consumed (Liters)</label>
              <input id="c-fuel" type="number" class="form-control" required min="1">
            </div>
            <div class="form-group">
              <label class="form-label">E-POD (Proof of Delivery)</label>
              <input type="file" id="c-pod-file" class="form-control" accept="image/*">
              <div class="text-sm text-muted mt-1">Upload a photo of delivery receipt or signature.</div>
            </div>
            <button type="submit" class="btn btn-primary btn-full mt-2" id="c-submit-btn">Log Completion</button>
          </form>
        </div>
      </div>
    `;
    
    document.getElementById("trip-complete-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const finalOdo = parseFloat(document.getElementById("c-final-odo").value);
      const fuel = parseFloat(document.getElementById("c-fuel").value);
      const podFile = document.getElementById("c-pod-file").files[0];
      const btn = document.getElementById("c-submit-btn");
      
      btn.disabled = true;
      btn.textContent = "Submitting...";
      
      try {
        await request(`/api/trips/${trip.id}/complete`, {
          method: "POST",
          body: JSON.stringify({ final_odometer: finalOdo, fuel_consumed: fuel })
        });
        
        if (podFile) {
          const fd = new FormData();
          fd.append("file", podFile);
          await fetch(`/api/trips/${trip.id}/pod`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${state.token}` },
            body: fd
          });
        }
        
        showToast("Trip completed. Drive Safe!");
        state.currentPage = "driver_trips";
        renderPage();
      } catch(e) {
        btn.disabled = false;
        btn.textContent = "Log Completion";
      }
    });
  } catch(e) {}
};

async function renderDriverVehicle(host) {
  host.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-header-title">My Assigned Vehicle</h2>
        <p class="page-header-sub">Read-only metrics of your last assigned vehicle</p>
      </div>
    </div>
    <div id="driver-vehicle-host">Checking vehicle assignment...</div>
  `;
  
  try {
    const trips = await request("/api/trips");
    const drivers = await request("/api/drivers");
    const meDriver = drivers.find(d => d.email === state.email);
    const myDriverId = meDriver ? meDriver.id : -1;
    const driverTrips = trips.filter(t => t.driver_id === myDriverId);
    
    if (driverTrips.length === 0) {
      document.getElementById("driver-vehicle-host").innerHTML = `<div class="alert alert-info">No vehicle has been assigned to you yet.</div>`;
      return;
    }
    
    const lastTrip = driverTrips[0]; // order is desc
    const vehicle = await request(`/api/vehicles/${lastTrip.vehicle_id}`);
    
    let statusBadge = "badge-gray";
    if (vehicle.status === "Available") statusBadge = "badge-green";
    else if (vehicle.status === "On Trip") statusBadge = "badge-blue";
    else if (vehicle.status === "In Shop") statusBadge = "badge-amber";
    
    document.getElementById("driver-vehicle-host").innerHTML = `
      <div class="card" style="max-width:600px">
        <div class="card-header"><span class="card-title">${vehicle.name} — ${vehicle.registration_number}</span></div>
        <div class="card-body">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px">
            <div>
              <div class="text-muted text-sm">Vehicle Classification</div>
              <div class="fw-600" style="font-size:1.1rem">${vehicle.type}</div>
            </div>
            <div>
              <div class="text-muted text-sm">Load Limit</div>
              <div class="fw-600" style="font-size:1.1rem">${vehicle.max_load_capacity.toLocaleString()} kg</div>
            </div>
            <div>
              <div class="text-muted text-sm">Odometer Reading</div>
              <div class="fw-600" style="font-size:1.1rem">${vehicle.odometer.toLocaleString()} km</div>
            </div>
            <div>
              <div class="text-muted text-sm">Status</div>
              <div><span class="badge ${statusBadge}">${vehicle.status}</span></div>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch(e) {}
}

async function renderDriverProfile(host) {
  host.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-header-title">My Compliance Profile</h2>
        <p class="page-header-sub">View license validity and safety records</p>
      </div>
    </div>
    <div id="driver-profile-host">Loading profile...</div>
  `;
  
  try {
    const drivers = await request("/api/drivers");
    const ratings = await request("/api/ratings/drivers");
    const dObj = drivers.find(d => d.email === state.email);
    
    if (!dObj) {
      document.getElementById("driver-profile-host").innerHTML = `<div class="alert alert-error">Driver profile link not found.</div>`;
      return;
    }
    
    const rating = ratings.find(r => r.driver_id === dObj.id);
    const starsHtml = rating ? renderStars(rating.stars, rating.band) : 'Not Rated';
    
    document.getElementById("driver-profile-host").innerHTML = `
      <div class="card" style="max-width:600px">
        <div class="card-body">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px">
            <div>
              <div class="text-muted text-sm">License Number</div>
              <div class="fw-600" style="font-size:1.1rem">${dObj.license_number}</div>
            </div>
            <div>
              <div class="text-muted text-sm">License Category</div>
              <div class="fw-600" style="font-size:1.1rem">${dObj.license_category || 'N/A'}</div>
            </div>
            <div>
              <div class="text-muted text-sm">License Expiry Date</div>
              <div class="fw-600" style="font-size:1.1rem">${dObj.license_expiry || 'N/A'}</div>
            </div>
            <div>
              <div class="text-muted text-sm">Safety Score & Rating</div>
              <div class="fw-600" style="font-size:1.1rem">${starsHtml}</div>
            </div>
            <div>
              <div class="text-muted text-sm">Contact Phone</div>
              <div class="fw-600" style="font-size:1.1rem">${dObj.contact_number || 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch(e) {}
}

// -------------------------------------------------------------
// SAFETY OFFICER PAGES (4)
// -------------------------------------------------------------

async function renderSafetyCompliance(host) {
  host.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-header-title">License Compliance Board</h2>
        <p class="page-header-sub">Track active driver licenses expirations and system alerts</p>
      </div>
    </div>
    
    <div id="safety-strip"></div>
    
    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-title">Expired or Near-Expiration Drivers (License status)</div>
        <div class="chart-body" id="expired-drivers-list">Loading alerts...</div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Suspended Drivers</div>
        <div class="chart-body" id="suspended-drivers-list">Loading...</div>
      </div>
    </div>
  `;
  
  const strip = document.getElementById("safety-strip");
  renderOverviewStrip(strip);
  
  try {
    const drivers = await request("/api/drivers");
    const expList = document.getElementById("expired-drivers-list");
    const suspList = document.getElementById("suspended-drivers-list");
    
    // Near expiry list
    const nearExpiry = drivers.filter(d => d.license_expired || d.status === "Suspended");
    const now = new Date();
    
    const alertDrivers = drivers.filter(d => {
      if (!d.license_expiry) return false;
      const exp = new Date(d.license_expiry);
      const days = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
      return days <= 30;
    });
    
    if (alertDrivers.length === 0) {
      expList.innerHTML = `<div class="empty-state"><p>All driver licenses are compliant.</p></div>`;
    } else {
      expList.innerHTML = `
        <table class="text-sm">
          <thead>
            <tr><th>Name</th><th>License #</th><th>Expiry Date</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${alertDrivers.map(d => {
              const exp = new Date(d.license_expiry);
              const days = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
              const badge = days < 0 ? 'badge-red' : 'badge-amber';
              const text = days < 0 ? 'Expired' : `${days} days left`;
              return `
                <tr>
                  <td><span class="fw-600">${d.name}</span></td>
                  <td>${d.license_number}</td>
                  <td>${d.license_expiry}</td>
                  <td><span class="badge ${badge}">${text}</span></td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      `;
    }
    
    // Suspended list
    const suspended = drivers.filter(d => d.status === "Suspended");
    if (suspended.length === 0) {
      suspList.innerHTML = `<div class="empty-state"><p>No suspended drivers.</p></div>`;
    } else {
      suspList.innerHTML = `
        <table class="text-sm">
          <thead>
            <tr><th>Name</th><th>License #</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${suspended.map(d => `
              <tr>
                <td><span class="fw-600">${d.name}</span></td>
                <td>${d.license_number}</td>
                <td><span class="badge badge-red">Suspended</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
    }
  } catch(e) {}
}

async function renderSafetyDrivers(host) {
  host.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-header-title">Driver Directory</h2>
        <p class="page-header-sub">Verify licenses details and manage driver statuses</p>
      </div>
    </div>
    
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Driver Name</th>
              <th>License ID</th>
              <th>License Category</th>
              <th>Expiry Date</th>
              <th>Contact Phone</th>
              <th>Availability</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="safety-drivers-tbody">
            <tr><td colspan="7" style="text-align:center" class="text-muted">Loading driver roster...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  async function loadDrivers() {
    try {
      const drivers = await request("/api/drivers");
      const tbody = document.getElementById("safety-drivers-tbody");
      tbody.innerHTML = "";
      
      drivers.forEach(d => {
        let statusBadge = "badge-gray";
        if (d.status === "Available") statusBadge = "badge-green";
        else if (d.status === "On Trip") statusBadge = "badge-blue";
        else if (d.status === "Suspended") statusBadge = "badge-red";
        
        tbody.innerHTML += `
          <tr>
            <td><span class="fw-600">${d.name}</span></td>
            <td>${d.license_number}</td>
            <td>${d.license_category || 'N/A'}</td>
            <td>${d.license_expiry || 'N/A'}</td>
            <td>${d.contact_number || 'N/A'}</td>
            <td><span class="badge ${statusBadge}">${d.status}</span></td>
            <td class="table-actions">
              ${d.status === "Suspended" ? `
                <button class="btn btn-secondary btn-sm" onclick="reinstateDriver(${d.id})">Reinstate</button>
              ` : `
                <button class="btn btn-danger btn-sm" onclick="suspendDriver(${d.id})">Suspend</button>
              `}
              <button class="btn btn-secondary btn-sm" onclick="editLicenseModal(${d.id})">Edit License</button>
            </td>
          </tr>
        `;
      });
    } catch(e) {}
  }
  
  window.suspendDriver = async function(id) {
    if (confirm("Are you sure you want to suspend this driver? They will be blocked from trip assignments.")) {
      await request(`/api/drivers/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "Suspended" })
      });
      showToast("Driver suspended.");
      loadDrivers();
    }
  };
  
  window.reinstateDriver = async function(id) {
    if (confirm("Reinstate this driver to Available?")) {
      await request(`/api/drivers/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "Available" })
      });
      showToast("Driver reinstated.");
      loadDrivers();
    }
  };
  
  window.editLicenseModal = async function(id) {
    const drivers = await request("/api/drivers");
    const d = drivers.find(drv => drv.id === id);
    
    const bodyHtml = `
      <form id="edit-license-form">
        <div class="form-group">
          <label class="form-label">License Number</label>
          <input id="l-num" type="text" class="form-control" value="${d.license_number}" required>
        </div>
        <div class="form-group">
          <label class="form-label">License Category</label>
          <input id="l-cat" type="text" class="form-control" value="${d.license_category || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">License Expiry Date</label>
          <input id="l-exp" type="date" class="form-control" value="${d.license_expiry || ''}" required>
        </div>
      </form>
    `;
    const footerHtml = `
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="btn-save-license">Save Changes</button>
    `;
    showModal(`Edit License Data - ${d.name}`, bodyHtml, footerHtml);
    
    document.getElementById("btn-save-license").addEventListener("click", async () => {
      const body = {
        license_number: document.getElementById("l-num").value,
        license_category: document.getElementById("l-cat").value,
        license_expiry: document.getElementById("l-exp").value
      };
      
      await request(`/api/drivers/${id}`, {
        method: "PUT",
        body: JSON.stringify(body)
      });
      showToast("License data updated.");
      closeModal();
      loadDrivers();
    });
  };
  
  loadDrivers();
}

async function renderSafetyScores(host) {
  host.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-header-title">Driver Safety Scores</h2>
        <p class="page-header-sub">Monitor safety performance star ratings and leaderboard</p>
      </div>
    </div>
    
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Driver Name</th>
              <th>Star Rating</th>
              <th>Safety Score</th>
              <th>License Compliance</th>
              <th>Reliability</th>
              <th>On Time Completion</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="safety-scores-tbody">
            <tr><td colspan="7" style="text-align:center" class="text-muted">Calculating safety score leaderboard...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  async function loadScores() {
    try {
      const ratings = await request("/api/ratings/drivers");
      const tbody = document.getElementById("safety-scores-tbody");
      tbody.innerHTML = "";
      
      ratings.forEach(r => {
        tbody.innerHTML += `
          <tr>
            <td><span class="fw-600">${r.name}</span></td>
            <td>${renderStars(r.stars, r.band)}</td>
            <td>${Math.round(r.safety * 100)}%</td>
            <td>${Math.round(r.compliance * 100)}%</td>
            <td>${Math.round(r.completion * 100)}%</td>
            <td>${Math.round(r.on_time * 100)}%</td>
            <td>
              <button class="btn btn-secondary btn-sm" onclick="adjustSafetyScoreModal(${r.driver_id})">Adjust Score</button>
            </td>
          </tr>
        `;
      });
    } catch(e) {}
  }
  
  window.adjustSafetyScoreModal = async function(id) {
    const drivers = await request("/api/drivers");
    const d = drivers.find(drv => drv.id === id);
    
    const bodyHtml = `
      <form id="adjust-score-form">
        <div class="form-group">
          <label class="form-label">Safety Score (0 - 100)</label>
          <input id="s-score" type="number" class="form-control" value="${d.safety_score}" required min="0" max="100">
        </div>
      </form>
    `;
    const footerHtml = `
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="btn-save-score">Save Score</button>
    `;
    showModal(`Adjust Driver Score - ${d.name}`, bodyHtml, footerHtml);
    
    document.getElementById("btn-save-score").addEventListener("click", async () => {
      const score = parseFloat(document.getElementById("s-score").value);
      await request(`/api/drivers/${id}`, {
        method: "PUT",
        body: JSON.stringify({ safety_score: score })
      });
      showToast("Driver safety score adjusted.");
      closeModal();
      loadScores();
    });
  };
  
  loadScores();
}

async function renderSafetyIncidents(host) {
  host.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-header-title">Driver Incident Log</h2>
        <p class="page-header-sub">Log safety violations, route exceptions, or collisions</p>
      </div>
      <button class="btn btn-primary" id="btn-log-incident">Log New Incident</button>
    </div>
    
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Driver</th>
              <th>Severity</th>
              <th>Description</th>
              <th>Status</th>
              <th>Logged Date</th>
            </tr>
          </thead>
          <tbody id="incidents-tbody">
            <tr><td colspan="6" style="text-align:center" class="text-muted">Loading incident log...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  async function loadIncidents() {
    try {
      const incidents = await request("/api/incidents");
      const tbody = document.getElementById("incidents-tbody");
      tbody.innerHTML = "";
      
      if (incidents.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center" class="text-muted">No incidents logged. Safe operations!</td></tr>`;
        return;
      }
      
      incidents.forEach(i => {
        let badge = "badge-gray";
        if (i.severity === "Low") badge = "badge-blue";
        else if (i.severity === "Medium") badge = "badge-amber";
        else if (i.severity === "High") badge = "badge-red";
        
        tbody.innerHTML += `
          <tr>
            <td><span class="fw-600">INC-${i.id}</span></td>
            <td>${i.driver_name}</td>
            <td><span class="badge ${badge}">${i.severity}</span></td>
            <td>${i.description}</td>
            <td><span class="badge ${i.status === 'Open' ? 'badge-red' : 'badge-green'}">${i.status}</span></td>
            <td>${new Date(i.occurred_at).toLocaleDateString()}</td>
          </tr>
        `;
      });
    } catch(e) {}
  }
  
  document.getElementById("btn-log-incident").addEventListener("click", async () => {
    const drivers = await request("/api/drivers");
    const bodyHtml = `
      <form id="new-incident-form">
        <div class="form-group">
          <label class="form-label">Select Driver</label>
          <select id="i-driver" class="form-control" required>
            ${drivers.map(d => `<option value="${d.id}">${d.name}</option>`).join("")}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Severity Level</label>
          <select id="i-severity" class="form-control" required>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High (Reduces safety rating immediately)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Incident Description</label>
          <textarea id="i-desc" class="form-control" rows="3" placeholder="What happened?" required></textarea>
        </div>
      </form>
    `;
    const footerHtml = `
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="btn-submit-incident">Log Incident</button>
    `;
    showModal("Log Safety Incident", bodyHtml, footerHtml);
    
    document.getElementById("btn-submit-incident").addEventListener("click", async () => {
      const body = {
        driver_id: parseInt(document.getElementById("i-driver").value),
        severity: document.getElementById("i-severity").value,
        description: document.getElementById("i-desc").value
      };
      
      await request("/api/incidents", {
        method: "POST",
        body: JSON.stringify(body)
      });
      showToast("Incident logged successfully.");
      closeModal();
      loadIncidents();
    });
  });
  
  loadIncidents();
}

// -------------------------------------------------------------
// FINANCIAL ANALYST PAGES (5)
// -------------------------------------------------------------

async function renderFinanceDashboard(host) {
  host.innerHTML = `
    <div id="metrics-strip"></div>
    
    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-title">Cost Breakdown Overview</div>
        <div class="chart-body"><canvas id="costBreakdownChart"></canvas></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Vehicle ROI Rankings (Net profit / acquisition cost)</div>
        <div class="chart-body" id="roi-rankings-list">Loading vehicle analytics...</div>
      </div>
    </div>
    
    <div class="card mb-4" id="anomalies-card" style="display:none">
      <div class="card-header"><span class="card-title" style="color:var(--c-red); font-weight:700">Financial Anomalies Flagged (&gt; 2 Standard Deviations)</span></div>
      <div class="card-body">
        <div class="table-wrap">
          <table class="text-sm">
            <thead>
              <tr><th>Type</th><th>Vehicle/Category</th><th>Outlier Details</th></tr>
            </thead>
            <tbody id="anomalies-tbody">
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  
  const strip = document.getElementById("metrics-strip");
  renderOverviewStrip(strip);
  
  try {
    const data = await request("/api/reports/summary");
    const anomalies = await request("/api/reports/anomalies");
    
    // Cost breakdown Chart
    new Chart(document.getElementById("costBreakdownChart"), {
      type: "doughnut",
      data: {
        labels: ["Fuel Cost", "Maintenance Cost", "Other Expenses"],
        datasets: [{
          data: [data.totals.fuel_cost, data.totals.maintenance_cost, data.totals.other_expenses],
          backgroundColor: ["#f59e0b", "#3b82f6", "#10b981"]
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
    
    // ROI Rankings
    const roiList = document.getElementById("roi-rankings-list");
    const sortedVehicles = data.vehicles.sort((a,b) => b.roi - a.roi);
    
    roiList.innerHTML = `
      <table class="text-sm">
        <thead>
          <tr><th>Reg Number</th><th>Operational Cost</th><th>Total Revenue</th><th>ROI</th></tr>
        </thead>
        <tbody>
          ${sortedVehicles.map(v => {
            const roiPct = Math.round(v.roi * 100);
            return `
              <tr>
                <td><span class="fw-600">${v.registration_number}</span></td>
                <td>₹${v.operational_cost.toLocaleString()}</td>
                <td>₹${v.revenue.toLocaleString()}</td>
                <td><span class="badge ${v.roi > 0 ? 'badge-green' : 'badge-red'}">${roiPct}%</span></td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    `;
    
    // Financial Anomalies
    if (anomalies.count > 0) {
      document.getElementById("anomalies-card").style.display = "block";
      const tbody = document.getElementById("anomalies-tbody");
      tbody.innerHTML = anomalies.flags.map(f => `
        <tr>
          <td><span class="badge badge-red">${f.type}</span></td>
          <td><span class="fw-600">${f.vehicle}</span></td>
          <td>${f.detail}</td>
        </tr>
      `).join("");
    }
    
  } catch(e) {}
}

async function renderFinanceRevenue(host) {
  host.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-header-title">Trip Revenue Logging</h2>
        <p class="page-header-sub">View and update revenue collected per trip</p>
      </div>
    </div>
    
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Trip ID</th>
              <th>Source ➔ Destination</th>
              <th>Vehicle / Driver</th>
              <th>Actual Distance</th>
              <th>Expected Revenue</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="revenue-tbody">
            <tr><td colspan="6" style="text-align:center" class="text-muted">Loading completed trips...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  async function loadRevenue() {
    try {
      const trips = await request("/api/trips");
      const tbody = document.getElementById("revenue-tbody");
      tbody.innerHTML = "";
      
      const eligible = trips.filter(t => t.status === "Completed");
      if (eligible.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center" class="text-muted">No completed trips require revenue adjustment.</td></tr>`;
        return;
      }
      
      eligible.forEach(t => {
        tbody.innerHTML += `
          <tr>
            <td><span class="fw-600">TRIP-${t.id}</span></td>
            <td>${t.source} ➔ ${t.destination}</td>
            <td>${t.vehicle_name} / ${t.driver_name}</td>
            <td>${t.actual_distance || t.planned_distance} km</td>
            <td><span class="fw-600">₹${t.revenue.toLocaleString()}</span></td>
            <td>
              <button class="btn btn-secondary btn-sm" onclick="logRevenueModal(${t.id})">Adjust Revenue</button>
            </td>
          </tr>
        `;
      });
    } catch(e) {}
  }
  
  window.logRevenueModal = async function(id) {
    const trips = await request("/api/trips");
    const t = trips.find(tr => tr.id === id);
    
    const bodyHtml = `
      <form id="adjust-revenue-form">
        <div class="form-group">
          <label class="form-label">Adjust Revenue (₹)</label>
          <input id="r-amount" type="number" class="form-control" value="${t.revenue}" required min="0">
        </div>
      </form>
    `;
    const footerHtml = `
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="btn-save-revenue">Save Revenue</button>
    `;
    showModal(`Trip Revenue Log - TRIP-${t.id}`, bodyHtml, footerHtml);
    
    document.getElementById("btn-save-revenue").addEventListener("click", async () => {
      const amount = parseFloat(document.getElementById("r-amount").value || 0);
      await request(`/api/trips/${id}/revenue`, {
        method: "PUT",
        body: JSON.stringify({ revenue: amount })
      });
      showToast("Revenue recorded.");
      closeModal();
      loadRevenue();
    });
  };
  
  loadRevenue();
}

async function renderFinanceExpenses(host) {
  host.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-header-title">Fuel & Operational Expenses</h2>
        <p class="page-header-sub">Log tolls, fines, parking charges, or non-fuel categories</p>
      </div>
      <button class="btn btn-primary" id="btn-log-expense">Log Expense</button>
    </div>
    
    <div class="charts-grid">
      <div class="card">
        <div class="card-header"><span class="card-title">Expense Log</span></div>
        <div class="card-body">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Description</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody id="expense-list-tbody">
                <tr><td colspan="5" style="text-align:center" class="text-muted">Loading expense logs...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header"><span class="card-title">Fuel Log (Read-only)</span></div>
        <div class="card-body">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Liters</th>
                  <th>Odometer</th>
                  <th>Total Cost</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody id="fuel-list-tbody">
                <tr><td colspan="5" style="text-align:center" class="text-muted">Loading fuel logs...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
  
  async function loadExpensesAndFuel() {
    try {
      const expenses = await request("/api/expenses");
      const fuel = await request("/api/fuel");
      const eTbody = document.getElementById("expense-list-tbody");
      const fTbody = document.getElementById("fuel-list-tbody");
      
      eTbody.innerHTML = expenses.map(e => `
        <tr style="${e.is_anomalous ? 'background-color: var(--c-red-light);' : ''}">
          <td>
            <span class="fw-600">${e.vehicle_name || 'N/A'}</span>
            ${e.is_anomalous ? '<span class="badge badge-red" style="margin-left: 8px;">Anomaly Flagged</span>' : ''}
          </td>
          <td><span class="badge badge-blue">${e.category}</span></td>
          <td><span class="fw-600" style="${e.is_anomalous ? 'color: var(--c-red);' : ''}">₹${e.amount.toLocaleString()}</span></td>
          <td>${e.description}</td>
          <td>${e.expense_date}</td>
        </tr>
      `).join("") || `<tr><td colspan="5" style="text-align:center" class="text-muted">No expenses recorded.</td></tr>`;
      
      fTbody.innerHTML = fuel.map(f => `
        <tr style="${f.is_anomalous ? 'background-color: var(--c-red-light);' : ''}">
          <td>
            <span class="fw-600">${f.vehicle_name}</span>
            ${f.is_anomalous ? '<span class="badge badge-red" style="margin-left: 8px;">Anomaly Flagged</span>' : ''}
          </td>
          <td>${f.liters} L</td>
          <td>${f.odometer || 'N/A'} km</td>
          <td><span class="fw-600" style="${f.is_anomalous ? 'color: var(--c-red);' : ''}">₹${f.cost.toLocaleString()}</span></td>
          <td>${f.log_date}</td>
        </tr>
      `).join("") || `<tr><td colspan="5" style="text-align:center" class="text-muted">No fuel logs found.</td></tr>`;
      
    } catch(e) {}
  }
  
  document.getElementById("btn-log-expense").addEventListener("click", async () => {
    const vehicles = await request("/api/vehicles");
    const activeVehicles = vehicles.filter(v => v.status !== "Retired");
    
    const bodyHtml = `
      <form id="new-expense-form">
        <div class="form-group">
          <label class="form-label">Select Vehicle</label>
          <select id="e-vehicle" class="form-control" required>
            ${activeVehicles.map(v => `<option value="${v.id}">${v.registration_number} (${v.name})</option>`).join("")}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Expense Category</label>
          <select id="e-cat" class="form-control" required>
            <option value="Toll">Toll</option>
            <option value="Fine">Fine</option>
            <option value="Parking">Parking</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Amount (₹)</label>
          <input id="e-amount" type="number" class="form-control" required min="1">
        </div>
        <div class="form-group">
          <label class="form-label">Description Notes</label>
          <input id="e-desc" type="text" class="form-control" placeholder="Details (e.g., NH Speed Fine)" required>
        </div>
      </form>
    `;
    const footerHtml = `
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="btn-submit-expense">Log Expense</button>
    `;
    showModal("Log Operational Expense", bodyHtml, footerHtml);
    
    document.getElementById("btn-submit-expense").addEventListener("click", async () => {
      const body = {
        vehicle_id: parseInt(document.getElementById("e-vehicle").value),
        category: document.getElementById("e-cat").value,
        amount: parseFloat(document.getElementById("e-amount").value),
        description: document.getElementById("e-desc").value
      };
      
      await request("/api/expenses", {
        method: "POST",
        body: JSON.stringify(body)
      });
      showToast("Expense logged successfully.");
      closeModal();
      loadExpensesAndFuel();
    });
  });
  
  loadExpensesAndFuel();
}

async function renderFinanceMaint(host) {
  host.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-header-title">Maintenance Costs (Read-only)</h2>
        <p class="page-header-sub">View financial records for vehicle repairs and planned services</p>
      </div>
    </div>
    
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Vehicle Name</th>
              <th>Service Type</th>
              <th>Service Date</th>
              <th>Classification</th>
              <th>Final Cost</th>
            </tr>
          </thead>
          <tbody id="maint-cost-tbody">
            <tr><td colspan="5" style="text-align:center" class="text-muted">Loading maintenance costs...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  try {
    const logs = await request("/api/maintenance");
    const tbody = document.getElementById("maint-cost-tbody");
    tbody.innerHTML = "";
    
    const closedLogs = logs.filter(l => l.status === "Closed");
    if (closedLogs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center" class="text-muted">No completed maintenance history.</td></tr>`;
      return;
    }
    
    closedLogs.forEach(l => {
      tbody.innerHTML += `
        <tr>
          <td><span class="fw-600">${l.vehicle_name}</span></td>
          <td>${l.service_type}</td>
          <td>${l.service_date}</td>
          <td><span class="badge ${l.is_planned ? 'badge-blue' : 'badge-red'}">${l.is_planned ? 'Planned' : 'Unplanned'}</span></td>
          <td><span class="fw-600">₹${l.cost.toLocaleString()}</span></td>
        </tr>
      `;
    });
  } catch(e) {}
}

async function renderFinanceReports(host) {
  host.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-header-title">Reports & Export</h2>
        <p class="page-header-sub">Export fleet statistics and financial spreadsheets</p>
      </div>
    </div>
    
    <div class="card" style="max-width: 500px; margin: 0 auto">
      <div class="card-body" style="text-align:center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:64px; height:64px; color:var(--c-accent); margin:0 auto 20px; opacity:0.8">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
        </svg>
        <p class="mb-4">Export the comprehensive fleet performance report including costs, efficiency and ROI rankings.</p>
        <div style="display:flex; gap:12px; justify-content:center">
          <button id="btn-export-csv" class="btn btn-secondary">Export to CSV</button>
          <button id="btn-export-pdf" class="btn btn-primary">Export to PDF</button>
        </div>
      </div>
    </div>
  `;
  
  const downloadExport = async (url, filename) => {
    try {
      showToast("Generating report, please wait...");
      const res = await fetch(url, { headers: { "Authorization": `Bearer ${state.token}` } });
      if (!res.ok) throw new Error("Failed to export report");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = window.URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast("Report downloaded successfully");
    } catch(e) {
      showToast(e.message, "error");
    }
  };

  document.getElementById("btn-export-csv").addEventListener("click", () => downloadExport("/api/reports/export.csv", "transitops_report.csv"));
  document.getElementById("btn-export-pdf").addEventListener("click", () => downloadExport("/api/reports/export.pdf", "transitops_report.pdf"));
}

// -------------------------------------------------------------
// ADMIN PAGES (2)
// -------------------------------------------------------------

async function renderAdminOverview(host) {
  host.innerHTML = `
    <div id="metrics-strip"></div>
    <div class="charts-grid">
      <div class="card">
        <div class="card-header"><span class="card-title">System Status Overview</span></div>
        <div class="card-body">
          <p class="text-sm">TransitOps Database is connected and seeding is active. Database records are stored in sqlite database. You can manage operational permissions, driver registration codes, and access audits.</p>
          <div class="divider"></div>
          <div style="display:flex; justify-content:space-between">
            <div>
              <div class="text-muted text-sm">Database Engine</div>
              <div class="fw-600">SQLite</div>
            </div>
            <div>
              <div class="text-muted text-sm">Backend Engine</div>
              <div class="fw-600">FastAPI</div>
            </div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Quick Action Logs</span></div>
        <div class="card-body" id="quick-action-logs">
          <div class="alert alert-info">All systems operational. No warnings detected.</div>
        </div>
      </div>
    </div>
  `;
  renderOverviewStrip(document.getElementById("metrics-strip"));
}

async function renderAdminUsers(host) {
  host.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-header-title">System User Accounts</h2>
        <p class="page-header-sub">Manage system roles, access flags, and create officers</p>
      </div>
      <button class="btn btn-primary" id="btn-create-user">Create User</button>
    </div>
    
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Full Name</th>
              <th>Email Address</th>
              <th>Assigned Role</th>
              <th>System Status</th>
            </tr>
          </thead>
          <tbody id="users-tbody">
            <tr><td colspan="5" style="text-align:center" class="text-muted">Loading account lists...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  async function loadUsers() {
    try {
      const users = await request("/api/auth/users");
      const tbody = document.getElementById("users-tbody");
      tbody.innerHTML = "";
      
      users.forEach(u => {
        tbody.innerHTML += `
          <tr>
            <td><span class="fw-600">USR-${u.id}</span></td>
            <td>${u.name}</td>
            <td>${u.email}</td>
            <td><span class="badge badge-violet">${u.role}</span></td>
            <td><span class="badge ${u.is_active ? 'badge-green' : 'badge-red'}">${u.is_active ? 'Active' : 'Disabled'}</span></td>
          </tr>
        `;
      });
    } catch(e) {}
  }
  
  document.getElementById("btn-create-user").addEventListener("click", () => {
    const bodyHtml = `
      <form id="new-user-form">
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input id="u-name" type="text" class="form-control" required placeholder="User name">
        </div>
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input id="u-email" type="email" class="form-control" required placeholder="email@transitops.com">
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input id="u-password" type="password" class="form-control" required placeholder="••••••••">
        </div>
        <div class="form-group">
          <label class="form-label">Role</label>
          <select id="u-role" class="form-control" required>
            <option value="Fleet Manager">Fleet Manager</option>
            <option value="Safety Officer">Safety Officer</option>
            <option value="Financial Analyst">Financial Analyst</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
      </form>
    `;
    const footerHtml = `
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="btn-submit-user">Save User</button>
    `;
    showModal("Create System User", bodyHtml, footerHtml);
    
    document.getElementById("btn-submit-user").addEventListener("click", async () => {
      const body = {
        name: document.getElementById("u-name").value,
        email: document.getElementById("u-email").value,
        password: document.getElementById("u-password").value,
        role: document.getElementById("u-role").value
      };
      
      await request("/api/auth/users", {
        method: "POST",
        body: JSON.stringify(body)
      });
      showToast("System user created successfully.");
      closeModal();
      loadUsers();
    });
  });
  
  loadUsers();
}

// -------------------------------------------------------------
// APP STARTUP
// -------------------------------------------------------------
if (state.token) {
  initApp();
} else {
  document.getElementById("app").classList.remove("visible");
  document.getElementById("auth-screen").style.display = "flex";
}
