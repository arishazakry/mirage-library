import React, { useState, useEffect, useRef } from 'react';
import {
  X, Minimize2, Maximize2, Music, Play, Pause, Volume2, VolumeX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '@/components/ui/tabs';

const WaveformVisualizer = ({ audioUrl, isPlaying, onTogglePlay, className }) => {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!audioUrl) return;
    const audio = audioRef.current;
    if (!audio) return;

    const setupAudio = async () => {
      try {
        setIsLoading(true);
        setError(null);
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        analyserRef.current.smoothingTimeConstant = 0.8;
        audio.crossOrigin = 'anonymous';
        audio.src = audioUrl;
        audio.volume = volume;
        sourceRef.current = audioContextRef.current.createMediaElementSource(audio);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);

        audio.addEventListener('loadedmetadata', () => {
          setDuration(audio.duration);
          setIsLoading(false);
        });
        audio.addEventListener('timeupdate', () => {
          setCurrentTime(audio.currentTime);
        });
        audio.addEventListener('ended', () => onTogglePlay(false));
        audio.addEventListener('error', () => {
          setError('Failed to load audio');
          setIsLoading(false);
        });
      } catch (err) {
        setError('Audio not supported');
        setIsLoading(false);
      }
    };

    setupAudio();

    return () => {
      audioContextRef.current?.close();
      cancelAnimationFrame(animationRef.current);
    };
  }, [audioUrl]);

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play();
      startVisualization();
    } else {
      audioRef.current?.pause();
      cancelAnimationFrame(animationRef.current);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const startVisualization = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isPlaying) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      ctx.fillStyle = 'rgb(15, 23, 42)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2;
      let x = 0;
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#10b981');
      gradient.addColorStop(0.5, '#3b82f6');
      gradient.addColorStop(1, '#8b5cf6');

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }

      const progress = duration ? currentTime / duration : 0;
      const progressWidth = canvas.width * progress;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(0, canvas.height - 2, canvas.width, 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(0, canvas.height - 2, progressWidth, 2);

      animationRef.current = requestAnimationFrame(draw);
    };
    draw();
  };

  const handleCanvasClick = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / canvasRef.current.width) * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time) => `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, '0')}`;

  if (error) return <div className={`bg-destructive/10 border border-destructive rounded-lg p-4 text-center ${className}`}><p className="text-destructive text-sm">{error}</p></div>;

  return (
    <div className={`bg-background rounded-lg p-4 ${className}`}>
      <audio ref={audioRef} preload="metadata" />
      <div className="relative mb-4">
        <canvas ref={canvasRef} width={350} height={120} className="w-full h-24 bg-muted rounded cursor-pointer" onClick={handleCanvasClick} />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/80 rounded">
            <div className="text-foreground text-sm">Loading audio...</div>
          </div>
        )}
      </div>
      <div className="flex items-center space-x-4">
        <Button onClick={() => onTogglePlay(!isPlaying)} disabled={isLoading} size="icon" className="bg-green-500 hover:bg-green-600">
          {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
        </Button>
        <div className="flex-1 text-foreground text-sm">
          <div className="flex justify-between">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)}>
            {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
          </Button>
          <Slider
            min={0}
            max={1}
            step={0.1}
            value={[isMuted ? 0 : volume]}
            onValueChange={([val]) => {
              setVolume(val);
              setIsMuted(val === 0);
            }}
            className="w-24"
          />
        </div>
      </div>
    </div>
  );
};

export default WaveformVisualizer;
