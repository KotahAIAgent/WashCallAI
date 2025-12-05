'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Pause, Volume2, VolumeX, Download } from 'lucide-react'

interface CallRecordingPlayerProps {
  url: string
}

export function CallRecordingPlayer({ url }: CallRecordingPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  function togglePlay() {
    if (!audioRef.current) return
    
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  function toggleMute() {
    if (!audioRef.current) return
    audioRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  function handleTimeUpdate() {
    if (!audioRef.current) return
    setCurrentTime(audioRef.current.currentTime)
  }

  function handleLoadedMetadata() {
    if (!audioRef.current) return
    setDuration(audioRef.current.duration)
  }

  function handleEnded() {
    setIsPlaying(false)
    setCurrentTime(0)
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    if (!audioRef.current) return
    const time = parseFloat(e.target.value)
    audioRef.current.currentTime = time
    setCurrentTime(time)
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Volume2 className="h-4 w-4 text-muted-foreground" />
        Call Recording
      </div>
      
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
        <audio
          ref={audioRef}
          src={url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          preload="metadata"
        />

        {/* Play/Pause Button */}
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={togglePlay}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </Button>

        {/* Progress Bar */}
        <div className="flex-1 space-y-1">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Mute Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={toggleMute}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>

        {/* Download Button */}
        <a href={url} download target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Download className="h-4 w-4" />
          </Button>
        </a>
      </div>
    </div>
  )
}

