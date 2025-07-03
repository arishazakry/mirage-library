import React, { useState, useEffect } from 'react';
import {
  X, Minimize2, Maximize2, Music
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '@/components/ui/tabs';
import WaveformVisualizer from '../WaveformVisualizer';

const FloatingMusicWidget = ({ songData, onClose, isVisible }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState('spotify');
  const [isDragging, setIsDragging] = useState(false);
   const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 350 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (songData) {
      if (songData?.preview_url) {
        setActiveTab('audio');
      } else if (songData?.track_sp_id || songData?.spotify_uri) {
        setActiveTab('spotify');
      } else if (songData?.track_wd_youtubeid) {
        setActiveTab('youtube');
      }
    }
  }, [songData]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    const maxX = window.innerWidth - (isMinimized ? 280 : 400);
    const maxY = window.innerHeight - 100;
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart({ x: 0, y: 0 });
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX, y: touch.clientY });
    setDragOffset({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    const newX = touch.clientX - dragOffset.x;
    const newY = touch.clientY - dragOffset.y;
    const maxX = window.innerWidth - (isMinimized ? 280 : 400);
    const maxY = window.innerHeight - 100;
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setDragStart({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e) => handleMouseMove(e);
      const handleGlobalMouseUp = () => handleMouseUp();
      const handleGlobalTouchMove = (e) => handleTouchMove(e);
      const handleGlobalTouchEnd = () => handleTouchEnd();

      document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
      document.addEventListener('touchend', handleGlobalTouchEnd);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.removeEventListener('touchmove', handleGlobalTouchMove);
        document.removeEventListener('touchend', handleGlobalTouchEnd);
      };
    }
  }, [isDragging, dragOffset, isMinimized]);

//   if (!isVisible || !songData) return null;
  if (!isVisible) return null;

  const hasSpotify = songData?.track_sp_id || songData?.spotify_uri;
  const hasYoutube = songData?.track_wd_youtubeid;
  const hasAudio = songData?.preview_url || songData?.audio_url;

  const getSpotifyEmbedUrl = () => {
    if (songData?.track_sp_id) {
      return `https://open.spotify.com/embed/track/${songData?.track_sp_id}`;
    }
    if (songData?.spotify_uri) {
      return songData?.spotify_uri.replace('com/track', 'com/embed/track');
    }
    return null;
  };

  const getYoutubeEmbedUrl = () => {
    if (!songData?.track_wd_youtubeid) return null;
    return `https://www.youtube-nocookie.com/embed/${songData?.track_wd_youtubeid}`;
  };

  const getSongTitle = () => songData?.track_sp_name || 'Unknown Track';
  const getArtistName = () => songData?.artist_sp_name || 'Unknown Artist';
  const getSongYear = () => songData?.track_sp_year || '';
  const getSongGenre = () => songData?.track_name_genre || '';

  return (
    <div
      className="fixed z-50 select-none rounded-xl border shadow-xl bg-background"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? '280px' : '400px',
        maxWidth: '90vw',
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
        transition: isDragging ? 'none' : 'transform 0.2s ease-out'
      }}
    >
      <div
            className="flex items-center justify-between bg-primary text-primary-foreground px-4 py-2 cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            >
        <div className="flex items-center gap-2 truncate">
          <Music className="h-4 w-4" />
          <span className="text-sm font-medium truncate">
            {getSongTitle()}
          </span>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => setIsMinimized(!isMinimized)}>
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-4 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground truncate">
              {getSongTitle()}
            </h3>
            <p className="text-sm text-muted-foreground">
              {getArtistName()} {getSongYear() && `• ${getSongYear()}`}
            </p>
            {getSongGenre() && (
              <p className="text-xs mt-1 text-muted-foreground italic">
                {getSongGenre()}
              </p>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              {hasAudio && <TabsTrigger value="audio">Audio</TabsTrigger>}
              {hasSpotify && <TabsTrigger value="spotify">Spotify</TabsTrigger>}
              {hasYoutube && <TabsTrigger value="youtube">YouTube</TabsTrigger>}
            </TabsList>
            {hasAudio && (
              <TabsContent value="audio">
                <WaveformVisualizer
                  audioUrl={songData?.preview_url || songData?.audio_url}
                  isPlaying={isPlaying}
                  onTogglePlay={setIsPlaying}
                />
              </TabsContent>
            )}
            {hasSpotify && (
              <TabsContent value="spotify">
                {getSpotifyEmbedUrl() ? (
                  <iframe
                    src={getSpotifyEmbedUrl()}
                    width="100%"
                    height="152"
                    frameBorder="0"
                    allowtransparency="true"
                    allow="encrypted-media"
                    className="rounded-md"
                  />
                ) : (
                  <div className="text-center text-sm text-muted-foreground">Unable to load Spotify embed</div>
                )}
              </TabsContent>
            )}
            {hasYoutube && (
              <TabsContent value="youtube">
                {getYoutubeEmbedUrl() ? (
                  <iframe
                    src={getYoutubeEmbedUrl()}
                    width="100%"
                    height="200"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="rounded-md"
                  />
                ) : (
                  <div className="text-center text-sm text-muted-foreground">Unable to load YouTube embed</div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default FloatingMusicWidget;
