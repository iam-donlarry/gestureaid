# GestureConnect 🤚🏾✨

A professional hand gesture recognition platform that transcribes sign language into real-time text and relays it via professional HTML emails.

## 🚀 Getting Started

To run this project on your local machine, follow these steps:

### 1. Prerequisites
Ensure you have the following installed:
*   **Node.js** (v16 or higher)
*   **Python** (v3.9 or higher)

### 2. Setup the Frontend (React)
Open your terminal in the project root and run:
```bash
npm install
```

### 3. Setup the Backend (Python)
Install the required machine learning and server libraries:
```bash
pip install -r requirements.txt
```

### 4. Running the Application

You need to start **two** processes:

**A. Start the AI Engine (Python):**
```bash
python scripts/predict_server.py
```
*(Wait until you see "Model loaded successfully")*

**B. Start the User Interface (React):**
```bash
npm run dev
```

### 📧 Email Integration
This app uses Gmail SMTP to send messages. The sender email and app password are pre-configured in `scripts/predict_server.py`. 

### 🧠 Training New Gestures
1.  Open the app and click **"TRAIN ENGINE"**.
2.  Type a label (e.g., `SPACE`, `HELP`, `HELLO`).
3.  Hold your hand to the camera and click **"CAPTURE"**.
4.  Once you have 50-100 samples, click **"RE-TRAIN NEURAL ENGINE"**.

---
*Built with React, Flask, MediaPipe, and Scikit-Learn.*