import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import pickle
import os

# Settings
DATA_PATH = 'data.csv'
MODEL_SAVE_PATH = 'gesture_model.pkl'

def train_model():
    if not os.path.exists(DATA_PATH):
        print(f"Error: {DATA_PATH} not found. Collect some data first!")
        return

    # 1. Load Data
    df = pd.read_csv(DATA_PATH)
    print(f"Loaded {len(df)} samples.")

    # Drop any empty rows that might have been created
    df = df.dropna()

    X = df.drop('label', axis=1).values
    y = df['label'].values

    # 2. Split Data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # 3. Build Model (Random Forest)
    print("Training Random Forest model...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # 4. Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Training Complete! Accuracy: {accuracy * 100:.2f}%")

    # 5. Save Model
    with open(MODEL_SAVE_PATH, 'wb') as f:
        pickle.dump(model, f)
    
    print(f"Model saved to {MODEL_SAVE_PATH}")
    print(f"Classes trained: {model.classes_}")

if __name__ == "__main__":
    train_model()
