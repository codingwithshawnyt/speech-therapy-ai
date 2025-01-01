import React, { useRef, useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import { Box, IconButton, Typography, CircularProgress, LinearProgress } from '@mui/material';
import { Mic, Stop, PlayArrow, Pause, Replay, SettingsVoice } from '@mui/icons-material';
import { useReactMediaRecorder } from "react-media-recorder";

const RecorderContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(2),
  maxWidth: 400, // Adjust as needed
  margin: '0 auto',
}));

const AudioVisualizer = styled(Box)(({ theme, amplitude }) => ({
  width: '100%',
  height: 100,
  backgroundColor: theme.palette.background.default,
  marginTop: theme.spacing(2),
  overflow: 'hidden',
  '& canvas': {
    width: '100%',
    height: '100%',
  },
}));

const AudioRecorder = ({
  audioOutputFormat = 'audio/wav',
  onStop = () => {},
  onStart = () => {},
  onPause = () => {},
  onResume = () => {},
  onError = () => {},
  ...props
}) => {
  const { status, startRecording, stopRecording, pauseRecording, resumeRecording, mediaBlobUrl } =
    useReactMediaRecorder({ audio: true, video: false, audioOutputFormat });
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [amplitude, setAmplitude] = useState(0);
  const canvasRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (status === 'recording') {
      setIsRecording(true);
      onStart();
      visualizeAudio();
    } else if (status === 'stopped') {
      setIsRecording(false);
      onStop(mediaBlobUrl);
      stopVisualizingAudio();
    } else if (status === 'paused') {
      setIsPaused(true);
      onPause();
      stopVisualizingAudio();
    } else if (status === 'resumed') {
      setIsPaused(false);
      onResume();
      visualizeAudio();
    }
  }, [status, onStop, onStart, onPause, onResume, mediaBlobUrl]);

  const visualizeAudio = () => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const audio = new Audio(mediaBlobUrl);
    const source = audioCtx.createMediaElementSource(audio);
    const analyserNode = audioCtx.createAnalyser();

    source.connect(analyserNode);
    analyserNode.connect(audioCtx.destination);

    setAudioContext(audioCtx);
    setAnalyser(analyserNode);

    // Start visualizing
    requestAnimationFrame(drawVisualizer);
  };

  const stopVisualizingAudio = () => {
    if (audioContext) {
      audioContext.close();
      setAudioContext(null);
      setAnalyser(null);
    }
  };

  const drawVisualizer = () => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    analyser.getByteTimeDomainData(dataArray);

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    let maxAmplitude = 0; // Keep track of the maximum amplitude

    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i] / 2;

      maxAmplitude = Math.max(maxAmplitude, barHeight); // Update maxAmplitude

      ctx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
      ctx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight);

      x += barWidth + 1;
    }

    setAmplitude(maxAmplitude); // Update the amplitude state

    requestAnimationFrame(drawVisualizer);
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error) {
      onError(error);
    }
  };

  const handleStopRecording = async () => {
    try {
      await stopRecording();
    } catch (error) {
      onError(error);
    }
  };

  const handlePauseRecording = async () => {
    try {
      await pauseRecording();
    } catch (error) {
      onError(error);
    }
  };

  const handleResumeRecording = async () => {
    try {
      await resumeRecording();
    } catch (error) {
      onError(error);
    }
  };

  const handlePlayAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleReplayAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <RecorderContainer {...props}>
      <Typography variant="h6" gutterBottom>
        Audio Recorder
      </Typography>

      {/* Recording Controls */}
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        {isRecording ? (
          <>
            <IconButton aria-label="stop" onClick={handleStopRecording} color="error">
              <Stop />
            </IconButton>
            <IconButton aria-label="pause" onClick={handlePauseRecording} disabled={isPaused}>
              <Pause />
            </IconButton>
            <IconButton aria-label="resume" onClick={handleResumeRecording} disabled={!isPaused}>
              <PlayArrow />
            </IconButton>
          </>
        ) : (
          <IconButton aria-label="record" onClick={handleStartRecording} color="success">
            <Mic />
          </IconButton>
        )}
      </Box>

      {/* Audio Playback Controls */}
      {mediaBlobUrl && (
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <IconButton aria-label="play" onClick={handlePlayAudio} disabled={isPlaying}>
            <PlayArrow />
          </IconButton>
          <IconButton aria-label="pause" onClick={handlePauseAudio} disabled={!isPlaying}>
            <Pause />
          </IconButton>
          <IconButton aria-label="replay" onClick={handleReplayAudio}>
            <Replay />
          </IconButton>
          <audio ref={audioRef} src={mediaBlobUrl} controls />
        </Box>
      )}

      {/* Visualizer */}
      <AudioVisualizer amplitude={amplitude}>
        <canvas ref={canvasRef} />
      </AudioVisualizer>

      {/* Status Indicator */}
      <Box sx={{ mt: 2, width: '100%' }}>
        {status === 'acquiring_media' && (
          <Typography variant="body2" align="center">
            Acquiring media...
          </Typography>
        )}
        {status === 'idle' && <LinearProgress />}
        {status === 'recording' && (
          <LinearProgress
            variant="determinate"
            value={100} // You could calculate a more accurate value based on recording duration
          />
        )}
      </Box>
    </RecorderContainer>
  );
};

export default AudioRecorder;