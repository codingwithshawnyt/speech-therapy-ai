# feature_extraction.py

import librosa
import numpy as np
import pandas as pd
from scipy.stats import skew, kurtosis
from python_speech_features import mfcc, logfbank, delta
import pywt

# Function to extract comprehensive acoustic features from an audio file
def extract_features(audio_file, sample_rate=16000, frame_size=0.025, frame_stride=0.01):
    try:
        # 1. Load audio file
        y, sr = librosa.load(audio_file, sr=sample_rate)

        # 2. Pre-emphasis (optional)
        pre_emphasis = 0.97
        y = np.append(y[0], y[1:] - pre_emphasis * y[:-1])

        # 3. Framing and windowing
        frame_length = int(round(frame_size * sample_rate))
        frame_step = int(round(frame_stride * sample_rate))
        frames = librosa.util.frame(y, frame_length=frame_length, hop_length=frame_step).T

        # 4. Hamming window
        frames *= np.hamming(frame_length)

        # 5. Feature extraction for each frame
        features = []
        for frame in frames:
            # 5.1. Zero-crossing rate (ZCR)
            zcr = librosa.feature.zero_crossing_rate(frame)[0, 0]

            # 5.2. Energy
            energy = np.sum(frame ** 2) / frame_length

            # 5.3. Pitch (fundamental frequency - F0)
            f0, voiced_flag, voiced_probs = librosa.pyin(
                frame,
                fmin=librosa.note_to_hz('C2'),
                fmax=librosa.note_to_hz('C7')
            )
            f0 = np.nanmean(f0) if np.any(np.isfinite(f0)) else 0

            # 5.4. MFCCs
            mfcc_feat = mfcc(frame, samplerate=sample_rate, numcep=13, nfilt=26)
            mfcc_feat_mean = np.mean(mfcc_feat, axis=0)
            mfcc_feat_std = np.std(mfcc_feat, axis=0)
            mfcc_feat_skew = skew(mfcc_feat, axis=0)
            mfcc_feat_kurtosis = kurtosis(mfcc_feat, axis=0)

            # 5.5. Filterbank energies
            fbank_feat = logfbank(frame, samplerate=sample_rate, nfilt=26)
            fbank_feat_mean = np.mean(fbank_feat, axis=0)
            fbank_feat_std = np.std(fbank_feat, axis=0)

            # 5.6. Delta features
            delta_mfcc_feat = delta(mfcc_feat, 2)
            delta_mfcc_feat_mean = np.mean(delta_mfcc_feat, axis=0)
            delta_mfcc_feat_std = np.std(delta_mfcc_feat, axis=0)

            delta_fbank_feat = delta(fbank_feat, 2)
            delta_fbank_feat_mean = np.mean(delta_fbank_feat, axis=0)
            delta_fbank_feat_std = np.std(delta_fbank_feat, axis=0)

            # 5.7. Spectral features
            spectral_centroid = librosa.feature.spectral_centroid(y=frame, sr=sample_rate)[0, 0]
            spectral_bandwidth = librosa.feature.spectral_bandwidth(y=frame, sr=sample_rate)[0, 0]
            spectral_rolloff = librosa.feature.spectral_rolloff(y=frame, sr=sample_rate)[0, 0]
            spectral_flatness = librosa.feature.spectral_flatness(y=frame)[0, 0]

            # 5.8. Chroma features
            chroma_stft = librosa.feature.chroma_stft(y=frame, sr=sample_rate)
            chroma_stft_mean = np.mean(chroma_stft, axis=0)
            chroma_stft_std = np.std(chroma_stft, axis=0)

            # 5.9. Wavelet Transform
            wavelet = 'db4'  # Example wavelet
            coeffs = pywt.wavedec(frame, wavelet, level=4)
            wavelet_features = np.concatenate(coeffs)

            # 5.10. Other features (e.g., LPC, PLP, etc.)
            # ...

            # Concatenate all features for the current frame
            frame_features = np.concatenate((
                [zcr, energy, f0],
                mfcc_feat_mean, mfcc_feat_std, mfcc_feat_skew, mfcc_feat_kurtosis,
                fbank_feat_mean, fbank_feat_std,
                delta_mfcc_feat_mean, delta_mfcc_feat_std,
                delta_fbank_feat_mean, delta_fbank_feat_std,
                [spectral_centroid, spectral_bandwidth, spectral_rolloff, spectral_flatness],
                chroma_stft_mean, chroma_stft_std,
                wavelet_features
            ))
            features.append(frame_features)

        # 6. Aggregate features across frames (e.g., mean, std, percentiles)
        features = np.array(features)
        aggregated_features = np.concatenate((
            np.mean(features, axis=0),
            np.std(features, axis=0),
            np.percentile(features, 25, axis=0),
            np.percentile(features, 75, axis=0)
        ))

        return aggregated_features

    except Exception as e:
        print(f"Error extracting features from {audio_file}: {e}")
        return None

# Function to extract features from a directory of audio files
def extract_features_from_directory(directory, label, csv_file):
    features = []
    for filename in librosa.util.find_files(directory):
        feature_vector = extract_features(filename)
        if feature_vector is not None:
            features.append(np.append(feature_vector, label))

    df = pd.DataFrame(features)
    df.to_csv(csv_file, index=False, header=False)