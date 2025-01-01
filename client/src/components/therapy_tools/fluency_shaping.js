import React, { useRef, useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import {
  Box,
  Typography,
  Slider,
  Button,
  CircularProgress,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { useSpeechSynthesis } from 'react-speech-kit';
import { Howl } from 'howler';
import * as Tone from 'tone';

import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { analyzeSpeech } from '../../utils/speechAnalysis';

const FluencyShapingContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  maxWidth: 600,
  margin: '0 auto',
}));

const AudioControls = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1rem',
  marginTop: '1rem',
});

const FluencyShaping = ({ onSessionComplete }) => {
  const { speak, voices, speaking } = useSpeechSynthesis();
  const { listen, listening, transcript, resetTranscript } = useSpeechRecognition();
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [rate, setRate] = useState(1); // Speech rate
  const [pitch, setPitch] = useState(1); // Speech pitch
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [metronomeBPM, setMetronomeBPM] = useState(60);
  const metronomeRef = useRef(null);

  // Tone.js setup for metronome
  const metronome = new Tone.Loop((time) => {
    // Create a simple synth and trigger an attack release
    const synth = new Tone.Synth().toDestination();
    synth.triggerAttackRelease("C4", "8n", time);
  }, `${60 / metronomeBPM}n`); // Calculate interval from BPM

  useEffect(() => {
    // Select default voice
    setSelectedVoice(voices[0]);
  }, [voices]);

  const handleRateChange = (event, newValue) => {
    setRate(newValue);
  };

  const handlePitchChange = (event, newValue) => {
    setPitch(newValue);
  };

  const handleSpeak = (text) => {
    setIsSpeaking(true);
    speak({ text, voice: selectedVoice, rate, pitch });
  };

  const handleListen = () => {
    resetTranscript();
    listen();
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const results = await analyzeSpeech(transcript);
      setAnalysisResults(results);
    } catch (error) {
      console.error('Speech analysis error:', error);
      // Handle error, e.g., show an error message
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSessionComplete = () => {
    onSessionComplete(analysisResults);
  };

  const handleMetronomeChange = (event) => {
    setMetronomeEnabled(event.target.checked);
  };

  const handleMetronomeBPMChange = (event, newValue) => {
    setMetronomeBPM(newValue);
  };

  // Start/stop metronome based on enabled state
  useEffect(() => {
    if (metronomeEnabled) {
      metronome.start(0);
    } else {
      metronome.stop(0);
    }
    return () => {
      metronome.stop(0); // Stop metronome on unmount
    };
  }, [metronomeEnabled, metronomeBPM]);

  // Update speaking state when speech synthesis ends
  useEffect(() => {
    if (speaking === false && isSpeaking === true) {
      setIsSpeaking(false);
    }
  }, [speaking, isSpeaking]);

  // Example sentences for fluency shaping exercises
  const sentences = [
    'The quick brown fox jumps over the lazy dog.',
    'Peter Piper picked a peck of pickled peppers.',
    'She sells seashells by the seashore.',
    'How much wood would a woodchuck chuck if a woodchuck could chuck wood?',
  ];

  return (
    <FluencyShapingContainer>
      <Typography variant="h4" gutterBottom>
        Fluency Shaping
      </Typography>

      {/* Speech Rate Control */}
      <Box>
        <Typography id="rate-slider" gutterBottom>
          Speech Rate: {rate}
        </Typography>
        <Slider
          aria-labelledby="rate-slider"
          value={rate}
          onChange={handleRateChange}
          min={0.5}
          max={2}
          step={0.1}
        />
      </Box>

      {/* Speech Pitch Control */}
      <Box mt={2}>
        <Typography id="pitch-slider" gutterBottom>
          Speech Pitch: {pitch}
        </Typography>
        <Slider
          aria-labelledby="pitch-slider"
          value={pitch}
          onChange={handlePitchChange}
          min={0.5}
          max={2}
          step={0.1}
        />
      </Box>

      {/* Metronome Controls */}
      <Box mt={2}>
        <FormControlLabel
          control={
            <Switch
              checked={metronomeEnabled}
              onChange={handleMetronomeChange}
              color="primary"
            />
          }
          label="Metronome"
        />
        {metronomeEnabled && (
          <Box>
            <Typography id="metronome-bpm-slider" gutterBottom>
              BPM: {metronomeBPM}
            </Typography>
            <Slider
              aria-labelledby="metronome-bpm-slider"
              value={metronomeBPM}
              onChange={handleMetronomeBPMChange}
              min={30}
              max={120}
              step={1}
            />
          </Box>
        )}
      </Box>

      {/* Example Sentences */}
      <Box mt={3}>
        {sentences.map((sentence, index) => (
          <Button
            key={index}
            variant="outlined"
            onClick={() => handleSpeak(sentence)}
            disabled={isSpeaking}
            sx={{ mr: 1, mb: 1 }}
          >
            {sentence}
          </Button>
        ))}
      </Box>

      {/* Audio Controls */}
      <AudioControls>
        <Button variant="contained" onClick={handleListen} disabled={listening}>
          {listening ? <CircularProgress size={24} /> : 'Listen'}
        </Button>
        <Button variant="contained" onClick={handleAnalyze} disabled={isAnalyzing || !transcript}>
          {isAnalyzing ? <CircularProgress size={24} /> : 'Analyze'}
        </Button>
      </AudioControls>

      {/* Transcript Display */}
      {transcript && (
        <Box mt={2}>
          <FormControlLabel
            control={
              <Switch
                checked={showTranscript}
                onChange={(event) => setShowTranscript(event.target.checked)}
                color="primary"
              />
            }
            label="Show Transcript"
          />
          {showTranscript && (
            <Typography variant="body1" component="pre" whiteSpace="pre-wrap">
              {transcript}
            </Typography>
          )}
        </Box>
      )}

      {/* Analysis Results */}
      {analysisResults && (
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            Analysis Results
          </Typography>
          {/* ... display analysis results (e.g., fluency score, speaking rate, etc.) ... */}
          <Button variant="contained" color="primary" onClick={handleSessionComplete}>
            Complete Session
          </Button>
        </Box>
      )}
    </FluencyShapingContainer>
  );
};

export default FluencyShaping;