# intent_classification.py

import tensorflow as tf
from tensorflow.keras.layers import Input, Embedding, LSTM, Dense, Dropout, Bidirectional, Attention
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report

# Define the BiLSTM with Attention model architecture for intent classification
def create_intent_classifier(vocab_size, embedding_dim, max_length, num_classes):
    inputs = Input(shape=(max_length,))
    embedding_layer = Embedding(vocab_size, embedding_dim)(inputs)

    # Bidirectional LSTM layers
    lstm_layer = Bidirectional(LSTM(128, return_sequences=True, dropout=0.2, recurrent_dropout=0.2))(embedding_layer)
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

# Load and preprocess the dataset (implementation not shown)
# ...

# Example dataset:
texts = [
    "What's the weather like today?",
    "Book a table for two at 7 pm",
    "Play some relaxing music",
    "Turn off the lights",
    "Tell me a joke",
    "What is the capital of France?",
]
intents = [
    "weather",
    "booking",
    "music",
    "smart_home",
    "entertainment",
    "knowledge",
]

# Tokenize the text data
tokenizer = Tokenizer(num_words=5000, oov_token='<OOV>')  # Adjust num_words as needed
tokenizer.fit_on_texts(texts)
sequences = tokenizer.texts_to_sequences(texts)
padded_sequences = pad_sequences(sequences, maxlen=100, padding='post', truncating='post')  # Adjust maxlen as needed

# Encode the intents
label_encoder = LabelEncoder()
encoded_intents = label_encoder.fit_transform(intents)

# Create the intent classification model
vocab_size = len(tokenizer.word_index) + 1
embedding_dim = 128  # Adjust embedding dimension as needed
max_length = 100  # Adjust max length as needed
num_classes = len(label_encoder.classes_)
model = create_intent_classifier(vocab_size, embedding_dim, max_length, num_classes)

# Compile the model
optimizer = Adam(learning_rate=0.0001)  # Adjust learning rate as needed
model.compile(loss='sparse_categorical_crossentropy', optimizer=optimizer, metrics=['accuracy'])

# Define callbacks
early_stopping = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)
model_checkpoint = ModelCheckpoint('best_intent_classifier.h5', monitor='val_accuracy', save_best_only=True)

# Train the model
history = model.fit(
    padded_sequences,
    encoded_intents,
    batch_size=32,  # Adjust batch size as needed
    epochs=100,  # Adjust number of epochs as needed
    validation_split=0.2,
    callbacks=[early_stopping, model_checkpoint],
)

# Evaluate the model
y_pred = model.predict(padded_sequences)
y_pred_classes = np.argmax(y_pred, axis=1)
accuracy = accuracy_score(encoded_intents, y_pred_classes)
conf_matrix = confusion_matrix(encoded_intents, y_pred_classes)
class_report = classification_report(encoded_intents, y_pred_classes, target_names=label_encoder.classes_)

print(f"Accuracy: {accuracy}")
print("Confusion Matrix:")
print(conf_matrix)
print("Classification Report:")
print(class_report)

# Save the trained model
model.save('intent_classification_model.h5')