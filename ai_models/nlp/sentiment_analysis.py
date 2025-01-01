# sentiment_analysis.py

import tensorflow as tf
from tensorflow.keras.layers import Input, Embedding, LSTM, Dense, Dropout, Bidirectional, Attention, Conv1D, MaxPooling1D, GlobalMaxPooling1D
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import AdamW
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
import numpy as np

# Define the CNN-BiLSTM with Attention model architecture for sentiment analysis
def create_sentiment_analyzer(vocab_size, embedding_dim, max_length, num_classes=3):  # 3 classes: positive, negative, neutral
    inputs = Input(shape=(max_length,))
    embedding_layer = Embedding(vocab_size, embedding_dim)(inputs)

    # Convolutional layers
    conv_layer = Conv1D(128, 5, activation='relu')(embedding_layer)
    pooling_layer = MaxPooling1D(pool_size=4)(conv_layer)

    # Bidirectional LSTM layers
    lstm_layer = Bidirectional(LSTM(128, return_sequences=True, dropout=0.2, recurrent_dropout=0.2))(pooling_layer)
    lstm_layer = Bidirectional(LSTM(64, return_sequences=True, dropout=0.2, recurrent_dropout=0.2))(lstm_layer)

    # Attention layer
    attention_layer = Attention()([lstm_layer, lstm_layer])

    # Global Max Pooling layer
    global_max_pooling_layer = GlobalMaxPooling1D()(attention_layer)

    # Dense layers for classification
    dense_layer = Dense(64, activation='relu')(global_max_pooling_layer)
    dropout_layer = Dropout(0.5)(dense_layer)
    outputs = Dense(num_classes, activation='softmax')(dropout_layer)  # Use softmax for multi-class classification

    # Create the model
    model = Model(inputs=inputs, outputs=outputs)
    return model

# Load and preprocess the dataset (implementation not shown)
# ...

# Example dataset:
texts = [
    "This movie is amazing! I loved it.",
    "The food was terrible, I wouldn't recommend it.",
    "The service was okay, nothing special.",
    "I'm so happy with this product!",
    "This is the worst experience I've ever had.",
    "The weather is nice today.",
]
sentiments = [
    "positive",
    "negative",
    "neutral",
    "positive",
    "negative",
    "neutral",
]

# Tokenize the text data
tokenizer = Tokenizer(num_words=5000, oov_token='<OOV>')  # Adjust num_words as needed
tokenizer.fit_on_texts(texts)
sequences = tokenizer.texts_to_sequences(texts)
padded_sequences = pad_sequences(sequences, maxlen=100, padding='post', truncating='post')  # Adjust maxlen as needed

# Encode the sentiments
label_encoder = LabelEncoder()
encoded_sentiments = label_encoder.fit_transform(sentiments)

# Split the data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(
    padded_sequences, encoded_sentiments, test_size=0.2, random_state=42
)

# Create the sentiment analysis model
vocab_size = len(tokenizer.word_index) + 1
embedding_dim = 128  # Adjust embedding dimension as needed
max_length = 100  # Adjust max length as needed
model = create_sentiment_analyzer(vocab_size, embedding_dim, max_length)

# Compile the model
optimizer = AdamW(learning_rate=0.001)  # Adjust learning rate as needed
model.compile(loss='sparse_categorical_crossentropy', optimizer=optimizer, metrics=['accuracy'])

# Define callbacks
early_stopping = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)
model_checkpoint = ModelCheckpoint('best_sentiment_analyzer.h5', monitor='val_accuracy', save_best_only=True)
reduce_lr = ReduceLROnPlateau(monitor='val_loss', factor=0.2, patience=5, min_lr=0.00001)

# Train the model
history = model.fit(
    X_train,
    y_train,
    batch_size=32,  # Adjust batch size as needed
    epochs=100,  # Adjust number of epochs as needed
    validation_data=(X_test, y_test),
    callbacks=[early_stopping, model_checkpoint, reduce_lr],
)

# Evaluate the model
y_pred = model.predict(X_test)
y_pred_classes = np.argmax(y_pred, axis=1)
accuracy = accuracy_score(y_test, y_pred_classes)
precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred_classes, average='weighted')

print(f"Accuracy: {accuracy}")
print(f"Precision: {precision}")
print(f"Recall: {recall}")
print(f"F1-score: {f1}")

# Save the trained model
model.save('sentiment_analysis_model.h5')