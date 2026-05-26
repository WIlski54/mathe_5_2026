const teacherToken = document.body.dataset.teacherToken;
const totalTasks = Number(document.body.dataset.totalTasks || 8);
let socket = null;
let dataStore = { students: [], requests: [], answers: [], chats: [], tokens: { today: 0, limit: 1 } };

document.addEventListener("DOMContentLoaded", () => {
  bindSessionControls();
  loadDashboard();
  loadSessions();
  connectDashboardSocket();
});

function headers() {
  return { "Content-Type": "application/json", "X-Lehrer-Token": teacherToken };
}

async function loadDashboard() {
  const response = await fetch("/api/dashboard-data", { headers: { "X-Lehrer-Token": teacherToken } });
  dataStore = await response.json();
  renderDashboard();
}

function connectDashboardSocket() {
  if (typeof io === "undefined") return;
  socket = io();
  socket.on("connect", () => socket.emit("lehrer_join"));
  socket.on("dashboard_snapshot", payload => {
    dataStore = payload;
    renderDashboard();
  });
  socket.on("neuer_schueler", student => {
    dataStore.students = [student, ...dataStore.students.filter(item => item.id !== student.id)];
    renderDashboard();
  });
  socket.on("fortschritt_update", update => {
    const student = dataStore.students.find(item => item.id === update.id);
    if (student) student.aufgaben_erledigt = update.aufgaben_erledigt;
    renderDashboard();
  });
  socket.on("neue_anfrage", request => {
    dataStore.requests = [request, ...dataStore.requests];
    renderDashboard();
  });
  socket.on("anfrage_update", update => {
    const item = dataStore.requests.find(request => Number(request.id) === Number(update.id));
    if (item) item.status = update.status;
    renderDashboard();
  });
  socket.on("antwort_update", answer => {
    dataStore.answers = [answer, ...dataStore.answers];
    renderDashboard();
  });
  socket.on("chat_live", chat => {
    dataStore.chats = [chat, ...dataStore.chats];
    renderDashboard();
  });
  socket.on("token_update", tokens => {
    dataStore.tokens = tokens;
    renderDashboard();
  });
  socket.on("session_reloaded", () => loadDashboard());
}

function renderDashboard() {
  const openRequests = dataStore.requests.filter(item => item.status === "wartend").length;
  $("#kpi-students").textContent = dataStore.students.length;
  $("#kpi-requests").textContent = openRequests;
  $("#kpi-answers").textContent = dataStore.answers.length;
  $("#kpi-tokens").textContent = `${dataStore.tokens.today}/${dataStore.tokens.limit}`;
  renderStudents();
  renderRequests();
  renderAnswers();
  renderChats();
}

function renderStudents() {
  const body = $("#students-body");
  if (!dataStore.students.length) {
    body.innerHTML = `<tr><td colspan="5">Noch keine Schueler angemeldet.</td></tr>`;
    return;
  }
  body.innerHTML = dataStore.students.map(student => `
    <tr>
      <td><strong>${escapeHtml(student.pseudonym)}</strong></td>
      <td>${escapeHtml(student.klasse)}</td>
      <td>${Number(student.aufgaben_erledigt || 0)}/${totalTasks}</td>
      <td>${student.socket_id ? '<span class="badge ok">online</span>' : '<span class="badge">offline</span>'}</td>
      <td><a href="/lehrer/schueler/${encodeURIComponent(student.id)}">oeffnen</a></td>
    </tr>
  `).join("");
}

function renderRequests() {
  const root = $("#requests-list");
  const list = dataStore.requests.slice(0, 12);
  if (!list.length) {
    root.innerHTML = `<div class="mini-card">Keine KI-Anfragen.</div>`;
    return;
  }
  root.innerHTML = list.map(item => `
    <div class="mini-card">
      <div><strong>${escapeHtml(item.pseudonym || "?")}</strong> <span class="${badgeClass(item.status)}">${escapeHtml(item.status)}</span></div>
      <div>${escapeHtml(item.typ)} | ${escapeHtml(item.kontext || "")}</div>
      <div style="color:var(--muted);font-size:.9rem">${escapeHtml(item.erstellt_at || "")}</div>
      ${item.status === "wartend" ? `
        <div class="dashboard-actions">
          <button class="btn-primary" type="button" data-decision="freigegeben" data-id="${item.id}">Freigeben</button>
          <button class="btn-outline" type="button" data-decision="abgelehnt" data-id="${item.id}">Ablehnen</button>
        </div>` : ""}
    </div>
  `).join("");
  root.querySelectorAll("[data-decision]").forEach(button => {
    button.addEventListener("click", () => decideKi(button.dataset.id, button.dataset.decision));
  });
}

async function decideKi(id, entscheid) {
  await fetch("/api/ki-entscheidung", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ anfrage_id: Number(id), entscheid })
  });
  await loadDashboard();
}

function renderAnswers() {
  const root = $("#answers-list");
  const list = dataStore.answers.slice(0, 18);
  if (!list.length) {
    root.innerHTML = `<div class="mini-card">Noch keine Antworten.</div>`;
    return;
  }
  root.innerHTML = list.map(item => `
    <div class="mini-card">
      <strong>${escapeHtml(item.pseudonym || "?")}</strong>
      <span class="badge">Aufgabe ${escapeHtml(item.aufgabe_nr)} | ${escapeHtml(item.niveau)}</span>
      ${correctBadge(item.korrekt)}
      <div>${escapeHtml(item.antwort_text || "")}</div>
      <div style="color:var(--muted);font-size:.9rem">${escapeHtml(item.erstellt_at || "")}</div>
    </div>
  `).join("");
}

function renderChats() {
  const root = $("#chats-list");
  const list = dataStore.chats.slice(0, 12);
  if (!list.length) {
    root.innerHTML = `<div class="mini-card">Noch keine KI-Chats.</div>`;
    return;
  }
  root.innerHTML = list.map(item => `
    <div class="mini-card">
      <strong>${escapeHtml(item.pseudonym || "?")}</strong>
      <div><strong>Frage:</strong> ${escapeHtml(item.frage || item.message || "")}</div>
      ${item.antwort ? `<div><strong>Antwort:</strong> ${escapeHtml(item.antwort)}</div>` : ""}
      <div style="color:var(--muted);font-size:.9rem">${escapeHtml(item.created_at || "")}</div>
    </div>
  `).join("");
}

function bindSessionControls() {
  $("#save-session-btn").addEventListener("click", async () => {
    const name = $("#snapshot-name").value.trim() || `Mathe-Sitzung ${new Date().toLocaleString("de-DE")}`;
    await fetch("/api/sitzungen", { method: "POST", headers: headers(), body: JSON.stringify({ name }) });
    feedback("Sitzung gespeichert.", "ok");
    await loadSessions();
  });
  $("#load-session-btn").addEventListener("click", async () => {
    const id = $("#session-select").value;
    if (!id || !confirm("Aktuelle Live-Sitzung durch diesen Snapshot ersetzen?")) return;
    await fetch(`/api/sitzungen/${encodeURIComponent(id)}/load`, { method: "POST", headers: headers() });
    feedback("Sitzung geladen.", "ok");
    await loadDashboard();
  });
  $("#delete-session-btn").addEventListener("click", async () => {
    const id = $("#session-select").value;
    if (!id || !confirm("Snapshot wirklich loeschen?")) return;
    await fetch(`/api/sitzungen/${encodeURIComponent(id)}`, { method: "DELETE", headers: headers() });
    feedback("Snapshot geloescht.", "ok");
    await loadSessions();
  });
  $("#reset-session-btn").addEventListener("click", async () => {
    if (!confirm("Aktuelle Unterrichtsaktivitaet wirklich loeschen? Gespeicherte Snapshots bleiben erhalten.")) return;
    await fetch("/api/reset", { method: "POST", headers: headers() });
    feedback("Aktuelle Sitzung geloescht.", "ok");
    await loadDashboard();
  });
}

async function loadSessions() {
  const response = await fetch("/api/sitzungen", { headers: { "X-Lehrer-Token": teacherToken } });
  const data = await response.json();
  const select = $("#session-select");
  select.innerHTML = (data.sessions || []).map(item => `
    <option value="${escapeHtml(item.id)}">${escapeHtml(item.name)} (${escapeHtml(item.updated_at)})</option>
  `).join("");
}

function feedback(text, type) {
  const node = $("#session-feedback");
  node.className = `feedback ${type}`;
  node.textContent = text;
}

function badgeClass(status) {
  if (status === "freigegeben") return "badge ok";
  if (status === "abgelehnt") return "badge no";
  return "badge wait";
}

function correctBadge(value) {
  if (value === 1 || value === true) return '<span class="badge ok">richtig</span>';
  if (value === 0 || value === false) return '<span class="badge no">falsch</span>';
  return '<span class="badge">offen</span>';
}

function $(selector, root = document) {
  return root.querySelector(selector);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
