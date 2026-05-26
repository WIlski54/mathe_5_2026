const TASKS = [
  {
    id: 1,
    title: "Punkt vor Strich",
    question: "Berechne Terme in der richtigen Reihenfolge.",
    image: "/static/img/tasks/task-01-punkt-vor-strich.png",
    imageAlt: "Symbolkarte zu Punkt vor Strich mit Klammern, Multiplikation, Division, Plus und Minus.",
    levels: {
      A: { kind: "number", prompt: "7 + 3 * 6 =", expected: 25, placeholder: "Ergebnis" },
      B: { kind: "number", prompt: "8 + 4 * (12 - 9) =", expected: 20, placeholder: "Ergebnis" },
      C: { kind: "text", prompt: "Erfinde einen Term mit Klammer und Punkt-vor-Strich. Berechne ihn und erklaere die Reihenfolge." }
    }
  },
  {
    id: 2,
    title: "Teilbarkeit",
    question: "Erkenne passende Teiler einer Zahl.",
    image: "/static/img/tasks/task-02-teilbarkeit.png",
    imageAlt: "Symbolkarte zur Teilbarkeit mit Lupe, der Zahl 24 und passenden Teilern.",
    levels: {
      A: { kind: "multi", prompt: "Wodurch ist 240 teilbar?", expected: ["2", "5", "10"], options: ["2", "3", "5", "10"] },
      B: { kind: "multi", prompt: "Wodurch ist 456 teilbar?", expected: ["2", "3"], options: ["2", "3", "5", "9", "10"] },
      C: { kind: "text", prompt: "Erklaere, warum 1 260 durch 2, 3, 5 und 10 teilbar ist, aber nicht durch 9." }
    }
  },
  {
    id: 3,
    title: "Runden",
    question: "Runde Zahlen sinnvoll und begruende.",
    image: "/static/img/tasks/task-03-runden.png",
    imageAlt: "Symbolkarte zum Runden mit Zahlenstrahl von 400 bis 600.",
    levels: {
      A: { kind: "number", prompt: "Runde 871 auf Hunderter.", expected: 900, placeholder: "Gerundete Zahl" },
      B: { kind: "structured", prompt: "Runde 4 728 auf Zehner, Hunderter und Tausender.", fields: ["Zehner", "Hunderter", "Tausender"], expected: ["4730", "4700", "5000"] },
      C: { kind: "text", prompt: "Ein Stadion meldet 18 642 Besucher. Welche gerundete Zahl waere in einer Zeitung sinnvoll? Begruende." }
    }
  },
  {
    id: 4,
    title: "Zahlenstrahl",
    question: "Ordne natuerliche Zahlen auf dem Zahlenstrahl.",
    image: "/static/img/tasks/task-04-zahlenstrahl.png",
    imageAlt: "Symbolkarte zum Zahlenstrahl mit Markierung zwischen 400 und 500.",
    levels: {
      A: { kind: "numberline", prompt: "Schiebe den Punkt auf die Zahl 450.", min: 400, max: 500, step: 10, start: 420, expected: 450, tolerance: 0 },
      B: { kind: "structured", prompt: "Ordne die Zahlen 720, 702, 772, 727 vom kleinsten zum groessten Wert.", fields: ["1", "2", "3", "4"], expected: ["702", "720", "727", "772"] },
      C: { kind: "text", prompt: "Beschreibe eine Strategie, wie du grosse Zahlen sicher am Zahlenstrahl einordnest." }
    }
  },
  {
    id: 5,
    title: "Groessen umrechnen",
    question: "Rechne Laengen und Zeiten passend um.",
    image: "/static/img/tasks/task-05-groessen-umrechnen.png",
    imageAlt: "Symbolkarte zum Umrechnen von Groessen mit Lineal und Stoppuhr.",
    levels: {
      A: { kind: "number", prompt: "3 m 40 cm sind wie viele cm?", expected: 340, placeholder: "cm" },
      B: { kind: "number", prompt: "2 h 15 min sind wie viele Minuten?", expected: 135, placeholder: "Minuten" },
      C: { kind: "text", prompt: "Eine Strecke ist 1 km 250 m lang. Erklaere zwei verschiedene Schreibweisen fuer diese Laenge." }
    }
  },
  {
    id: 6,
    title: "Sachaufgabe",
    question: "Waehle die passende Rechnung und schreibe einen Antwortsatz.",
    image: "/static/img/tasks/task-06-sachaufgabe.png",
    imageAlt: "Symbolkarte zu Sachaufgaben mit Apfelkiste und Fragezeichen.",
    levels: {
      A: { kind: "number", prompt: "In 6 Kisten liegen je 24 Aepfel. Wie viele Aepfel sind es zusammen?", expected: 144, placeholder: "Anzahl" },
      B: { kind: "number", prompt: "Ein Bus hat 52 Plaetze. 4 Busse fahren voll, im 5. Bus sitzen 31 Kinder. Wie viele Kinder fahren mit?", expected: 239, placeholder: "Kinder" },
      C: { kind: "text", prompt: "Erfinde eine eigene Sachaufgabe, die man mit zwei Rechenschritten loesen muss, und loese sie." }
    }
  },
  {
    id: 7,
    title: "Fehler finden",
    question: "Pruefe Rechenwege und verbessere Fehler.",
    image: "/static/img/tasks/task-07-fehler-finden.png",
    imageAlt: "Symbolkarte zum Fehlerfinden mit falscher Rechnung und Lupe.",
    levels: {
      A: { kind: "number", prompt: "Tom rechnet 6 + 4 * 5 = 50. Was ist das richtige Ergebnis?", expected: 26, placeholder: "Ergebnis" },
      B: { kind: "text", prompt: "Erklaere Toms Fehler: 6 + 4 * 5 = 50. Schreibe den richtigen Rechenweg auf." },
      C: { kind: "text", prompt: "Warum ist Fehlerfinden in Mathe nuetzlich? Nutze ein eigenes Beispiel mit Rechenreihenfolge." }
    }
  },
  {
    id: 8,
    title: "Mathe erklaeren",
    question: "Formuliere Regeln so, dass andere sie verstehen.",
    image: "/static/img/tasks/task-08-mathe-erklaeren.png",
    imageAlt: "Symbolkarte zum Erklaeren von Mathe mit Sprechblase und Gluehbirne.",
    levels: {
      A: { kind: "text", prompt: "Schreibe die Regel Punkt-vor-Strich in eigenen Worten." },
      B: { kind: "text", prompt: "Vergleiche die Regeln fuer Teilbarkeit durch 2, 5 und 10. Was ist gleich, was ist verschieden?" },
      C: { kind: "text", prompt: "Erstelle einen kurzen Lernzettel mit drei Tipps fuer eine Klassenarbeit zu diesem Thema." }
    }
  }
];

const state = {
  currentTab: "start",
  levels: {},
  answers: {},
  selected: {},
  completed: new Set(),
  chatHistory: [],
  approvedAnfragen: {},
  pendingTyp: null,
  pendingKontext: "",
  pendingCallback: null,
  pendingAnfrageId: null
};

let socket = null;

document.addEventListener("DOMContentLoaded", () => {
  renderTasks();
  bindTabs();
  bindBackup();
  bindChat();
  bindKiModal();
  connectSocket();
  updateProgress();
});

function $(selector, root = document) {
  return root.querySelector(selector);
}

function $all(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

function renderTasks() {
  const root = $("#tasks-root");
  root.innerHTML = TASKS.map(task => renderTask(task)).join("");
  TASKS.forEach(task => {
    state.levels[task.id] = "A";
    setTaskNiveau(task.id, "A");
  });
  initNumberlineInteractions(root);
  root.addEventListener("click", event => {
    const levelBtn = event.target.closest("[data-set-level]");
    if (levelBtn) setTaskNiveau(levelBtn.dataset.taskId, levelBtn.dataset.level);

    const checkBtn = event.target.closest("[data-check-task]");
    if (checkBtn) checkTask(checkBtn.dataset.taskId);

    const saveBtn = event.target.closest("[data-save-task]");
    if (saveBtn) saveTask(saveBtn.dataset.taskId, null);

    const kiBtn = event.target.closest("[data-ki-task]");
    if (kiBtn) requestKiCorrection(kiBtn.dataset.taskId);

    const nudgeBtn = event.target.closest("[data-numberline-nudge]");
    if (nudgeBtn) {
      const widget = nudgeBtn.closest("[data-numberline]");
      const next = Number(widget.dataset.value) + Number(nudgeBtn.dataset.numberlineNudge);
      setNumberlineValue(widget, next);
      cacheAnswer(nudgeBtn.closest("[data-task-card]").dataset.taskCard);
    }
  });
  root.addEventListener("input", event => {
    const taskCard = event.target.closest("[data-task-card]");
    if (taskCard) cacheAnswer(taskCard.dataset.taskCard);
  });
  root.addEventListener("change", event => {
    const taskCard = event.target.closest("[data-task-card]");
    if (taskCard) cacheAnswer(taskCard.dataset.taskCard);
  });
}

function renderTask(task) {
  const levels = ["A", "B", "C"];
  return `
    <article class="task-card" data-task-card="${task.id}">
      <div class="task-intro">
        <figure class="task-visual">
          <img src="${task.image}" alt="${escapeHtml(task.imageAlt)}" loading="lazy">
        </figure>
        <div>
          <div class="task-head">
            <div class="task-number">${task.id}</div>
            <div>
              <h2>${escapeHtml(task.title)}</h2>
              <p>${escapeHtml(task.question)}</p>
            </div>
          </div>
          <div class="niveau-row" aria-label="Niveau fuer Aufgabe ${task.id}">
            ${levels.map(level => `
              <button class="niveau-btn" type="button" data-set-level data-task-id="${task.id}" data-level="${level}">
                Niveau ${level}
              </button>`).join("")}
          </div>
          ${levels.map(level => renderLevel(task, level, task.levels[level])).join("")}
        </div>
      </div>
      <div class="task-actions">
        <button class="btn-outline" type="button" data-check-task="${task.id}">Pruefen</button>
        <button class="btn-primary" type="button" data-save-task="${task.id}">Antwort speichern</button>
        <button class="btn-magenta" type="button" data-ki-task="${task.id}">KI-Feedback</button>
      </div>
      <p class="feedback" id="feedback-${task.id}" aria-live="polite"></p>
    </article>
  `;
}

function renderLevel(task, level, cfg) {
  const base = `task-${task.id}-${level}`;
  let body = "";
  if (cfg.kind === "number") {
    body = `
      <label for="${base}-value">${escapeHtml(cfg.prompt)}</label>
      <input class="field" id="${base}-value" data-answer-field type="number" inputmode="numeric" placeholder="${escapeHtml(cfg.placeholder || "Antwort")}">
    `;
  } else if (cfg.kind === "numberline") {
    const start = cfg.start ?? cfg.min;
    body = `
      <p><strong>${escapeHtml(cfg.prompt)}</strong></p>
      <div class="numberline-task" data-numberline data-min="${cfg.min}" data-max="${cfg.max}" data-step="${cfg.step}" data-value="${start}">
        <div class="numberline-scale">
          ${renderNumberlineTicks(cfg)}
          <button class="numberline-handle" type="button" role="slider" aria-label="Punkt auf dem Zahlenstrahl verschieben" aria-valuemin="${cfg.min}" aria-valuemax="${cfg.max}" aria-valuenow="${start}" style="left:${numberlinePercent(start, cfg)}%"></button>
        </div>
        <div class="numberline-readout">Aktuelle Zahl: <strong data-numberline-readout>${start}</strong></div>
        <div class="task-actions">
          <button class="btn-outline" type="button" data-numberline-nudge="-${cfg.step}">- ${cfg.step}</button>
          <button class="btn-outline" type="button" data-numberline-nudge="${cfg.step}">+ ${cfg.step}</button>
        </div>
        <input data-answer-field type="hidden" value="${start}">
      </div>
    `;
  } else if (cfg.kind === "multi") {
    body = `
      <p><strong>${escapeHtml(cfg.prompt)}</strong></p>
      <div class="choice-grid">
        ${cfg.options.map(option => `
          <label class="choice" for="${base}-${option}">
            <input id="${base}-${option}" data-answer-field type="checkbox" value="${escapeHtml(option)}">
            <span>durch ${escapeHtml(option)}</span>
          </label>`).join("")}
      </div>
    `;
  } else if (cfg.kind === "structured") {
    body = `
      <p><strong>${escapeHtml(cfg.prompt)}</strong></p>
      <div class="answer-grid">
        ${cfg.fields.map(field => `
          <label>${escapeHtml(field)}
            <input class="field" data-answer-field data-field-name="${escapeHtml(field)}" type="text" inputmode="numeric">
          </label>`).join("")}
      </div>
    `;
  } else {
    body = `
      <label for="${base}-text">${escapeHtml(cfg.prompt)}</label>
      <textarea id="${base}-text" data-answer-field placeholder="Schreibe deine Antwort in ganzen Saetzen."></textarea>
    `;
  }
  return `<div class="level-content" data-task-id="${task.id}" data-level-content="${level}">${body}</div>`;
}

function renderNumberlineTicks(cfg) {
  const ticks = [];
  const range = cfg.max - cfg.min;
  for (let value = cfg.min; value <= cfg.max; value += cfg.step) {
    const major = value === cfg.min || value === cfg.max || value === cfg.expected;
    ticks.push(`
      <span class="numberline-task-tick ${major ? "major" : ""}" style="left:${((value - cfg.min) / range) * 100}%">
        ${major ? value : ""}
      </span>
    `);
  }
  return ticks.join("");
}

function numberlinePercent(value, cfgOrWidget) {
  const min = Number(cfgOrWidget.min ?? cfgOrWidget.dataset.min);
  const max = Number(cfgOrWidget.max ?? cfgOrWidget.dataset.max);
  const clamped = Math.min(max, Math.max(min, Number(value)));
  return ((clamped - min) / (max - min)) * 100;
}

function initNumberlineInteractions(root) {
  $all("[data-numberline]", root).forEach(widget => {
    const scale = $(".numberline-scale", widget);
    const handle = $(".numberline-handle", widget);

    scale.addEventListener("pointerdown", event => {
      event.preventDefault();
      scale.setPointerCapture(event.pointerId);
      updateNumberlineFromPointer(widget, event);
    });

    scale.addEventListener("pointermove", event => {
      if (scale.hasPointerCapture(event.pointerId)) {
        updateNumberlineFromPointer(widget, event);
      }
    });

    scale.addEventListener("pointerup", event => {
      if (scale.hasPointerCapture(event.pointerId)) {
        updateNumberlineFromPointer(widget, event);
        scale.releasePointerCapture(event.pointerId);
        cacheAnswer(widget.closest("[data-task-card]").dataset.taskCard);
      }
    });

    handle.addEventListener("keydown", event => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const step = Number(widget.dataset.step);
      if (event.key === "ArrowLeft") setNumberlineValue(widget, Number(widget.dataset.value) - step);
      if (event.key === "ArrowRight") setNumberlineValue(widget, Number(widget.dataset.value) + step);
      if (event.key === "Home") setNumberlineValue(widget, Number(widget.dataset.min));
      if (event.key === "End") setNumberlineValue(widget, Number(widget.dataset.max));
      cacheAnswer(widget.closest("[data-task-card]").dataset.taskCard);
    });
  });
}

function updateNumberlineFromPointer(widget, event) {
  const scale = $(".numberline-scale", widget);
  const rect = scale.getBoundingClientRect();
  const ratio = (event.clientX - rect.left) / rect.width;
  const min = Number(widget.dataset.min);
  const max = Number(widget.dataset.max);
  const value = min + ratio * (max - min);
  setNumberlineValue(widget, value);
}

function setNumberlineValue(widget, rawValue) {
  const min = Number(widget.dataset.min);
  const max = Number(widget.dataset.max);
  const step = Number(widget.dataset.step);
  const stepped = Math.round((Number(rawValue) - min) / step) * step + min;
  const value = Math.min(max, Math.max(min, stepped));
  widget.dataset.value = String(value);
  $(".numberline-handle", widget).style.left = `${numberlinePercent(value, widget)}%`;
  $(".numberline-handle", widget).setAttribute("aria-valuenow", String(value));
  $("[data-numberline-readout]", widget).textContent = String(value);
  $("[data-answer-field]", widget).value = String(value);
}

function setTaskNiveau(taskId, level) {
  taskId = String(taskId);
  state.levels[taskId] = level;
  const card = $(`[data-task-card="${taskId}"]`);
  if (!card) return;
  $all(".niveau-btn", card).forEach(btn => btn.classList.toggle("active", btn.dataset.level === level));
  $all("[data-level-content]", card).forEach(panel => panel.classList.toggle("active", panel.dataset.levelContent === level));
  cacheAnswer(taskId);
}

function bindTabs() {
  $all(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      state.currentTab = btn.dataset.tab;
      $all(".tab-btn").forEach(item => item.classList.toggle("active", item === btn));
      $all(".tab-panel").forEach(panel => panel.classList.toggle("active", panel.id === `tab-${btn.dataset.tab}`));
    });
  });
}

function getTask(taskId) {
  return TASKS.find(task => String(task.id) === String(taskId));
}

function getActiveConfig(taskId) {
  const task = getTask(taskId);
  const level = state.levels[String(taskId)] || "A";
  return { task, level, cfg: task.levels[level] };
}

function collectAnswer(taskId) {
  const { level, cfg } = getActiveConfig(taskId);
  const card = $(`[data-task-card="${taskId}"]`);
  const panel = $(`[data-level-content="${level}"]`, card);
  if (cfg.kind === "multi") {
    return $all("[data-answer-field]:checked", panel).map(input => input.value).sort();
  }
  if (cfg.kind === "structured") {
    const values = {};
    $all("[data-answer-field]", panel).forEach(input => {
      values[input.dataset.fieldName] = input.value.trim();
    });
    return values;
  }
  const input = $("[data-answer-field]", panel);
  return input ? input.value.trim() : "";
}

function answerToText(answer) {
  if (Array.isArray(answer)) return answer.join(", ");
  if (answer && typeof answer === "object") {
    return Object.entries(answer).map(([key, value]) => `${key}: ${value}`).join("; ");
  }
  return String(answer || "");
}

function cacheAnswer(taskId) {
  const { level } = getActiveConfig(taskId);
  const answer = collectAnswer(taskId);
  state.answers[`${taskId}:${level}`] = answer;
}

function checkTask(taskId) {
  const { cfg } = getActiveConfig(taskId);
  const answer = collectAnswer(taskId);
  let correct = null;
  let message = "Gespeichert. Deine Lehrkraft kann die Antwort pruefen.";
  if (cfg.kind === "number") {
    correct = Number(answer) === Number(cfg.expected);
    message = correct ? "Richtig. Guter Schritt." : "Noch nicht richtig. Pruefe die Rechenreihenfolge.";
  } else if (cfg.kind === "numberline") {
    correct = Math.abs(Number(answer) - Number(cfg.expected)) <= Number(cfg.tolerance ?? 0);
    message = correct ? "Genau richtig platziert." : "Noch nicht ganz. Schiebe den Punkt in die Mitte zwischen den Randzahlen.";
  } else if (cfg.kind === "multi") {
    correct = JSON.stringify(answer) === JSON.stringify([...cfg.expected].sort());
    message = correct ? "Richtig ausgewaehlt." : "Noch nicht ganz. Nutze die Teilbarkeitsregeln.";
  } else if (cfg.kind === "structured") {
    const values = Object.values(answer).map(value => String(value).replace(/\s/g, ""));
    correct = JSON.stringify(values) === JSON.stringify(cfg.expected);
    message = correct ? "Richtig." : "Pruefe die einzelnen Stellen noch einmal.";
  } else {
    const words = answerToText(answer).split(/\s+/).filter(Boolean).length;
    correct = words >= 8 ? null : false;
    message = words >= 8 ? "Ausfuehrliche Antwort erkannt. Speichere sie oder frage KI-Feedback an." : "Schreibe mindestens einige ganze Saetze.";
  }
  showFeedback(taskId, correct === true ? "ok" : correct === false ? "err" : "info", message);
  if (correct === true) markComplete(taskId);
  saveTask(taskId, correct);
}

async function saveTask(taskId, correct) {
  const { level, cfg } = getActiveConfig(taskId);
  const answer = collectAnswer(taskId);
  const text = answerToText(answer);
  if (!text.trim()) {
    showFeedback(taskId, "err", "Bitte zuerst eine Antwort eintragen.");
    return;
  }
  cacheAnswer(taskId);
  try {
    await fetch("/api/antwort", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aufgabe: taskId,
        niveau: level,
        antwort_typ: cfg.kind,
        antwort_text: text,
        korrekt: correct
      })
    });
    await fetch("/api/fortschritt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aufgabe: Number(taskId), niveau: level })
    });
    markComplete(taskId);
    showFeedback(taskId, "ok", "Antwort gespeichert.");
  } catch (error) {
    showFeedback(taskId, "err", "Speichern hat nicht geklappt.");
  }
}

function markComplete(taskId) {
  state.completed.add(String(taskId));
  updateProgress();
}

function updateProgress() {
  const total = Number(document.body.dataset.totalTasks || TASKS.length);
  const done = state.completed.size;
  $("#progress-label").textContent = `${done}/${total} Aufgaben`;
  $("#progress-fill").style.width = `${Math.round((done / total) * 100)}%`;
}

function showFeedback(taskId, type, text) {
  const box = $(`#feedback-${taskId}`);
  if (!box) return;
  box.className = `feedback ${type}`;
  box.textContent = text;
}

function bindKiModal() {
  $("#modal-anfrage-btn").addEventListener("click", sendKiRequest);
  $("#modal-cancel-btn").addEventListener("click", closeKiOverlay);
}

function requestKiAccess(typ, kontext, callback) {
  const existing = Object.entries(state.approvedAnfragen).find(([, value]) => value === typ);
  if (existing) {
    callback(Number(existing[0]));
    return;
  }
  state.pendingTyp = typ;
  state.pendingKontext = kontext;
  state.pendingCallback = callback;
  $("#modal-title").textContent = typ === "chat" ? "KI-Tutor anfragen" : "KI-Feedback anfragen";
  $("#modal-text").textContent = typ === "chat"
    ? "Deine Frage bleibt im Eingabefeld. Nach Freigabe kannst du sie senden."
    : "Die KI kann deine Antwort mit Hinweisen pruefen. Die Lehrkraft gibt das kurz frei.";
  $("#warte-status").classList.remove("show");
  $("#modal-anfrage-btn").style.display = "";
  $("#ki-overlay").classList.add("show");
}

async function sendKiRequest() {
  $("#modal-anfrage-btn").style.display = "none";
  $("#warte-status").classList.add("show");
  const response = await fetch("/api/ki-anfrage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ typ: state.pendingTyp, kontext: state.pendingKontext })
  });
  const data = await response.json();
  if (data.status === "budget_exceeded") {
    $("#warte-status").textContent = "Das Tagesbudget ist erschoepft.";
  } else {
    state.pendingAnfrageId = data.anfrage_id;
  }
}

function closeKiOverlay() {
  $("#ki-overlay").classList.remove("show");
}

function connectSocket() {
  if (typeof io === "undefined") return;
  socket = io();
  socket.on("connect", () => socket.emit("schueler_join", {}));
  socket.on("ki_entscheidung", data => {
    closeKiOverlay();
    if (data.entscheid === "freigegeben") {
      state.approvedAnfragen[data.id] = data.typ;
      toast("Freigegeben.");
      if (state.pendingCallback) {
        const callback = state.pendingCallback;
        state.pendingCallback = null;
        callback(data.id);
      }
    } else {
      toast("Die Anfrage wurde abgelehnt.", true);
    }
  });
  socket.on("session_reloaded", () => toast("Die Lehrkraft hat die Sitzung aktualisiert.", true));
}

function requestKiCorrection(taskId) {
  const { task, level } = getActiveConfig(taskId);
  const answer = answerToText(collectAnswer(taskId));
  if (answer.length < 12) {
    showFeedback(taskId, "err", "Schreibe erst eine Antwort, damit die KI etwas pruefen kann.");
    return;
  }
  requestKiAccess("korrektur", `Aufgabe ${taskId}, Niveau ${level}`, aid => runKiCorrection(task, level, answer, aid));
}

async function runKiCorrection(task, level, answer, aid) {
  showFeedback(task.id, "info", "KI-Feedback wird erstellt...");
  const response = await fetch("/api/check-answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question: task.levels[level].prompt,
      answer,
      context: "Mathe Klasse 5, natuerliche Zahlen und Rechnen",
      anfrage_id: aid
    })
  });
  const data = await response.json();
  if (data.blocked) {
    showFeedback(task.id, "err", "Nicht freigegeben.");
    return;
  }
  const type = data.correct === true ? "ok" : data.correct === false ? "err" : "info";
  showFeedback(task.id, type, data.feedback || "Feedback erhalten.");
  await saveTask(task.id, data.correct);
}

function bindChat() {
  $("#chat-toggle").addEventListener("click", () => $("#chat-panel").classList.toggle("open"));
  $("#chat-send-btn").addEventListener("click", sendChat);
  $("#chat-request-btn").addEventListener("click", () => {
    const text = $("#chat-input").value.trim();
    if (!text) {
      toast("Schreibe zuerst deine Frage.", true);
      return;
    }
    requestKiAccess("chat", text.slice(0, 240), aid => {
      state.approvedAnfragen[aid] = "chat";
      $("#chat-status").textContent = "Freigegeben";
      toast("Du kannst deine Frage senden.");
    });
  });
}

async function sendChat() {
  const input = $("#chat-input");
  const text = input.value.trim();
  if (!text) return;
  const chatAid = Object.entries(state.approvedAnfragen).find(([, typ]) => typ === "chat");
  if (!chatAid) {
    requestKiAccess("chat", text.slice(0, 240), aid => {
      state.approvedAnfragen[aid] = "chat";
      $("#chat-status").textContent = "Freigegeben";
      sendChat();
    });
    return;
  }
  input.value = "";
  addChatMessage("user", text);
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: text,
      history: state.chatHistory,
      anfrage_id: Number(chatAid[0])
    })
  });
  const data = await response.json();
  if (data.blocked) {
    addChatMessage("model", data.message || "Nicht freigegeben.");
    return;
  }
  addChatMessage("model", data.response || "Keine Antwort erhalten.");
}

function addChatMessage(role, text) {
  state.chatHistory.push({ role: role === "model" ? "model" : "user", content: text });
  const box = document.createElement("div");
  box.className = `msg ${role}`;
  box.innerHTML = renderSafeMarkdown(text);
  $("#chat-log").appendChild(box);
  $("#chat-log").scrollTop = $("#chat-log").scrollHeight;
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([box]);
}

function renderSafeMarkdown(text) {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}

function bindBackup() {
  $("#export-json-btn").addEventListener("click", exportJson);
  $("#import-json-btn").addEventListener("click", () => $("#import-json-file").click());
  $("#import-json-file").addEventListener("change", importJsonFile);
  $("#paste-json-btn").addEventListener("click", () => $("#backup-text-wrap").classList.toggle("show"));
  $("#load-json-text-btn").addEventListener("click", () => importJsonText($("#backup-json-text").value));
}

async function exportJson() {
  TASKS.forEach(task => cacheAnswer(task.id));
  const payload = {
    schema_version: 1,
    app: document.body.dataset.topicId,
    exported_at: new Date().toISOString(),
    active_tab: state.currentTab,
    levels: state.levels,
    answers: state.answers,
    completed: [...state.completed]
  };
  const text = JSON.stringify(payload, null, 2);
  $("#backup-json-text").value = text;
  $("#backup-text-wrap").classList.add("show");
  const blob = new Blob([text], { type: "application/json" });
  const file = new File([blob], "mathe-training-backup.json", { type: "application/json" });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: "Mathe-Backup" });
    } else {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "mathe-training-backup.json";
      link.click();
      URL.revokeObjectURL(url);
    }
    backupFeedback("Sicherung erstellt.", "ok");
  } catch {
    backupFeedback("Sicherung als Text bereitgestellt.", "info");
  }
}

function importJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => importJsonText(reader.result);
  reader.readAsText(file);
}

function importJsonText(text) {
  try {
    const data = JSON.parse(text);
    if (data.schema_version !== 1 || data.app !== document.body.dataset.topicId) {
      throw new Error("Falsches Sicherungsformat.");
    }
    state.levels = data.levels || {};
    state.answers = data.answers || {};
    state.completed = new Set((data.completed || []).map(String));
    restoreInputs();
    updateProgress();
    backupFeedback("Sicherung geladen. Noch nicht an die Lehrkraft gesendet.", "ok");
  } catch (error) {
    backupFeedback(`Import fehlgeschlagen: ${error.message}`, "err");
  }
}

function restoreInputs() {
  TASKS.forEach(task => {
    const level = state.levels[String(task.id)] || "A";
    setTaskNiveau(task.id, level);
    ["A", "B", "C"].forEach(lvl => {
      const key = `${task.id}:${lvl}`;
      const answer = state.answers[key];
      if (answer === undefined) return;
      const card = $(`[data-task-card="${task.id}"]`);
      const panel = $(`[data-level-content="${lvl}"]`, card);
      const cfg = task.levels[lvl];
      if (cfg.kind === "multi") {
        $all("[data-answer-field]", panel).forEach(input => input.checked = Array.isArray(answer) && answer.includes(input.value));
      } else if (cfg.kind === "numberline") {
        const widget = $("[data-numberline]", panel);
        if (widget) setNumberlineValue(widget, Number(answer));
      } else if (cfg.kind === "structured") {
        $all("[data-answer-field]", panel).forEach(input => input.value = answer[input.dataset.fieldName] || "");
      } else {
        const input = $("[data-answer-field]", panel);
        if (input) input.value = answer || "";
      }
    });
  });
}

function backupFeedback(text, type) {
  const box = $("#backup-feedback");
  box.className = `feedback ${type}`;
  box.textContent = text;
}

function toast(text, isError = false) {
  const node = $("#toast");
  node.textContent = text;
  node.style.background = isError ? "var(--danger)" : "var(--gsm-blau)";
  node.classList.add("show");
  setTimeout(() => node.classList.remove("show"), 2600);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
