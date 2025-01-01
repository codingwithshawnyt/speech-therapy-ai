# acoustic_model.py

import tensorflow as tf
from tensorflow.keras.layers import Input, Conv2D, BatchNormalization, Activation, MaxPooling2D, Flatten, Dense, Dropout, LSTM, Bidirectional
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
from tensorflow.keras.regularizers import l2

# Define the CNN-BiLSTM model architecture
def create_acoustic_model(input_shape=(128, 128, 1), num_classes=1):  # Adjust input_shape as needed
    inputs = Input(shape=input_shape)

    # Convolutional layers
    x = Conv2D(32, (3, 3), padding='same', kernel_regularizer=l2(0.001))(inputs)
    x = BatchNormalization()(x)
    x = Activation('relu')(x)
    x = MaxPooling2D(pool_size=(2, 2))(x)

    x = Conv2D(64, (3, 3), padding='same', kernel_regularizer=l2(0.001))(x)
    x = BatchNormalization()(x)
    x = Activation('relu')(x)
    x = MaxPooling2D(pool_size=(2, 2))(x)

    x = Conv2D(128, (3, 3), padding='same', kernel_regularizer=l2(0.001))(x)
    x = BatchNormalization()(x)
    x = Activation('relu')(x)
    x = MaxPooling2D(pool_size=(2, 2))(x)

    # Flatten for LSTM input
    x = Flatten()(x)

    # Bidirectional LSTM layers
    x = Bidirectional(LSTM(128, return_sequences=True, dropout=0.2, recurrent_dropout=0.2))(x)
    x = Bidirectional(LSTM(64, dropout=0.2, recurrent_dropout=0.2))(x)

    # Dense layers for classification
    x = Dense(64, activation='relu')(x)
    x = Dropout(0.5)(x)
    outputs = Dense(num_classes, activation='sigmoid')(x)  # Use sigmoid for binary classification (fluency or disfluency)

    # Create the model
    model = Model(inputs=inputs, outputs=outputs)
    return model

# Compile the model
model = create_acoustic_model()
optimizer = Adam(learning_rate=0.0001)  # Adjust learning rate as needed
model.compile(loss='binary_crossentropy', optimizer=optimizer, metrics=['accuracy'])  # Use binary_crossentropy for binary classification

# Define callbacks
early_stopping = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)
model_checkpoint = ModelCheckpoint('best_acoustic_model.h5', monitor='val_accuracy', save_best_only=True)

# Load and preprocess the dataset (implementation not shown)
# ...

# Train the model
history = model.fit(
    X_train,
    y_train,
    batch_size=32,  # Adjust batch size as needed
    epochs=100,  # Adjust number of epochs as needed
    validation_data=(X_val, y_val),
    callbacks=[early_stopping, model_checkpoint],
)

# Evaluate the model (implementation not shown)
# ...

# Save the trained model
model.save('acoustic_model.h5')