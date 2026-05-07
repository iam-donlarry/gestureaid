import numpy as np
import pickle
import csv
import os
import subprocess
import smtplib
from email.mime.text import MIMEText
from flask import Flask, jsonify
from flask_socketio import SocketIO
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- CONFIGURATION ---
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
APP_PASSWORD = os.getenv("APP_PASSWORD")
MODEL_PATH = 'gesture_model.pkl'
DATA_PATH = 'data.csv'

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# Global State
model = None
is_collecting = False
collect_label = ""

def load_model():
    global model
    if os.path.exists(MODEL_PATH):
        try:
            with open(MODEL_PATH, 'rb') as f:
                model = pickle.load(f)
            print("Model loaded successfully.")
        except Exception as e:
            print(f"Error loading model: {e}")
    else:
        print(f"Warning: {MODEL_PATH} not found.")

load_model()

prediction_buffer = []
BUFFER_SIZE = 5 
PROBABILITY_THRESHOLD = 0.6

@socketio.on('landmarks')
def handle_landmarks(data):
    global prediction_buffer, model, is_collecting, collect_label
    
    landmarks_list = data.get('landmarks')
    if not landmarks_list:
        return

    # 1. Handle Collection Mode
    if is_collecting and collect_label:
        flattened = []
        for lm in landmarks_list: flattened.append(lm['x'])
        for lm in landmarks_list: flattened.append(lm['y'])
        for lm in landmarks_list: flattened.append(lm['z'])
        flattened.append(collect_label)
        
        try:
            with open(DATA_PATH, mode='a', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(flattened)
        except Exception as e:
            print(f"File lock error: {e}")

    # 2. Handle Prediction Mode
    if model is not None:
        flattened_pred = []
        for lm in landmarks_list: flattened_pred.append(lm['x'])
        for lm in landmarks_list: flattened_pred.append(lm['y'])
        for lm in landmarks_list: flattened_pred.append(lm['z'])
        input_data = np.array([flattened_pred])
        
        try:
            probs = model.predict_proba(input_data)[0]
            max_prob = np.max(probs)
            label = model.classes_[np.argmax(probs)]

            if max_prob > PROBABILITY_THRESHOLD:
                prediction_buffer.append(label)
                if len(prediction_buffer) > BUFFER_SIZE:
                    prediction_buffer.pop(0)
                
                most_frequent = max(set(prediction_buffer), key=prediction_buffer.count)
                if prediction_buffer.count(most_frequent) >= (BUFFER_SIZE // 2 + 1):
                    socketio.emit('prediction', {'label': most_frequent, 'confidence': float(max_prob)})
            else:
                socketio.emit('prediction', {'label': 'searching', 'confidence': 0})
        except:
            pass

# --- ADMIN COMMANDS ---

@socketio.on('get_data_summary')
def handle_summary():
    if not os.path.exists(DATA_PATH):
        socketio.emit('data_summary', {'data': {}})
        return
    summary = {}
    try:
        with open(DATA_PATH, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                label = row['label']
                summary[label] = summary.get(label, 0) + 1
        socketio.emit('data_summary', {'data': summary})
    except Exception as e:
        print(f"Error reading CSV: {e}")

@socketio.on('start_collecting')
def handle_start_collecting(data):
    global is_collecting, collect_label
    collect_label = data.get('label', 'UNKNOWN').upper()
    is_collecting = True
    print(f"Started collecting for: {collect_label}")

@socketio.on('stop_collecting')
def handle_stop_collecting():
    global is_collecting
    is_collecting = False
    handle_summary()

@socketio.on('train_model')
def handle_train():
    print("Training triggered...")
    try:
        result = subprocess.run(['python', 'scripts/train_model.py'], capture_output=True, text=True)
        load_model()
        socketio.emit('training_complete', {'status': 'success'})
    except Exception as e:
        socketio.emit('training_complete', {'status': 'error', 'message': str(e)})

@socketio.on('delete_label')
def handle_delete(data):
    label_to_delete = data.get('label')
    if label_to_delete:
        rows = []
        try:
            with open(DATA_PATH, 'r') as f:
                reader = csv.reader(f)
                header = next(reader)
                for row in reader:
                    if row[-1] != label_to_delete: rows.append(row)
            with open(DATA_PATH, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(header)
                writer.writerows(rows)
            handle_summary()
        except: pass

# --- EMAIL COMMAND ---

@socketio.on('send_real_email')
def handle_send_email(data):
    to_email = data.get('to')
    subject = data.get('subject')
    body = data.get('body')
    sender_name = data.get('sender_name', 'GestureConnect User')
    sender_reply_email = data.get('sender_email', SENDER_EMAIL)

    if not to_email or not body:
        socketio.emit('email_status', {'status': 'error', 'message': 'Missing recipient or body'})
        return

    # --- HTML TEMPLATE ---
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            .container {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #1e293b; }}
            .header {{ background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 30px; text-align: center; color: white; }}
            .header h1 {{ margin: 0; font-size: 24px; letter-spacing: 1px; }}
            .header p {{ margin: 5px 0 0; opacity: 0.8; font-size: 14px; }}
            .content {{ padding: 30px; line-height: 1.6; font-size: 16px; background-color: #ffffff; }}
            .message-box {{ background-color: #f8fafc; border-left: 4px solid #6366f1; padding: 20px; border-radius: 4px; margin: 20px 0; font-size: 18px; font-weight: 500; }}
            .footer {{ background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }}
            .sender-info {{ margin-top: 10px; padding-top: 10px; border-top: 1px dashed #cbd5e1; }}
            .badge {{ display: inline-block; padding: 4px 12px; background-color: #e0e7ff; color: #4338ca; border-radius: 20px; font-weight: 600; font-size: 10px; text-transform: uppercase; margin-bottom: 10px; }}
            .btn {{ display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>GestureConnect</h1>
                <p>Breaking barriers with sign language</p>
            </div>
            <div class="content">
                <div class="badge">New Gesture Message</div>
                <p>You have received a new message transcribed from sign language:</p>
                <div class="message-box">
                    {body}
                </div>
                <p>To reply to this message, simply click the button below or reply directly to this email.</p>
                <a href="mailto:{sender_reply_email}" class="btn">Reply to {sender_name}</a>
            </div>
            <div class="footer">
                <p>SENT VIA GESTURECONNECT 🤚🏾✨</p>
                <p>This message was composed using real-time hand sign recognition technology.</p>
                <div class="sender-info">
                    <strong>Sender:</strong> {sender_name}<br>
                    <strong>Email:</strong> {sender_reply_email}
                </div>
            </div>
        </div>
    </body>
    </html>
    """

    msg = MIMEText(html_body, 'html')
    msg['Subject'] = subject or "New Message from GestureConnect"
    msg['From'] = f"GestureConnect <{SENDER_EMAIL}>"
    msg['To'] = to_email
    msg.add_header('reply-to', sender_reply_email)

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(SENDER_EMAIL, APP_PASSWORD)
            server.sendmail(SENDER_EMAIL, to_email, msg.as_string())
        print(f"Email sent to {to_email}")
        socketio.emit('email_status', {'status': 'success'})
    except Exception as e:
        print(f"Email error: {e}")
        socketio.emit('email_status', {'status': 'error', 'message': str(e)})

@socketio.on('connect')
def handle_connect():
    handle_summary()

if __name__ == "__main__":
    socketio.run(app, port=5001)
