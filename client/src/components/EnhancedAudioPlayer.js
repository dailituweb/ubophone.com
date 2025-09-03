import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Play, 
  Pause, 
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Download,
  BarChart3,
  Waveform,
  Clock
} from 'lucide-react';

const PlayerContainer = styled.div`
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  padding: 1.5rem;
  margin: 1rem 0;
`;

const PlayerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const RecordingInfo = styled.div`
  h4 {
    color: #FFC900;
    margin: 0 0 0.25rem 0;
    font-size: 1.1rem;
  }
  
  p {
    color: #9ca3af;
    margin: 0;
    font-size: 0.9rem;
  }
`;

const QualityBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  font-size: 0.85rem;
  font-weight: 500;
  
  ${props => {
    switch(props.quality) {
      case 'excellent':
        return 'background: #FFC900; color: #0a0f2f; border: 3px solid #000000;';
      case 'good':
        return 'background: rgba(59, 130, 246, 0.2); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3);';
      case 'fair':
        return 'background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3);';
      case 'poor':
        return 'background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3);';
      default:
        return 'background: rgba(107, 114, 128, 0.2); color: #6b7280; border: 1px solid rgba(107, 114, 128, 0.3);';
    }
  }}
`;

const WaveformContainer = styled.div`
  position: relative;
  height: 80px;
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  margin: 1rem 0;
  overflow: hidden;
`;

const WaveformCanvas = styled.canvas`
  width: 100%;
  height: 100%;
  cursor: pointer;
`;

const ProgressOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: #FFC900;
  transition: width 0.1s ease;
  pointer-events: none;
`;

const ControlsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
`;

const PlayButton = styled.button`
  width: 48px;
  height: 48px;
  border-radius: 0;
  background: #FFC900;
  border: 3px solid #000000;
  color: #0a0f2f;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
    background: #0a0f2f;
    color: #FFC900;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ControlButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 0;
  background: #FFC900;
  border: 3px solid #000000;
  color: #0a0f2f;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #0a0f2f;
    color: #FFC900;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TimeDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #9ca3af;
  font-size: 0.9rem;
  min-width: 120px;
`;

const VolumeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const VolumeSlider = styled.input`
  width: 80px;
  height: 4px;
  border-radius: 2px;
  background: #FFC900;
  outline: none;
  
  &::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #0a0f2f;
    cursor: pointer;
  }
`;

const SpeedControl = styled.select`
  background: #FFC900;
  border: 3px solid #000000;
  color: #0a0f2f;
  padding: 0.25rem 0.5rem;
  border-radius: 0;
  font-size: 0.85rem;
  cursor: pointer;

  option {
    background: #ffffff;
    color: #0a0f2f;
  }
`;

const QualityMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 3px solid #000000;
`;

const MetricCard = styled.div`
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  padding: 0.75rem;
  text-align: center;
`;

const MetricLabel = styled.div`
  color: #9ca3af;
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
`;

const MetricValue = styled.div`
  color: #ffffff;
  font-size: 1.1rem;
  font-weight: 600;
`;

function EnhancedAudioPlayer({ 
  recording, 
  onPlay, 
  onPause, 
  onTimeUpdate,
  onDownload,
  showQualityMetrics = true 
}) {
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [waveformData, setWaveformData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Generate mock waveform data (in real app, this would come from server)
  useEffect(() => {
    if (recording?.duration) {
      const samples = Math.min(recording.duration * 2, 200); // 2 samples per second, max 200
      const mockWaveform = Array.from({ length: samples }, (_, i) => 
        Math.sin(i * 0.1) * 0.5 + Math.random() * 0.3 + 0.2
      );
      setWaveformData(mockWaveform);
    }
  }, [recording]);

  // Draw waveform
  useEffect(() => {
    if (canvasRef.current && waveformData.length > 0) {
      drawWaveform();
    }
  }, [waveformData, currentTime, duration]);

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    
    // Set canvas size
    canvas.width = width;
    canvas.height = height;
    
    // Clear canvas
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, width, height);
    
    // Draw waveform
    const barWidth = width / waveformData.length;
    const centerY = height / 2;
    
    waveformData.forEach((amplitude, index) => {
      const x = index * barWidth;
      const barHeight = amplitude * height * 0.8;
      
      // Color based on playback position
      const progress = duration > 0 ? currentTime / duration : 0;
      const isPlayed = index / waveformData.length <= progress;
      
      ctx.fillStyle = isPlayed ? '#FFC900' : '#000000';
      ctx.fillRect(x, centerY - barHeight / 2, Math.max(barWidth - 1, 1), barHeight);
    });
  };

  const handlePlayPause = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        onPause?.(currentTime);
      } else {
        setIsLoading(true);
        await audioRef.current.play();
        setIsPlaying(true);
        onPlay?.(currentTime);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const seekTime = (x / rect.width) * duration;
    
    if (audioRef.current && !isNaN(seekTime)) {
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const newMutedState = !isMuted;
      setIsMuted(newMutedState);
      audioRef.current.volume = newMutedState ? 0 : volume;
    }
  };

  const handleSpeedChange = (e) => {
    const rate = parseFloat(e.target.value);
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, currentTime - 10);
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(duration, currentTime + 10);
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQualityLevel = (score) => {
    if (score >= 8) return 'excellent';
    if (score >= 6) return 'good';
    if (score >= 4) return 'fair';
    return 'poor';
  };

  const qualityScore = recording?.qualityMetrics?.recordingQuality || 
                      recording?.audioAnalysis?.clarity || 
                      Math.floor(Math.random() * 10) + 1; // Mock data

  return (
    <PlayerContainer>
      <audio
        ref={audioRef}
        src={recording?.recordingUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        preload="metadata"
      />

      <PlayerHeader>
        <RecordingInfo>
          <h4>Recording #{recording?.id?.slice(-8) || 'Unknown'}</h4>
          <p>Duration: {formatTime(recording?.duration || 0)} • Format: {recording?.format || 'MP3'}</p>
        </RecordingInfo>
        
        <QualityBadge quality={getQualityLevel(qualityScore)}>
          <BarChart3 size={14} />
          Quality: {qualityScore}/10
        </QualityBadge>
      </PlayerHeader>

      <WaveformContainer>
        <WaveformCanvas ref={canvasRef} onClick={handleSeek} />
        <ProgressOverlay 
          style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }} 
        />
      </WaveformContainer>

      <ControlsContainer>
        <ControlButton onClick={skipBackward} disabled={!duration}>
          <SkipBack size={16} />
        </ControlButton>
        
        <PlayButton onClick={handlePlayPause} disabled={!recording?.recordingUrl || isLoading}>
          {isLoading ? (
            <div style={{ width: '20px', height: '20px', border: '2px solid #1a2332', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          ) : isPlaying ? (
            <Pause size={20} />
          ) : (
            <Play size={20} />
          )}
        </PlayButton>
        
        <ControlButton onClick={skipForward} disabled={!duration}>
          <SkipForward size={16} />
        </ControlButton>

        <TimeDisplay>
          <Clock size={14} />
          {formatTime(currentTime)} / {formatTime(duration)}
        </TimeDisplay>

        <VolumeContainer>
          <ControlButton onClick={toggleMute}>
            {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </ControlButton>
          <VolumeSlider
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
          />
        </VolumeContainer>

        <SpeedControl value={playbackRate} onChange={handleSpeedChange}>
          <option value="0.5">0.5x</option>
          <option value="0.75">0.75x</option>
          <option value="1">1x</option>
          <option value="1.25">1.25x</option>
          <option value="1.5">1.5x</option>
          <option value="2">2x</option>
        </SpeedControl>

        <ControlButton onClick={() => onDownload?.(recording?.id)}>
          <Download size={16} />
        </ControlButton>
      </ControlsContainer>

      {showQualityMetrics && (
        <QualityMetrics>
          <MetricCard>
            <MetricLabel>Clarity</MetricLabel>
            <MetricValue>{recording?.qualityMetrics?.clarity || '8.2'}/10</MetricValue>
          </MetricCard>
          
          <MetricCard>
            <MetricLabel>Background Noise</MetricLabel>
            <MetricValue>{recording?.qualityMetrics?.backgroundNoise || 'Low'}</MetricValue>
          </MetricCard>
          
          <MetricCard>
            <MetricLabel>Speech Quality</MetricLabel>
            <MetricValue>{recording?.qualityMetrics?.speechQuality || '7.8'}/10</MetricValue>
          </MetricCard>
          
          <MetricCard>
            <MetricLabel>File Size</MetricLabel>
            <MetricValue>{((recording?.fileSize || 1024000) / 1024 / 1024).toFixed(1)} MB</MetricValue>
          </MetricCard>
        </QualityMetrics>
      )}
    </PlayerContainer>
  );
}

export default EnhancedAudioPlayer; 