const teacherToken = document.body.dataset.teacherToken;
const studentId = document.body.dataset.studentId;
const totalTasks = Number(document.body.dataset.totalTasks || 8);
let socket = null;

document.addEventListener("DOMContentLoaded", () => {
  loadDetail();
  connectDetailSocket();
});

async function loadDetail() {
  const response = await fetch(`/api/schueler/${encodeURIComponent(studentId)}`, {
    headers: { "X-Lehrer-Token": teacherToken }
  });
  const data = await response.json();
  renderProgress(data.progress || []);
  renderAnswers(data.answers || []);
  renderChats(data.chats || []);
  renderRequests(data.requests || []);
}

function connectDetailSocket() {
  if (typeof io === "undefined") return;
  socket = io();
  socket.on("connect", () => {
    socket.emit("lehrer_join");
    socket.emit("watch_schueler", { schueler_id: studentId });
  });
  socket.on("antwort_update", answer => {
    if (answer.schueler_id === studentId) loadDetail();
  });
  socket.on("fortschritt_update", update => {
    if (update.id === studentId) loadDetail();
  });
  socket.on("chat_live", chat => {
    if (chat.schueler_id === studentId) loadDetail();
  });
  socket.on("anfrage_update", () => loadDetail());
  socket.on("neue_anfrage", request => {
    if (request.schueler_id === studentId) loadDetail();
  });
}

function renderProgress(progress) {
  const done = new Set(progress.map(item => String(item.aufgabe_nr))).size;
  $("#progress-label").textContent = `${done}/${totalTasks} Aufgaben`;
  $("#progress-fill").style.width = `${Math.round((done / totalTasks) * 100)}%`;
}

function renderAnswers(list) {
  const root = $("#answers-list");
  if (!list.length) {
    root.innerHTML = `<div class="mini-card">Noch keine Antworten.</div>`;
    return;
  }
  root.innerHTML = list.map(item => `
    <div class="mini-card">
      <span class="badge">Aufgabe ${escapeHtml(item.aufgabe_nr)} | ${escapeHtml(item.niveau)}</span>
      ${correctBadge(item.korrekt)}
      <div>${escapeHtml(item.antwort_text || "")}</div>
      <div style="color:var(--muted);font-size:.9rem">Versuch ${escapeHtml(item.versuch_nr)} | ${escapeHtml(item.erstellt_at)}</div>
    </div>
  `).join("");
}

function renderChats(list) {
  const root = $("#chats-list");
  if (!list.length) {
    root.innerHTML = `<div class="mini-card">Noch keine KI-Nachrichten.</div>`;
    return;
  }
  root.innerHTML = list.map(item => `
    <div class="mini-card">
      <span class="badge">${escapeHtml(item.role)}</span>
      <div>${escapeHtml(item.message || "")}</div>
      <div style="color:var(--muted);font-size:.9rem">${escapeHtml(item.created_at)}</div>
    </div>
  `).join("");
}

function renderRequests(list) {
  const root = $("#requests-list");
  if (!list.length) {
    root.innerHTML = `<div class="mini-card">Keine KI-Anfragen.</div>`;
    return;
  }
  root.innerHTML = list.map(item => `
    <div class="mini-card">
      <span class="${badgeClass(item.status)}">${escapeHtml(item.status)}</span>
      <strong>${escapeHtml(item.typ)}</strong> | ${escapeHtml(item.kontext || "")}
      <div style="color:var(--muted);font-size:.9rem">${escapeHtml(item.erstellt_at)}</div>
    </div>
  `).join("");
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
