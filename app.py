# app.py

import os
import google.generativeai as genai
# WICHTIG: 'render_template' hinzugefügt
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from dotenv import load_dotenv

# Lädt die Umgebungsvariablen aus der .env-Datei (für lokale Tests)
load_dotenv()

# App initialisieren
app = Flask(__name__)
# CORS ist weiterhin gut, falls du die API doch mal von woanders aufrufst
CORS(app)

# KI-Modell (Gemini für Text) initialisieren
try:
    genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
    model = genai.GenerativeModel("gemini-2.0-flash") # Geändert zu Flash für schnellere Antworten
    print("KI-Modell (Text) erfolgreich initialisiert.")
except Exception as e:
    print(f"Fehler bei der Initialisierung des KI-Modells: {e}")
    model = None

# NEUE ROUTE: Diese Route liefert deine HTML-Seite aus
@app.route('/')
def index():
    # Sucht automatisch im 'templates' Ordner nach der Datei
    return render_template('mathe-klasse-5.html')

# ROUTE FÜR DAS MATHE-ARBEITSBLATT (unverändert)
@app.route('/chat_mathe', methods=['POST'])
def chat_mathe():
    if not model:
        return jsonify({'reply': 'Fehler: Das KI-Modell konnte nicht initialisiert werden.'}), 500

    user_message = request.json['message']

    system_prompt_mathe = """
    Du bist 'GSM-Lernassistent', ein freundlicher, geduldiger und ermutigender KI-Tutor.
    Deine Aufgabe ist es, Schülern der 5. Klasse bei ihren Mathe-Aufgaben zu helfen.
    ... (dein restlicher Prompt) ...
    """

    finaler_prompt = f"{system_prompt_mathe}\n\nDie Schüler-Nachricht lautet:\n'{user_message}'"

    try:
        response = model.generate_content(finaler_prompt)
        ai_response_text = response.text
    except Exception as e:
        print(f"Fehler bei der Anfrage an die KI: {e}")
        ai_response_text = "Entschuldigung, es gab ein Problem mit der KI-Verbindung."

    return jsonify({'reply': ai_response_text})


# ROUTE FÜR DAS ÄGYPTEN-INTERVIEW (unverändert)
@app.route('/chat_essam', methods=['POST'])
def chat_essam():
    if not model:
        return jsonify({'reply': 'Fehler: Das KI-Modell konnte nicht initialisiert werden.'}), 500

    user_message = request.json['message']

    system_prompt_essam = """
    --- HINTERGRUND & ROLLE ---
    Du bist Essam ibn Kheti.
    ... (dein restlicher Prompt) ...
    """

    finaler_prompt = f"{system_prompt_essam}\n\nFrage des Interviewers: '{user_message}'"

    try:
        response = model.generate_content(finaler_prompt)
        ai_response_text = response.text
    except Exception as e:
        print(f"Fehler bei der Anfrage an die KI: {e}")
        ai_response_text = "Entschuldigung, die Verbindung zu den Göttern ist heute schlecht."

    return jsonify({'reply': ai_response_text})

# Dieser Block startet den Server nur, wenn du die Datei lokal auf deinem PC ausführst
# Render.com wird diesen Block ignorieren und Gunicorn verwenden.
if __name__ == '__main__':
    # Nutzt den PORT von Render oder 5000 lokal
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False) # Debug IMMER auf False in Produktion