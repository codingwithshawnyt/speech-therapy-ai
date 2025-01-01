# stutter_classifier.py

import librosa
import numpy as np
from sklearn.preprocessing import StandardScaler
from tensorflow.keras.models import load_model
from tensorflow.keras.layers import Input, LSTM, Dense, Dropout, Bidirectional, Concatenate, Attention
from tensorflow.keras.models import Model
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report

# Function to extract acoustic features from audio data
def extract_features(audio_file):
    try:
        # Load audio file
        y, sr = librosa.load(audio_file, sr=16000)  # Use a standard sampling rate

        # Extract MFCCs
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfccs_mean = np.mean(mfccs.T, axis=0)
        mfccs_std = np.std(mfccs.T, axis=0)

        # Extract chroma features
        chroma = librosa.feature.chroma_stft(y=y, sr=sr)
        chroma_mean = np.mean(chroma.T, axis=0)
        chroma_std = np.std(chroma.T, axis=0)

        # Extract mel spectrogram
        mel = librosa.feature.melspectrogram(y=y, sr=sr)
        mel_mean = np.mean(mel.T, axis=0)
        mel_std = np.std(mel.T, axis=0)

        # Extract spectral contrast
        contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
        contrast_mean = np.mean(contrast.T, axis=0)
        contrast_std = np.std(contrast.T, axis=0)

        # Extract tonnetz features
        tonnetz = librosa.feature.tonnetz(y=y, sr=sr)
        tonnetz_mean = np.mean(tonnetz.T, axis=0)
        tonnetz_std = np.std(tonnetz.T, axis=0)

        # Extract zero-crossing rate
        zcr = librosa.feature.zero_crossing_rate(y)
        zcr_mean = np.mean(zcr)
        zcr_std = np.std(zcr)

        # Concatenate all features
        features = np.concatenate((
            mfccs_mean, mfccs_std,
            chroma_mean, chroma_std,
            mel_mean, mel_std,
            contrast_mean, contrast_std,
            tonnetz_mean, tonnetz_std,
            [zcr_mean], [zcr_std]
        ))

        return features
    except Exception as e:
        print(f"Error extracting features from {audio_file}: {e}")
        return None

# Function to create the BiLSTM with Attention model architecture
def create_stutter_classifier(input_shape=(166,), num_classes=2):  # Adjust input_shape based on features
    inputs = Input(shape=input_shape)

    # Bidirectional LSTM layers
    lstm_layer = Bidirectional(LSTM(128, return_sequences=True, dropout=0.2, recurrent_dropout=0.2))(inputs)
    lstm_layer = Bidirectional(LSTM(64, return_sequences=True, dropout=0.2, recurrent_dropout=0.2))(lstm_layer)

    # Attention layer
    attention_layer = Attention()([lstm_layer, lstm_layer])

    # Dense layers for classification
    dense_layer = Dense(64, activation='relu')(attention_layer)
    dropout_layer = Dropout(0.5)(dense_layer)
    outputs = Dense(num_classes, activation='softmax')(dropout_layer)  # Use softmax for multi-class classification

    # Create the model
    model = Model(inputs=inputs, outputs=outputs)
    return model

# Load the trained model
model = load_model('stutter_classifier_model.h5')  # Replace with your model path

# Load and preprocess the test dataset (implementation not shown)
# ...

# Extract features from the test dataset
X_test = []
for audio_file in test_audio_files:
    features = extract_features(audio_file)
    if features is not None:
        X_test.append(features)
X_test = np.array(X_test)

# Scale the features
scaler = StandardScaler()
X_test = scaler.fit_transform(X_test)

# Predict stutter vs. fluent
y_pred = model.predict(X_test)
y_pred_classes = np.argmax(y_pred, axis=1)

# Evaluate the model
accuracy = accuracy_score(y_true, y_pred_classes)
conf_matrix = confusion_matrix(y_true, y_pred_classes)
class_report = classification_report(y_true, y_pred_classes)

print(f"Accuracy: {accuracy}")
print("Confusion Matrix:")
print(conf_matrix)
print("Classification Report:")
print(class_report)