import cv2
import mediapipe as mp
import csv
import os

# Initialize MediaPipe Hands
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=False, max_num_hands=1, min_detection_confidence=0.7)
mp_draw = mp.solutions.drawing_utils



# Data file path
DATA_PATH = 'data.csv'

def collect_data():
    cap = cv2.VideoCapture(0)
    print("--- DATA COLLECTION STARTED ---")
    print("Press and hold keys A-Z to capture landmarks for that letter.")
    print("Press 'q' to quit.")

    # Create CSV if it doesn't exist
    if not os.path.exists(DATA_PATH):
        with open(DATA_PATH, mode='w', newline='') as f:
            writer = csv.writer(f)
            # 21 landmarks * 3 coordinates (x, y, z) + 1 label
            header = [f'x{i}' for i in range(21)] + [f'y{i}' for i in range(21)] + [f'z{i}' for i in range(21)] + ['label']
            writer.writerow(header)

    while cap.isOpened():
        success, image = cap.read()
        if not success:
            break

        # Process raw image first
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = hands.process(image_rgb)

        # Flip the image horizontally ONLY for display feedback
        image = cv2.flip(image, 1)

        current_label = None
        key = cv2.waitKey(1) & 0xFF
        
        if key == ord('q'):
            break
        elif ord('a') <= key <= ord('z'):
            current_label = chr(key).upper()

        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                # Draw landmarks on the image for feedback
                mp_draw.draw_landmarks(image, hand_landmarks, mp_hands.HAND_CONNECTIONS)

                if current_label:
                    # Extract coordinates
                    landmarks = []
                    for lm in hand_landmarks.landmark:
                        landmarks.append(lm.x)
                    for lm in hand_landmarks.landmark:
                        landmarks.append(lm.y)
                    for lm in hand_landmarks.landmark:
                        landmarks.append(lm.z)
                    
                    landmarks.append(current_label)

                    # Save to CSV
                    with open(DATA_PATH, mode='a', newline='') as f:
                        writer = csv.writer(f)
                        writer.writerow(landmarks)
                    
                    cv2.putText(image, f"Capturing: {current_label}", (10, 50), 
                                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        cv2.imshow('Gesture Collection', image)

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    collect_data()
