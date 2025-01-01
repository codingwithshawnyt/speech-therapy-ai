# language_model.py

import tensorflow as tf
from tensorflow.keras.layers import Input, Embedding, LSTM, Dense, Dropout, Bidirectional, Attention
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences

# Define the BiLSTM with Attention model architecture
def create_language_model(vocab_size, embedding_dim, max_length, num_classes=1):
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
    outputs = Dense(num_classes, activation='sigmoid')(dropout_layer)  # Use sigmoid for binary classification (fluency or disfluency)

    # Create the model
    model = Model(inputs=inputs, outputs=outputs)
    return model

# Load and preprocess the dataset (implementation not shown)
# ...

# Tokenize the text data
tokenizer = Tokenizer(num_words=5000, oov_token='<OOV>')  # Adjust num_words as needed
tokenizer.fit_on_texts(texts)
sequences = tokenizer.texts_to_sequences(texts)
padded_sequences = pad_sequences(sequences, maxlen=100, padding='post', truncating='post')  # Adjust maxlen as needed

# Create the language model
vocab_size = len(tokenizer.word_index) + 1
embedding_dim = 128  # Adjust embedding dimension as needed
max_length = 100  # Adjust max length as needed
model = create_language_model(vocab_size, embedding_dim, max_length)

# Compile the model
optimizer = Adam(learning_rate=0.0001)  # Adjust learning rate as needed
model.compile(loss='binary_crossentropy', optimizer=optimizer, metrics=['accuracy'])  # Use binary_crossentropy for binary classification

# Define callbacks
early_stopping = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)
model_checkpoint = ModelCheckpoint('best_language_model.h5', monitor='val_accuracy', save_best_only=True)

# Train the model
history = model.fit(
    padded_sequences,
    labels,
    batch_size=32,  # Adjust batch size as needed
    epochs=100,  # Adjust number of epochs as needed
    validation_split=0.2,
    callbacks=[early_stopping, model_checkpoint],
)

# Evaluate the model (implementation not shown)
# ...

# Save the trained model
model.save('language_model.h5')