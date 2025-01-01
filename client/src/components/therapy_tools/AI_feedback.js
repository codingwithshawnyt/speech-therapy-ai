import React, { useRef, useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { analyzeSpeech } from '../../utils/speechAnalysis';
import { useSpeechSynthesis } from 'react-speech-kit';
import { v4 as uuidv4 } from 'uuid';

const FeedbackContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  maxWidth: 600,
  margin: '0 auto',
}));

const AI_feedback = ({ onFeedbackComplete }) => {
  const { listen, listening, transcript, resetTranscript } = useSpeechRecognition();
  const { speak, voices } = useSpeechSynthesis();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState([]);
  const [overallFeedback, setOverallFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    // Select the first voice as the default voice
    const defaultVoice = voices[0];
    if (defaultVoice) {
      // Set the selected voice for speech synthesis
      setSelectedVoice(defaultVoice);
    }
  }, [voices]);

  const handleListen = () => {
    resetTranscript();
    listen();
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    setIsAnalyzing(true);
    try {
      // Analyze the speech transcript using the analyzeSpeech function
      const analysisResults = await analyzeSpeech(transcript);

      // Generate specific feedback based on the analysis results
      const specificFeedback = generateSpecificFeedback(analysisResults);

      // Generate overall feedback based on the analysis results
      const overallFeedback = generateOverallFeedback(analysisResults);

      // Update the feedback state with the generated feedback
      setFeedback(specificFeedback);
      setOverallFeedback(overallFeedback);
    } catch (error) {
      console.error('Speech analysis error:', error);
      // Handle the error, e.g., show an error message
    } finally {
      setIsAnalyzing(false);
      setIsLoading(false);
    }
  };

  // Function to generate specific feedback based on analysis results
  const generateSpecificFeedback = (analysisResults) => {
    const {
      fluencyScore,
      speakingRate,
      pauseDuration,
      articulationRate,
      voiceQuality,
    } = analysisResults;

    const feedbackItems = [];

    // Provide feedback on fluency score
    if (fluencyScore < 0.8) {
      feedbackItems.push(
        'Your fluency score is a bit low. Try to speak more smoothly and with fewer hesitations.'
      );
    } else if (fluencyScore > 0.95) {
      feedbackItems.push('Your fluency score is excellent! Keep up the good work.');
    }

    // Provide feedback on speaking rate
    if (speakingRate < 120) {
      feedbackItems.push(
        'Your speaking rate is a bit slow. Try to pick up the pace a little.'
      );
    } else if (speakingRate > 180) {
      feedbackItems.push('Your speaking rate is a bit fast. Try to slow down a bit.');
    }

    // Provide feedback on pause duration
    if (pauseDuration > 1) {
      feedbackItems.push(
        'You tend to pause for a long time between words. Try to shorten your pauses.'
      );
    }

    // Provide feedback on articulation rate
    if (articulationRate < 4) {
      feedbackItems.push(
        'Your articulation rate is a bit low. Try to articulate your words more clearly.'
      );
    } else if (articulationRate > 7) {
      feedbackItems.push(
        'Your articulation rate is a bit high. Try to articulate your words more clearly and with more precision.'
      );
    }

    // Provide feedback on voice quality
    if (voiceQuality === 'breathy') {
      feedbackItems.push(
        'Your voice sounds a bit breathy. Try to speak with more support from your diaphragm.'
      );
    } else if (voiceQuality === 'strained') {
      feedbackItems.push(
        'Your voice sounds a bit strained. Try to relax your throat and vocal cords.'
      );
    }

    return feedbackItems;
  };

  // Function to generate overall feedback based on analysis results
  const generateOverallFeedback = (analysisResults) => {
    const { fluencyScore, speakingRate, articulationRate } = analysisResults;

    let overallFeedback = '';

    if (
      fluencyScore > 0.9 &&
      speakingRate > 120 &&
      speakingRate < 180 &&
      articulationRate > 4 &&
      articulationRate < 7
    ) {
      overallFeedback =
        'You are doing great! Your speech is fluent, clear, and at a good pace.';
    } else if (fluencyScore < 0.8) {
      overallFeedback =
        'Your fluency could be improved. Try to speak more smoothly and with fewer hesitations.';
    } else if (speakingRate < 120) {
      overallFeedback = 'Your speaking rate is a bit slow. Try to pick up the pace.';
    } else if (speakingRate > 180) {
      overallFeedback = 'Your speaking rate is a bit fast. Try to slow down.';
    } else if (articulationRate < 4 || articulationRate > 7) {
      overallFeedback =
        'Your articulation could be improved. Try to pronounce your words more clearly.';
    } else {
      overallFeedback =
        'Your speech is generally good, but there is room for improvement. Keep practicing!';
    }

    return overallFeedback;
  };

  const handleFeedbackComplete = () => {
    onFeedbackComplete({ feedback, overallFeedback });
  };

  const handleReplayAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  return (
    <FeedbackContainer>
      <Typography variant="h4" gutterBottom>
        AI Feedback
      </Typography>

      <Button variant="contained" onClick={handleListen} disabled={listening || isAnalyzing}>
        {listening || isAnalyzing ? <CircularProgress size={24} /> : 'Start Speaking'}
      </Button>

      {transcript && (
        <Box mt={2}>
          <Typography variant="body1" component="pre" whiteSpace="pre-wrap">
            {transcript}
          </Typography>
          <Button variant="outlined" onClick={handleReplayAudio} sx={{ mt: 1 }}>
            Replay Audio
          </Button>
          <audio ref={audioRef} src={mediaBlobUrl} controls />
        </Box>
      )}

      {isLoading && <LinearProgress />}

      {feedback.length > 0 && (
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            Specific Feedback
          </Typography>
          <List>
            {feedback.map((item) => (
              <ListItem key={uuidv4()}>
                <ListItemText primary={item} />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {overallFeedback && (
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            Overall Feedback
          </Typography>
          <Typography variant="body1">{overallFeedback}</Typography>
        </Box>
      )}

      {(feedback.length > 0 || overallFeedback) && (
        <Button
          variant="contained"
          color="primary"
          onClick={handleFeedbackComplete}
          sx={{ mt: 3 }}
        >
          Continue
        </Button>
      )}
    </FeedbackContainer>
  );
};

export default AI_feedback;