import datetime as dt
import hashlib
import json
import os
import secrets
import sqlite3
from functools import wraps

from dotenv import load_dotenv
from flask import Flask, jsonify, redirect, render_template, request, session, url_for
from flask_socketio import SocketIO, emit, join_room
import google.generativeai as genai


load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "data", "school.db")

APP_TITLE = "Mathe-Training Klasse 5"
APP_TOPIC_ID = "mathe-klasse-5-zahlen-rechnen"
TOTAL_TASKS = 8

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-change-me")
LEHRER_PASSWORD = os.environ.get("LEHRER_PASSWORD", "lehrer123")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3-flash-preview")
DAILY_TOKEN_LIMIT = int(os.environ.get("DAILY_TOKEN_LIMIT", "50000"))

SYSTEM_PROMPT = """
Du bist GSM-Lernassistent, ein ruhiger und ermutigender Mathe-Tutor fuer
Schuelerinnen und Schueler der Klasse 5 an der Gesamtschule Meiderich.
Thema: natuerliche Zahlen, Rechenregeln, Teilbarkeit, Runden,
Zahlenstrahl, Groessen und einfache Sachaufgaben.

Regeln:
- Antworte auf Deutsch und altersgerecht.
- Arbeite sokratisch: Stelle zuerst eine passende Rueckfrage oder gib einen
  kleinen Denkanstoss, bevor du rechnest.
- Gib die Endloesung nicht sofort vor. Verrate keine fertigen Ergebnisse,
  Antwortsaetze oder vollstaendigen Rechenwege, solange der Schueler noch
  selbst weiterarbeiten kann.
- Reagiere passgenau auf den Fehler oder die Frage: erst diagnostizieren,
  dann genau einen naechsten Schritt anbieten.
- Nutze kurze Schritte, Beispiele mit aehnlichen Zahlen und klare Begriffe.
- Wenn der Schueler eine fertige Loesung verlangt, antworte mit einem Hinweis
  und einer Frage wie: "Welchen Schritt wuerdest du zuerst pruefen?"
- Bei wiederholten Fehlversuchen darfst du staerker stuetzen, aber immer noch
  mindestens einen Denk- oder Rechenschritt offenlassen.
- Bei Formeln darfst du LaTeX mit $...$ verwenden.
- Sage ehrlich, wenn eine Antwort unsicher sein koennte.
""".strip()

CHECK_PROMPT = """
Pruefe die Antwort einer Schuelerin oder eines Schuelers aus Klasse 5.
Gib ein kurzes JSON-Objekt zurueck:
{"correct": true|false|null, "feedback": "kurzes Feedback mit naechstem Schritt"}
Nutze null, wenn die Antwort teilweise richtig ist oder eine offene Begruendung
nicht eindeutig als richtig/falsch bewertet werden kann.
Das Feedback muss sokratisch sein:
- Nenne nicht direkt die richtige Endloesung, wenn die Antwort falsch ist.
- Beschreibe kurz, was schon passt oder wo der Denkfehler liegen koennte.
- Gib genau einen konkreten naechsten Pruefschritt oder eine Rueckfrage.
- Bei richtigen Antworten darfst du knapp bestaetigen und eine Reflexionsfrage
  stellen, z.B. warum die Regel funktioniert.
- Schreibe maximal 2 kurze Saetze und bleibe ermutigend.
""".strip()

app = Flask(__name__)
app.secret_key = SECRET_KEY
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

TEACHER_ACTION_TOKENS = set()
ki_gesperrt = set()


def now_iso():
    return dt.datetime.now().isoformat(timespec="seconds")


def get_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA journal_mode=WAL")
    return db


def rows_to_dicts(rows):
    return [dict(row) for row in rows]


def init_db():
    with get_db() as db:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS schueler (
                id TEXT PRIMARY KEY,
                pseudonym TEXT NOT NULL,
                klasse TEXT NOT NULL,
                joined_at TEXT NOT NULL,
                last_active TEXT,
                socket_id TEXT
            );

            CREATE TABLE IF NOT EXISTS fortschritt (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                schueler_id TEXT NOT NULL,
                aufgabe_nr INTEGER NOT NULL,
                niveau TEXT DEFAULT 'A',
                erledigt_at TEXT NOT NULL,
                UNIQUE(schueler_id, aufgabe_nr, niveau)
            );

            CREATE TABLE IF NOT EXISTS antworten (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                schueler_id TEXT NOT NULL,
                aufgabe_nr TEXT NOT NULL,
                niveau TEXT NOT NULL,
                antwort_typ TEXT NOT NULL,
                antwort_text TEXT,
                korrekt INTEGER,
                versuch_nr INTEGER DEFAULT 1,
                erstellt_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS ki_anfragen (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                schueler_id TEXT NOT NULL,
                typ TEXT NOT NULL,
                kontext TEXT,
                status TEXT DEFAULT 'wartend',
                token_count INTEGER DEFAULT 0,
                erstellt_at TEXT NOT NULL,
                bearbeitet_at TEXT
            );

            CREATE TABLE IF NOT EXISTS token_budget (
                datum TEXT PRIMARY KEY,
                tokens_used INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS chat_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                schueler_id TEXT NOT NULL,
                request_id INTEGER,
                role TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS gespeicherte_sitzungen (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                snapshot_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            """
        )
        db.commit()


def clear_current_activity():
    with get_db() as db:
        db.execute("DELETE FROM fortschritt")
        db.execute("DELETE FROM antworten")
        db.execute("DELETE FROM ki_anfragen")
        db.execute("DELETE FROM chat_messages")
        db.execute("DELETE FROM schueler")
        db.commit()


def make_student_id(pseudonym, klasse):
    raw = f"{pseudonym}:{klasse}:{secrets.token_hex(16)}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]


def estimate_tokens(text):
    return max(1, len(text or "") // 4)


def get_today_tokens():
    today = dt.date.today().isoformat()
    with get_db() as db:
        row = db.execute(
            "SELECT tokens_used FROM token_budget WHERE datum=?", (today,)
        ).fetchone()
    return int(row["tokens_used"]) if row else 0


def add_tokens(count):
    today = dt.date.today().isoformat()
    with get_db() as db:
        db.execute(
            """
            INSERT INTO token_budget (datum, tokens_used) VALUES (?, ?)
            ON CONFLICT(datum) DO UPDATE SET tokens_used = tokens_used + ?
            """,
            (today, count, count),
        )
        db.commit()


def budget_ok():
    return get_today_tokens() < DAILY_TOKEN_LIMIT


def schueler_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if "schueler_id" not in session:
            return redirect(url_for("login"))
        return func(*args, **kwargs)

    return wrapper


def lehrer_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if not session.get("is_lehrer"):
            return redirect(url_for("lehrer_login"))
        return func(*args, **kwargs)

    return wrapper


def teacher_action_allowed():
    token = request.headers.get("X-Lehrer-Token", "")
    return bool(session.get("is_lehrer") or token in TEACHER_ACTION_TOKENS)


def teacher_action_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if not teacher_action_allowed():
            return jsonify({"ok": False, "error": "Nicht angemeldet."}), 403
        return func(*args, **kwargs)

    return wrapper


def serialize_answer_for_socket(sid, aufgabe, niveau, antwort_typ, antwort_text, korrekt):
    return {
        "schueler_id": sid,
        "pseudonym": session.get("pseudonym", "?"),
        "aufgabe_nr": str(aufgabe),
        "niveau": niveau,
        "antwort_typ": antwort_typ,
        "antwort_text": (antwort_text or "")[:600],
        "korrekt": korrekt,
        "erstellt_at": now_iso(),
    }


def dashboard_payload():
    with get_db() as db:
        students = rows_to_dicts(
            db.execute(
                """
                SELECT s.*,
                       COUNT(DISTINCT f.aufgabe_nr) AS aufgaben_erledigt
                FROM schueler s
                LEFT JOIN fortschritt f ON f.schueler_id = s.id
                GROUP BY s.id
                ORDER BY s.joined_at DESC
                """
            ).fetchall()
        )
        requests_ = rows_to_dicts(
            db.execute(
                """
                SELECT k.*, s.pseudonym, s.klasse
                FROM ki_anfragen k
                JOIN schueler s ON s.id = k.schueler_id
                ORDER BY k.erstellt_at DESC
                LIMIT 50
                """
            ).fetchall()
        )
        answers = rows_to_dicts(
            db.execute(
                """
                SELECT a.*, s.pseudonym, s.klasse
                FROM antworten a
                JOIN schueler s ON s.id = a.schueler_id
                ORDER BY a.erstellt_at DESC
                LIMIT 80
                """
            ).fetchall()
        )
        chats = rows_to_dicts(
            db.execute(
                """
                SELECT c.*, s.pseudonym, s.klasse
                FROM chat_messages c
                JOIN schueler s ON s.id = c.schueler_id
                ORDER BY c.created_at DESC
                LIMIT 60
                """
            ).fetchall()
        )
    return {
        "students": students,
        "requests": requests_,
        "answers": answers,
        "chats": chats,
        "tokens": {"today": get_today_tokens(), "limit": DAILY_TOKEN_LIMIT},
        "totalTasks": TOTAL_TASKS,
    }


def session_snapshot():
    tables = [
        "schueler",
        "fortschritt",
        "antworten",
        "ki_anfragen",
        "token_budget",
        "chat_messages",
    ]
    with get_db() as db:
        return {table: rows_to_dicts(db.execute(f"SELECT * FROM {table}").fetchall()) for table in tables}


def restore_snapshot(snapshot):
    tables = [
        "fortschritt",
        "antworten",
        "ki_anfragen",
        "chat_messages",
        "schueler",
        "token_budget",
    ]
    with get_db() as db:
        for table in tables:
            db.execute(f"DELETE FROM {table}")
        for table, rows in snapshot.items():
            if table == "gespeicherte_sitzungen":
                continue
            for row in rows:
                columns = list(row.keys())
                placeholders = ",".join(["?"] * len(columns))
                db.execute(
                    f"INSERT INTO {table} ({','.join(columns)}) VALUES ({placeholders})",
                    [row[column] for column in columns],
                )
        db.commit()


def gemini_reply(message, history=None):
    if not GEMINI_API_KEY:
        return (
            "Der KI-Tutor ist auf dem Server noch nicht konfiguriert. "
            "Setze GEMINI_API_KEY in der Umgebung, dann kann ich dir live helfen."
        )
    model = genai.GenerativeModel(GEMINI_MODEL, system_instruction=SYSTEM_PROMPT)
    chat_history = []
    for item in (history or [])[-10:]:
        role = item.get("role", "user")
        if role not in ("user", "model"):
            role = "user"
        chat_history.append({"role": role, "parts": [item.get("content", "")]})
    return model.start_chat(history=chat_history).send_message(message).text


def gemini_check(question, answer, context):
    if not GEMINI_API_KEY:
        return {
            "correct": None,
            "feedback": (
                "KI-Korrektur ist noch nicht konfiguriert. Vergleiche deine "
                "Antwort mit den Hinweisen und speichere sie fuer die Lehrkraft."
            ),
        }
    model = genai.GenerativeModel(GEMINI_MODEL, system_instruction=CHECK_PROMPT)
    response = model.generate_content(
        f"Kontext: {context}\nAufgabe: {question}\nAntwort: {answer}\n"
        "Antworte nur mit gueltigem JSON."
    ).text
    try:
        start = response.find("{")
        end = response.rfind("}") + 1
        return json.loads(response[start:end])
    except Exception:
        return {"correct": None, "feedback": response[:500]}


@app.route("/")
def root():
    if session.get("schueler_id"):
        return redirect(url_for("schueler"))
    return redirect(url_for("login"))


@app.route("/login", methods=["GET", "POST"])
def login():
    error = None
    if request.method == "POST":
        pseudonym = request.form.get("pseudonym", "").strip()[:30]
        klasse = request.form.get("klasse", "").strip()[:20]
        accepted = request.form.get("datenschutz") == "on"
        if len(pseudonym) < 2:
            error = "Bitte ein Pseudonym mit mindestens zwei Zeichen eingeben."
        elif not klasse:
            error = "Bitte Kurs oder Klasse eintragen."
        elif not accepted:
            error = "Bitte den Datenschutz- und KI-Hinweis bestaetigen."
        else:
            sid = make_student_id(pseudonym, klasse)
            joined_at = now_iso()
            with get_db() as db:
                db.execute(
                    """
                    INSERT INTO schueler (id, pseudonym, klasse, joined_at, last_active)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (sid, pseudonym, klasse, joined_at, joined_at),
                )
                db.commit()
            session.clear()
            session["schueler_id"] = sid
            session["pseudonym"] = pseudonym
            session["klasse"] = klasse
            socketio.emit(
                "neuer_schueler",
                {
                    "id": sid,
                    "pseudonym": pseudonym,
                    "klasse": klasse,
                    "joined_at": joined_at,
                    "aufgaben_erledigt": 0,
                },
                to="lehrer_room",
            )
            return redirect(url_for("schueler"))
    return render_template("login.html", error=error, title=APP_TITLE)


@app.route("/schueler")
@schueler_required
def schueler():
    return render_template(
        "index.html",
        pseudonym=session.get("pseudonym"),
        klasse=session.get("klasse"),
        title=APP_TITLE,
        topic_id=APP_TOPIC_ID,
        total_tasks=TOTAL_TASKS,
    )


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


@app.route("/lehrer/login", methods=["GET", "POST"])
def lehrer_login():
    error = None
    if request.method == "POST":
        if request.form.get("passwort", "") == LEHRER_PASSWORD:
            token = secrets.token_urlsafe(24)
            TEACHER_ACTION_TOKENS.add(token)
            session.clear()
            session["is_lehrer"] = True
            session["teacher_action_token"] = token
            return redirect(url_for("dashboard"))
        error = "Falsches Passwort."
    return render_template("lehrer_login.html", error=error, title=APP_TITLE)


@app.route("/lehrer")
@lehrer_required
def dashboard():
    return render_template(
        "dashboard.html",
        title=APP_TITLE,
        teacher_action_token=session.get("teacher_action_token", ""),
        total_tasks=TOTAL_TASKS,
    )


@app.route("/lehrer/schueler/<sid>")
@lehrer_required
def schueler_detail(sid):
    with get_db() as db:
        student = db.execute("SELECT * FROM schueler WHERE id=?", (sid,)).fetchone()
    if not student:
        return redirect(url_for("dashboard"))
    return render_template(
        "schueler_detail.html",
        title=APP_TITLE,
        student=dict(student),
        teacher_action_token=session.get("teacher_action_token", ""),
        total_tasks=TOTAL_TASKS,
    )


@app.route("/lehrer/logout")
def lehrer_logout():
    token = session.get("teacher_action_token")
    if token in TEACHER_ACTION_TOKENS:
        TEACHER_ACTION_TOKENS.remove(token)
    session.clear()
    return redirect(url_for("lehrer_login"))


@app.route("/api/me")
@schueler_required
def api_me():
    return jsonify(
        {
            "id": session.get("schueler_id"),
            "pseudonym": session.get("pseudonym"),
            "klasse": session.get("klasse"),
            "topicId": APP_TOPIC_ID,
        }
    )


@app.route("/api/fortschritt", methods=["POST"])
@schueler_required
def save_fortschritt():
    data = request.get_json(force=True)
    aufgabe = int(data.get("aufgabe", 0))
    niveau = (data.get("niveau") or "A")[:1]
    if aufgabe < 1 or aufgabe > TOTAL_TASKS:
        return jsonify({"ok": False, "error": "Unbekannte Aufgabe."}), 400
    sid = session["schueler_id"]
    updated_at = now_iso()
    with get_db() as db:
        db.execute(
            """
            INSERT OR REPLACE INTO fortschritt
            (schueler_id, aufgabe_nr, niveau, erledigt_at) VALUES (?, ?, ?, ?)
            """,
            (sid, aufgabe, niveau, updated_at),
        )
        db.execute("UPDATE schueler SET last_active=? WHERE id=?", (updated_at, sid))
        db.commit()
        count = db.execute(
            "SELECT COUNT(DISTINCT aufgabe_nr) AS c FROM fortschritt WHERE schueler_id=?",
            (sid,),
        ).fetchone()["c"]
    socketio.emit(
        "fortschritt_update",
        {"id": sid, "aufgabe": aufgabe, "niveau": niveau, "aufgaben_erledigt": count},
        to="lehrer_room",
    )
    return jsonify({"ok": True, "aufgaben_erledigt": count})


@app.route("/api/antwort", methods=["POST"])
@schueler_required
def save_antwort():
    data = request.get_json(force=True)
    aufgabe = str(data.get("aufgabe", ""))[:20]
    niveau = str(data.get("niveau", "A"))[:20]
    antwort_typ = str(data.get("antwort_typ", "freitext"))[:40]
    antwort_text = str(data.get("antwort_text", ""))[:4000]
    korrekt_raw = data.get("korrekt")
    korrekt = None if korrekt_raw is None else int(bool(korrekt_raw))
    sid = session["schueler_id"]
    created_at = now_iso()
    with get_db() as db:
        row = db.execute(
            """
            SELECT COALESCE(MAX(versuch_nr), 0) + 1 AS next_try
            FROM antworten WHERE schueler_id=? AND aufgabe_nr=?
            """,
            (sid, aufgabe),
        ).fetchone()
        db.execute(
            """
            INSERT INTO antworten
            (schueler_id, aufgabe_nr, niveau, antwort_typ, antwort_text, korrekt, versuch_nr, erstellt_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (sid, aufgabe, niveau, antwort_typ, antwort_text, korrekt, row["next_try"], created_at),
        )
        db.execute("UPDATE schueler SET last_active=? WHERE id=?", (created_at, sid))
        db.commit()
    payload = serialize_answer_for_socket(
        sid, aufgabe, niveau, antwort_typ, antwort_text, korrekt
    )
    payload["erstellt_at"] = created_at
    socketio.emit("antwort_update", payload, to="lehrer_room")
    return jsonify({"ok": True})


@app.route("/api/ki-anfrage", methods=["POST"])
@schueler_required
def ki_anfrage():
    if not budget_ok():
        return jsonify({"status": "budget_exceeded"})
    data = request.get_json(force=True)
    typ = str(data.get("typ", "chat"))[:30]
    kontext = str(data.get("kontext", ""))[:300]
    sid = session["schueler_id"]
    created_at = now_iso()
    with get_db() as db:
        cur = db.execute(
            """
            INSERT INTO ki_anfragen (schueler_id, typ, kontext, erstellt_at)
            VALUES (?, ?, ?, ?)
            """,
            (sid, typ, kontext, created_at),
        )
        db.commit()
        aid = cur.lastrowid
    socketio.emit(
        "neue_anfrage",
        {
            "id": aid,
            "schueler_id": sid,
            "pseudonym": session.get("pseudonym", "?"),
            "klasse": session.get("klasse", "?"),
            "typ": typ,
            "kontext": kontext,
            "status": "wartend",
            "erstellt_at": created_at,
        },
        to="lehrer_room",
    )
    return jsonify({"status": "wartend", "anfrage_id": aid})


@app.route("/api/ki-entscheidung", methods=["POST"])
@teacher_action_required
def ki_entscheidung():
    data = request.get_json(force=True)
    aid = int(data.get("anfrage_id", 0))
    entscheid = data.get("entscheid")
    if entscheid not in ("freigegeben", "abgelehnt"):
        return jsonify({"ok": False, "error": "Ungueltige Entscheidung."}), 400
    updated_at = now_iso()
    with get_db() as db:
        row = db.execute("SELECT * FROM ki_anfragen WHERE id=?", (aid,)).fetchone()
        if not row:
            return jsonify({"ok": False, "error": "Anfrage nicht gefunden."}), 404
        db.execute(
            "UPDATE ki_anfragen SET status=?, bearbeitet_at=? WHERE id=?",
            (entscheid, updated_at, aid),
        )
        db.commit()
    socketio.emit(
        "ki_entscheidung",
        {"id": aid, "entscheid": entscheid, "typ": row["typ"]},
        to=f"schueler_{row['schueler_id']}",
    )
    socketio.emit(
        "anfrage_update",
        {"id": aid, "status": entscheid, "bearbeitet_at": updated_at},
        to="lehrer_room",
    )
    return jsonify({"ok": True})


@app.route("/api/chat", methods=["POST"])
@schueler_required
def api_chat():
    data = request.get_json(force=True)
    sid = session["schueler_id"]
    aid = int(data.get("anfrage_id", 0))
    message = str(data.get("message", ""))[:3000]
    history = data.get("history", [])
    if sid in ki_gesperrt:
        return jsonify({"blocked": True, "message": "KI-Zugang ist gesperrt."}), 403
    with get_db() as db:
        row = db.execute(
            "SELECT * FROM ki_anfragen WHERE id=? AND schueler_id=?", (aid, sid)
        ).fetchone()
    if not row or row["status"] != "freigegeben":
        return jsonify({"blocked": True, "message": "Nicht freigegeben."}), 403
    if not budget_ok():
        return jsonify({"response": "Das Tagesbudget fuer KI-Anfragen ist erschoepft."})
    try:
        reply = gemini_reply(message, history)
    except Exception as exc:
        reply = f"Die KI-Verbindung hat gerade nicht geklappt: {exc}"
    tokens = estimate_tokens(message + reply)
    add_tokens(tokens)
    created_at = now_iso()
    with get_db() as db:
        db.execute(
            "UPDATE ki_anfragen SET token_count = token_count + ? WHERE id=?",
            (tokens, aid),
        )
        db.execute(
            """
            INSERT INTO chat_messages (schueler_id, request_id, role, message, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (sid, aid, "user", message, created_at),
        )
        db.execute(
            """
            INSERT INTO chat_messages (schueler_id, request_id, role, message, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (sid, aid, "model", reply, created_at),
        )
        db.commit()
    socketio.emit(
        "chat_live",
        {
            "schueler_id": sid,
            "pseudonym": session.get("pseudonym", "?"),
            "frage": message[:500],
            "antwort": reply[:700],
            "tokens": tokens,
            "created_at": created_at,
        },
        to="lehrer_room",
    )
    socketio.emit(
        "token_update",
        {"today": get_today_tokens(), "limit": DAILY_TOKEN_LIMIT},
        to="lehrer_room",
    )
    return jsonify({"response": reply, "tokens": tokens})


@app.route("/api/check-answer", methods=["POST"])
@schueler_required
def api_check_answer():
    data = request.get_json(force=True)
    sid = session["schueler_id"]
    aid = int(data.get("anfrage_id", 0))
    with get_db() as db:
        row = db.execute(
            "SELECT * FROM ki_anfragen WHERE id=? AND schueler_id=?", (aid, sid)
        ).fetchone()
    if not row or row["status"] != "freigegeben":
        return jsonify({"blocked": True, "message": "Nicht freigegeben."}), 403
    question = str(data.get("question", ""))[:1000]
    answer = str(data.get("answer", ""))[:4000]
    context = str(data.get("context", ""))[:1000]
    result = gemini_check(question, answer, context)
    tokens = estimate_tokens(question + answer + json.dumps(result, ensure_ascii=False))
    add_tokens(tokens)
    with get_db() as db:
        db.execute(
            "UPDATE ki_anfragen SET token_count = token_count + ? WHERE id=?",
            (tokens, aid),
        )
        db.commit()
    socketio.emit(
        "token_update",
        {"today": get_today_tokens(), "limit": DAILY_TOKEN_LIMIT},
        to="lehrer_room",
    )
    return jsonify(result)


@app.route("/api/dashboard-data")
@teacher_action_required
def api_dashboard_data():
    return jsonify(dashboard_payload())


@app.route("/api/schueler/<sid>")
@teacher_action_required
def api_student_detail(sid):
    with get_db() as db:
        student = db.execute("SELECT * FROM schueler WHERE id=?", (sid,)).fetchone()
        if not student:
            return jsonify({"ok": False}), 404
        answers = rows_to_dicts(
            db.execute(
                "SELECT * FROM antworten WHERE schueler_id=? ORDER BY erstellt_at DESC",
                (sid,),
            ).fetchall()
        )
        progress = rows_to_dicts(
            db.execute(
                "SELECT * FROM fortschritt WHERE schueler_id=? ORDER BY aufgabe_nr",
                (sid,),
            ).fetchall()
        )
        chats = rows_to_dicts(
            db.execute(
                "SELECT * FROM chat_messages WHERE schueler_id=? ORDER BY created_at DESC",
                (sid,),
            ).fetchall()
        )
        requests_ = rows_to_dicts(
            db.execute(
                "SELECT * FROM ki_anfragen WHERE schueler_id=? ORDER BY erstellt_at DESC",
                (sid,),
            ).fetchall()
        )
    return jsonify(
        {
            "student": dict(student),
            "answers": answers,
            "progress": progress,
            "chats": chats,
            "requests": requests_,
            "totalTasks": TOTAL_TASKS,
        }
    )


@app.route("/api/sitzungen", methods=["GET", "POST"])
@teacher_action_required
def api_sitzungen():
    if request.method == "POST":
        data = request.get_json(force=True)
        name = str(data.get("name", "")).strip()[:80] or f"Sitzung {now_iso()}"
        sid = secrets.token_hex(8)
        created_at = now_iso()
        snapshot = json.dumps(session_snapshot(), ensure_ascii=False)
        with get_db() as db:
            db.execute(
                """
                INSERT INTO gespeicherte_sitzungen
                (id, name, snapshot_json, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (sid, name, snapshot, created_at, created_at),
            )
            db.commit()
        return jsonify({"ok": True, "id": sid})
    with get_db() as db:
        sessions = rows_to_dicts(
            db.execute(
                """
                SELECT id, name, created_at, updated_at
                FROM gespeicherte_sitzungen
                ORDER BY updated_at DESC
                """
            ).fetchall()
        )
    return jsonify({"sessions": sessions})


@app.route("/api/sitzungen/<snapshot_id>/load", methods=["POST"])
@teacher_action_required
def api_load_sitzung(snapshot_id):
    with get_db() as db:
        row = db.execute(
            "SELECT snapshot_json FROM gespeicherte_sitzungen WHERE id=?",
            (snapshot_id,),
        ).fetchone()
    if not row:
        return jsonify({"ok": False}), 404
    restore_snapshot(json.loads(row["snapshot_json"]))
    socketio.emit("session_reloaded", {"message": "Sitzung wurde geladen."}, to="lehrer_room")
    return jsonify({"ok": True})


@app.route("/api/sitzungen/<snapshot_id>", methods=["DELETE"])
@teacher_action_required
def api_delete_sitzung(snapshot_id):
    with get_db() as db:
        db.execute("DELETE FROM gespeicherte_sitzungen WHERE id=?", (snapshot_id,))
        db.commit()
    return jsonify({"ok": True})


@app.route("/api/reset", methods=["POST"])
@teacher_action_required
def api_reset():
    clear_current_activity()
    socketio.emit("session_reloaded", {"message": "Aktuelle Sitzung wurde geloescht."}, to="lehrer_room")
    return jsonify({"ok": True})


@socketio.on("schueler_join")
def on_schueler_join(_data):
    sid = session.get("schueler_id")
    if not sid:
        return
    join_room(f"schueler_{sid}")
    updated_at = now_iso()
    with get_db() as db:
        db.execute(
            "UPDATE schueler SET socket_id=?, last_active=? WHERE id=?",
            (request.sid, updated_at, sid),
        )
        db.commit()
    socketio.emit("schueler_online", {"id": sid, "last_active": updated_at}, to="lehrer_room")


@socketio.on("lehrer_join")
def on_lehrer_join():
    if not session.get("is_lehrer"):
        return
    join_room("lehrer_room")
    emit("dashboard_snapshot", dashboard_payload())


@socketio.on("watch_schueler")
def on_watch_schueler(data):
    if not session.get("is_lehrer"):
        return
    sid = (data or {}).get("schueler_id")
    if sid:
        join_room(f"watch_{sid}")


@socketio.on("disconnect")
def on_disconnect():
    sid = session.get("schueler_id")
    if not sid:
        return
    with get_db() as db:
        db.execute("UPDATE schueler SET socket_id=NULL WHERE id=?", (sid,))
        db.commit()
    socketio.emit("schueler_offline", {"id": sid}, to="lehrer_room")


init_db()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    socketio.run(
        app,
        host="0.0.0.0",
        port=port,
        debug=False,
        allow_unsafe_werkzeug=True,
    )
