import React, { useRef, useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import { Box, Slider, IconButton, Typography, useMediaQuery, CircularProgress } from '@mui/material';
import { PlayArrow, Pause, VolumeUp, VolumeOff, Fullscreen, FullscreenExit } from '@mui/icons-material';
import Hls from 'hls.js';

const VideoPlayerContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  maxWidth: '800px', // Adjust as needed
  margin: '0 auto',
  backgroundColor: '#000', // Black background for video
  '& video': {
    width: '100%',
    display: 'block', // Prevent extra space below video
  },
  // Responsive design using Material-UI's breakpoints
  [theme.breakpoints.down('sm')]: {
    maxWidth: '100%',
  },
}));

const ControlsOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  width: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.6)', // Semi-transparent black
  padding: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  opacity: 0, // Hidden by default
  transition: 'opacity 0.3s ease', // Smooth transition
  '&:hover': {
    opacity: 1, // Show on hover
  },
}));

const VolumeControl = styled(Box)({
  display: 'flex',
  alignItems: 'center',
});

const VideoPlayer = ({ src, autoPlay, muted, onReady, onPlay, onPause, onEnd, onError, ...props }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay || false);
  const [isMuted, setIsMuted] = useState(muted || false);
  const [volume, setVolume] = useState(1); // 0 to 1
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down('sm'));

  useEffect(() => {
    let hls;

    // Initialize HLS.js if it's an HLS stream
    if (src.endsWith('.m3u8')) {
      if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(src);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          if (autoPlay) {
            videoRef.current.play();
          }
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
          onError(data);
          setIsLoading(false);
        });
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = src;
        setIsLoading(false);
      } else {
        onError(new Error('HLS is not supported.'));
        setIsLoading(false);
      }
    } else {
      // For non-HLS sources
      videoRef.current.src = src;
      setIsLoading(false);
    }

    // Set up event listeners
    const video = videoRef.current;
    video.addEventListener('loadedmetadata', () => {
      setDuration(video.duration);
      onReady(video);
    });
    video.addEventListener('play', () => {
      setIsPlaying(true);
      onPlay(video);
    });
    video.addEventListener('pause', () => {
      setIsPlaying(false);
      onPause(video);
    });
    video.addEventListener('ended', () => {
      onEnd(video);
    });
    video.addEventListener('error', (error) => {
      onError(error);
    });
    video.addEventListener('timeupdate', () => {
      setCurrentTime(video.currentTime);
    });
    video.addEventListener('volumechange', () => {
      setIsMuted(video.muted);
      setVolume(video.volume);
    });

    // Clean up event listeners and HLS instance on unmount
    return () => {
      if (hls) {
        hls.destroy();
      }
      video.removeEventListener('loadedmetadata', () => {});
      video.removeEventListener('play', () => {});
      video.removeEventListener('pause', () => {});
      video.removeEventListener('ended', () => {});
      video.removeEventListener('error', () => {});
      video.removeEventListener('timeupdate', () => {});
      video.removeEventListener('volumechange', () => {});
    };
  }, [src, autoPlay, muted, onReady, onPlay, onPause, onEnd, onError]);

  const togglePlay = () => {
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    videoRef.current.muted = !isMuted;
  };

  const handleVolumeChange = (event, newValue) => {
    setVolume(newValue);
    videoRef.current.volume = newValue;
  };

  const handleTimeUpdate = (event, newValue) => {
    setCurrentTime(newValue);
    videoRef.current.currentTime = newValue;
  };

  const toggleFullscreen = () => {
    if (isFullscreen) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    } else {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      } else if (videoRef.current.mozRequestFullScreen) {
        videoRef.current.mozRequestFullScreen();
      } else if (videoRef.current.msRequestFullscreen) {
        videoRef.current.msRequestFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.mozFullScreenElement ||
          document.msFullscreenElement
      );
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const formattedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds;
    return `${minutes}:${formattedSeconds}`;
  };

  return (
    <VideoPlayerContainer {...props}>
      {isLoading && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}
        >
          <CircularProgress />
        </Box>
      )}
      <video ref={videoRef} autoPlay={autoPlay} muted={muted} playsInline />
      <ControlsOverlay>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton aria-label="play/pause" onClick={togglePlay} sx={{ color: '#fff' }}>
            {isPlaying ? <Pause /> : <PlayArrow />}
          </IconButton>
          <Typography variant="body2" sx={{ color: '#fff', ml: 1 }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <VolumeControl>
            <IconButton aria-label="mute/unmute" onClick={toggleMute} sx={{ color: '#fff' }}>
              {isMuted ? <VolumeOff /> : <VolumeUp />}
            </IconButton>
            {!isSmallScreen && ( // Hide volume slider on small screens
              <Slider
                aria-label="volume"
                value={volume}
                onChange={handleVolumeChange}
                min={0}
                max={1}
                step={0.01}
                sx={{ color: '#fff', width: 100, ml: 1 }}
              />
            )}
          </VolumeControl>
          <IconButton aria-label="fullscreen" onClick={toggleFullscreen} sx={{ color: '#fff' }}>
            {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
          </IconButton>
        </Box>
      </ControlsOverlay>
      <Slider
        aria-label="time-indicator"
        value={currentTime}
        onChange={handleTimeUpdate}
        min={0}
        max={duration}
        step={0.1}
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          color: '#fff',
          '& .MuiSlider-thumb': {
            width: 12,
            height: 12,
          },
          '& .MuiSlider-track': {
            height: 4,
          },
          '& .MuiSlider-rail': {
            height: 4,
            opacity: 0.2,
          },
        }}
      />
    </VideoPlayerContainer>
  );
};

export default VideoPlayer;