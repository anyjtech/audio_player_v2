import React, { useState, useRef, useEffect } from "react";
import {
  Music,
  Upload,
  Disc,
  Volume2,
  VolumeX,
  Volume1,
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  ArrowUp,
  ArrowDown,
  Trash2,
  Cpu,
  RefreshCw,
  ListMusic
} from "lucide-react";

interface Track {
  id: string;
  name: string;
  url: string;
}

export default function App() {
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(-1);
  const [selectedSongIndex, setSelectedSongIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);
  
  // Low Graphics Mode - helps run smoothly on devices with minimal graphics processing
  const [lowGraphicsMode, setLowGraphicsMode] = useState<boolean>(false);
  
  // Prevent timeUpdate state from resetting user drag position
  const [isDraggingProgress, setIsDraggingProgress] = useState<boolean>(false);

  const [dragActive, setDragActive] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-play when song index changes
  useEffect(() => {
    if (audioRef.current && currentSongIndex >= 0 && currentSongIndex < playlist.length) {
      audioRef.current.src = playlist[currentSongIndex].url;
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch((err) => {
          console.log("Auto-play blocked or failed: ", err);
          setIsPlaying(false);
        });
      } else {
        setCurrentTime(0);
      }
    } else if (currentSongIndex === -1 && audioRef.current) {
      audioRef.current.removeAttribute("src");
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
    }
  }, [currentSongIndex]);

  // Handle Play / Pause change
  useEffect(() => {
    if (audioRef.current && currentSongIndex >= 0) {
      if (isPlaying) {
        audioRef.current.play().catch(() => {
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Handle Volume & Mute state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Format seconds into MM:SS
  const formatTime = (time: number) => {
    if (isNaN(time) || time === Infinity) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  // File loading helpers
  const handleFiles = (files: FileList) => {
    const loadedTracks: Track[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (
        file.type.startsWith("audio/") ||
        file.name.endsWith(".mp3") ||
        file.name.endsWith(".wav") ||
        file.name.endsWith(".ogg") ||
        file.name.endsWith(".m4a")
      ) {
        loadedTracks.push({
          id: Math.random().toString(36).substring(2, 9) + Date.now(),
          name: file.name.replace(/\.[^/.]+$/, ""), // strip extension for cleaner look
          url: URL.createObjectURL(file),
        });
      }
    }

    if (loadedTracks.length > 0) {
      setPlaylist((prev) => {
        const updated = [...prev, ...loadedTracks];
        // If nothing is playing, select the first newly added song
        if (currentSongIndex === -1) {
          setCurrentSongIndex(prev.length);
          setSelectedSongIndex(prev.length);
        }
        return updated;
      });
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Drag & Drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Unified Play / Pause toggle
  const togglePlayPause = () => {
    if (playlist.length === 0) return;
    if (currentSongIndex === -1) {
      setCurrentSongIndex(0);
      setSelectedSongIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  // Stop Song
  const stopSong = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Next Track
  const playNext = () => {
    if (playlist.length === 0) return;
    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * playlist.length);
      setCurrentSongIndex(randomIndex);
      setSelectedSongIndex(randomIndex);
    } else {
      const nextIndex = (currentSongIndex + 1) % playlist.length;
      setCurrentSongIndex(nextIndex);
      setSelectedSongIndex(nextIndex);
    }
    setIsPlaying(true);
  };

  // Previous Track
  const playPrev = () => {
    if (playlist.length === 0) return;
    let prevIndex = currentSongIndex - 1;
    if (prevIndex < 0) {
      prevIndex = playlist.length - 1;
    }
    setCurrentSongIndex(prevIndex);
    setSelectedSongIndex(prevIndex);
    setIsPlaying(true);
  };

  // Audio Event Listeners
  const onTimeUpdate = () => {
    if (audioRef.current && !isDraggingProgress) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const onAudioEnded = () => {
    if (isRepeat) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    } else {
      playNext();
    }
  };

  // Seek bar actions
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const handleProgressTouchStart = () => {
    setIsDraggingProgress(true);
  };

  const handleProgressTouchEnd = () => {
    setIsDraggingProgress(false);
  };

  // Volume Action
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Playlist Ordering Actions
  const moveSongUp = () => {
    if (selectedSongIndex <= 0 || selectedSongIndex >= playlist.length) return;
    const newPlaylist = [...playlist];
    // Swap
    const temp = newPlaylist[selectedSongIndex - 1];
    newPlaylist[selectedSongIndex - 1] = newPlaylist[selectedSongIndex];
    newPlaylist[selectedSongIndex] = temp;

    // Adjust pointers
    let newCurrentIndex = currentSongIndex;
    if (currentSongIndex === selectedSongIndex) {
      newCurrentIndex = selectedSongIndex - 1;
    } else if (currentSongIndex === selectedSongIndex - 1) {
      newCurrentIndex = selectedSongIndex;
    }

    setPlaylist(newPlaylist);
    setCurrentSongIndex(newCurrentIndex);
    setSelectedSongIndex(selectedSongIndex - 1);
  };

  const moveSongDown = () => {
    if (selectedSongIndex < 0 || selectedSongIndex >= playlist.length - 1) return;
    const newPlaylist = [...playlist];
    // Swap
    const temp = newPlaylist[selectedSongIndex + 1];
    newPlaylist[selectedSongIndex + 1] = newPlaylist[selectedSongIndex];
    newPlaylist[selectedSongIndex] = temp;

    // Adjust pointers
    let newCurrentIndex = currentSongIndex;
    if (currentSongIndex === selectedSongIndex) {
      newCurrentIndex = selectedSongIndex + 1;
    } else if (currentSongIndex === selectedSongIndex + 1) {
      newCurrentIndex = selectedSongIndex;
    }

    setPlaylist(newPlaylist);
    setCurrentSongIndex(newCurrentIndex);
    setSelectedSongIndex(selectedSongIndex + 1);
  };

  const deleteSelectedSong = () => {
    if (selectedSongIndex < 0 || selectedSongIndex >= playlist.length) return;
    
    // Revoke URL to prevent memory leaks
    URL.revokeObjectURL(playlist[selectedSongIndex].url);

    const newPlaylist = playlist.filter((_, idx) => idx !== selectedSongIndex);
    
    if (newPlaylist.length === 0) {
      stopSong();
      setPlaylist([]);
      setCurrentSongIndex(-1);
      setSelectedSongIndex(-1);
    } else {
      let nextCurrentIndex = currentSongIndex;
      if (currentSongIndex === selectedSongIndex) {
        // Active song deleted. Play next or fallback to last
        nextCurrentIndex = selectedSongIndex >= newPlaylist.length ? newPlaylist.length - 1 : selectedSongIndex;
        // Load the new track index
        setPlaylist(newPlaylist);
        setCurrentSongIndex(nextCurrentIndex);
        setSelectedSongIndex(nextCurrentIndex);
      } else {
        // Adjust currentSongIndex pointer if deleted item was before it
        if (currentSongIndex > selectedSongIndex) {
          nextCurrentIndex = currentSongIndex - 1;
        }
        setPlaylist(newPlaylist);
        setCurrentSongIndex(nextCurrentIndex);
        setSelectedSongIndex(Math.min(selectedSongIndex, newPlaylist.length - 1));
      }
    }
  };

  const clearPlaylist = () => {
    stopSong();
    playlist.forEach((track) => URL.revokeObjectURL(track.url));
    setPlaylist([]);
    setCurrentSongIndex(-1);
    setSelectedSongIndex(-1);
    setCurrentTime(0);
    setDuration(0);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 sm:p-6 select-none font-sans">
      
      {/* APP CONTAINER - Match Elegant Dark style proportions & flex row architecture */}
      <div 
        id="app-container" 
        className="w-full max-w-[940px] md:h-[680px] bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row transition-all duration-300"
      >
        
        {/* SIDEBAR: PLAYLIST & UPLOAD (LEFT SIDE) */}
        <div className="w-full md:w-[340px] border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col bg-[#111113] h-[400px] md:h-full overflow-hidden">
          
          {/* Sidebar Header */}
          <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-zinc-200 flex items-center gap-2.5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-500">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
              <span>ANYJ Audio</span>
            </h2>

            {/* Low Graphics Mode Toggle to make icons / UI ultra lightweight */}
            <button
              onClick={() => setLowGraphicsMode(!lowGraphicsMode)}
              title="Hemat Grafis & Baterai"
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all duration-150 border ${
                lowGraphicsMode
                  ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/60"
                  : "bg-zinc-800/50 text-zinc-400 border-zinc-700/60 hover:bg-zinc-800 hover:text-zinc-200"
              }`}
            >
              <Cpu className="w-3 h-3" />
              <span>{lowGraphicsMode ? "GRAFIS: MIN" : "GRAFIS RINGAN"}</span>
            </button>
          </div>

          {/* Compact Upload Zone Inside Sidebar */}
          <div className="p-4 border-b border-zinc-800/60 bg-zinc-900/10">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              className={`border border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 relative overflow-hidden group ${
                dragActive
                  ? "border-cyan-500 bg-cyan-950/10"
                  : "border-zinc-800 bg-zinc-900/30 hover:border-cyan-500/50 hover:bg-zinc-800/10"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={onFileInputChange}
                accept="audio/*"
                multiple
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center">
                <Upload className="w-5 h-5 text-zinc-500 group-hover:text-cyan-400 mb-1.5 transition-colors" />
                <span className="text-xs font-medium text-zinc-300 group-hover:text-cyan-400 transition-colors">
                  Unggah Berkas Audio
                </span>
                <span className="text-[10px] text-zinc-500 mt-0.5">
                  Seret atau ketuk di sini
                </span>
              </div>
            </div>
          </div>

          {/* Playlist Manager Controls */}
          <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-zinc-800/40 bg-zinc-900/5">
            <span className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase flex items-center gap-1.5">
              <ListMusic className="w-3.5 h-3.5 text-cyan-500" />
              DAFTAR PUTAR ({playlist.length})
            </span>

            {/* Playlist manipulation tools */}
            <div className="flex items-center gap-1">
              <button
                onClick={moveSongUp}
                disabled={selectedSongIndex <= 0 || selectedSongIndex >= playlist.length}
                className="p-1 rounded bg-zinc-800/40 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-20 disabled:pointer-events-none transition-all"
                title="Pindahkan Ke Atas"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={moveSongDown}
                disabled={selectedSongIndex < 0 || selectedSongIndex >= playlist.length - 1}
                className="p-1 rounded bg-zinc-800/40 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-20 disabled:pointer-events-none transition-all"
                title="Pindahkan Ke Bawah"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={deleteSelectedSong}
                disabled={selectedSongIndex < 0 || selectedSongIndex >= playlist.length}
                className="p-1 rounded bg-zinc-800/40 text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 disabled:opacity-20 disabled:pointer-events-none transition-all"
                title="Hapus Dari Daftar"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={clearPlaylist}
                disabled={playlist.length === 0}
                className="p-1 rounded bg-zinc-800/40 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-20 disabled:pointer-events-none transition-all ml-1"
                title="Kosongkan Daftar"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Playlist Scroll Area */}
          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {playlist.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-12 text-center px-4">
                <Music className="w-8 h-8 text-zinc-700 mb-2 stroke-[1.5]" />
                <p className="text-xs text-zinc-500 font-medium">Belum ada lagu</p>
                <p className="text-[10px] text-zinc-600 mt-1 max-w-[180px]">
                  Unggah beberapa file audio untuk memulai mendengarkan musik
                </p>
              </div>
            ) : (
              <ul className="space-y-1">
                {playlist.map((track, idx) => {
                  const isCurrentlyPlaying = idx === currentSongIndex;
                  const isCurrentlySelected = idx === selectedSongIndex;

                  return (
                    <li
                      key={track.id}
                      onClick={() => {
                        setSelectedSongIndex(idx);
                        setCurrentSongIndex(idx);
                        setIsPlaying(true);
                      }}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 group ${
                        isCurrentlyPlaying
                          ? "bg-zinc-800 text-cyan-400 font-semibold border-l-2 border-cyan-500"
                          : isCurrentlySelected
                          ? "bg-zinc-800/60 text-zinc-200 border-l-2 border-zinc-700"
                          : "bg-transparent text-zinc-400 hover:bg-zinc-800/20 hover:text-zinc-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate flex-1 mr-2">
                        <span
                          className={`font-mono text-[10px] w-5 text-right ${
                            isCurrentlyPlaying ? "text-cyan-400 font-bold" : "text-zinc-600"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div className="flex flex-col truncate">
                          <span className="truncate text-xs">{track.name}</span>
                          <span className="text-[9px] text-zinc-500">Local Audio</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isCurrentlyPlaying && (
                          <span className="flex items-center gap-0.5 h-3 w-3 justify-center">
                            <span
                              className={`w-0.5 bg-cyan-400 rounded-full h-full ${
                                isPlaying && !lowGraphicsMode ? "animate-[bounce_0.8s_infinite]" : "h-1"
                              }`}
                            ></span>
                            <span
                              className={`w-0.5 bg-cyan-400 rounded-full h-full ${
                                isPlaying && !lowGraphicsMode ? "animate-[bounce_0.8s_infinite_0.2s]" : "h-1"
                              }`}
                            ></span>
                            <span
                              className={`w-0.5 bg-cyan-400 rounded-full h-full ${
                                isPlaying && !lowGraphicsMode ? "animate-[bounce_0.8s_infinite_0.4s]" : "h-1"
                              }`}
                            ></span>
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* MAIN PLAYER AREA (RIGHT SIDE) */}
        <main className="flex-1 flex flex-col justify-between p-6 sm:p-8 relative bg-zinc-900 h-[500px] md:h-full overflow-hidden">
          
          {/* Top Floating Bar: Volume & Stats */}
          <div className="flex items-center justify-between w-full relative z-10">
            {/* Index Counter Badge */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded font-mono tracking-wider font-semibold">
                {playlist.length > 0 ? `LAGU: ${currentSongIndex + 1} / ${playlist.length}` : "TIDAK ADA LAGU"}
              </span>
              {isRepeat && (
                <span className="text-[9px] bg-sky-950/50 text-sky-400 border border-sky-900/60 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  Repeat
                </span>
              )}
              {isShuffle && (
                <span className="text-[9px] bg-indigo-950/50 text-indigo-400 border border-indigo-900/60 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  Shuffle
                </span>
              )}
            </div>

            {/* Volume bar styled after Elegant Dark */}
            <div className="flex items-center gap-2.5 bg-zinc-950/30 px-3 py-1.5 rounded-full border border-zinc-800/40">
              <button
                onClick={toggleMute}
                className="text-zinc-500 hover:text-white transition-colors duration-150 p-0.5 rounded"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-cyan-500" />
                )}
              </button>
              <input
                id="volume-slider"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 sm:w-24 h-1 rounded-full appearance-none bg-zinc-800 cursor-pointer accent-cyan-500 focus:outline-none"
                style={{
                  background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${
                    (isMuted ? 0 : volume) * 100
                  }%, #27272a ${(isMuted ? 0 : volume) * 100}%, #27272a 100%)`,
                }}
              />
              <span className="text-[10px] font-mono text-zinc-400 w-8 text-right">
                {isMuted ? "0%" : `${Math.round(volume * 100)}%`}
              </span>
            </div>
          </div>

          {/* Center Visualizer Area */}
          <div className="flex-1 flex flex-col items-center justify-center my-4 relative">
            <div className="relative flex flex-col items-center">
              
              {/* Elegant Album Art / Vinyl Disc Container */}
              <div
                className={`w-40 h-40 sm:w-52 sm:h-52 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-950 border-[8px] border-zinc-800 flex items-center justify-center shadow-2xl relative overflow-hidden transition-all duration-300 ${
                  !lowGraphicsMode && isPlaying ? "shadow-cyan-500/10 ring-4 ring-cyan-500/5 scale-105" : "shadow-black/60"
                }`}
              >
                {/* Vinyl Texture Grooves (disabled in lowGraphicsMode to prevent low performance device lag) */}
                {!lowGraphicsMode && (
                  <div className="absolute inset-1.5 rounded-full border border-dashed border-zinc-800/40 opacity-40"></div>
                )}
                {!lowGraphicsMode && (
                  <div className="absolute inset-5 rounded-full border border-dashed border-zinc-800/50 opacity-30"></div>
                )}
                {!lowGraphicsMode && (
                  <div className="absolute inset-10 rounded-full border border-dashed border-zinc-800/60 opacity-20"></div>
                )}

                {/* Core Rotating component */}
                <div
                  style={{ willChange: "transform" }}
                  className={`flex items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 w-16 h-16 sm:w-20 sm:h-20 transition-transform duration-1000 ${
                    isPlaying && !lowGraphicsMode ? "animate-[spin_8s_linear_infinite]" : ""
                  }`}
                >
                  <Disc className={`w-8 h-8 sm:w-10 sm:h-10 text-cyan-500 ${isPlaying ? "opacity-100 animate-pulse" : "opacity-40"}`} />
                </div>

                {/* Center spindle cap */}
                <div className="absolute w-3 h-3 bg-zinc-900 rounded-full border border-zinc-700 shadow-inner"></div>
              </div>

              {/* Title Meta block */}
              <div className="text-center mt-6 w-full max-w-[320px] sm:max-w-md px-4">
                <h2 
                  className="text-lg sm:text-xl font-bold tracking-tight text-zinc-100 truncate mb-1" 
                  title={playlist[currentSongIndex]?.name || "Belum ada lagu"}
                >
                  {playlist[currentSongIndex]?.name || "Belum ada lagu"}
                </h2>
                <p className="text-xs font-semibold tracking-wider text-cyan-500 uppercase">
                  {playlist[currentSongIndex] ? "Audio Lokal" : "Tidak ada berkas"}
                </p>
              </div>

            </div>
          </div>

          {/* Controls section styled after Elegant Dark */}
          <div className="bg-zinc-950/40 p-5 rounded-2xl border border-zinc-800/80 w-full">
            
            {/* Progress/Seek bar slider */}
            <div className="w-full mb-2">
              <input
                id="progress-slider"
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleProgressChange}
                onMouseDown={handleProgressTouchStart}
                onMouseUp={handleProgressTouchEnd}
                onTouchStart={handleProgressTouchStart}
                onTouchEnd={handleProgressTouchEnd}
                className="w-full h-1.5 rounded-full appearance-none bg-zinc-800 cursor-pointer accent-cyan-500 focus:outline-none"
                style={{
                  background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${
                    duration ? (currentTime / duration) * 100 : 0
                  }%, #27272a ${duration ? (currentTime / duration) * 100 : 0}%, #27272a 100%)`,
                }}
              />
            </div>

            {/* Time counters */}
            <div className="flex justify-between items-center text-[11px] font-mono text-zinc-500 mb-4">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>

            {/* Button controllers */}
            <div className="flex items-center justify-center gap-4 sm:gap-6">
              
              {/* Shuffle button toggle */}
              <button
                onClick={() => setIsShuffle(!isShuffle)}
                className={`p-2 rounded-full transition-colors ${
                  isShuffle ? "text-cyan-500" : "text-zinc-500 hover:text-zinc-300"
                }`}
                title="Shuffle"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              {/* Prev track button */}
              <button
                onClick={playPrev}
                className="p-2 text-zinc-400 hover:text-cyan-500 hover:scale-105 active:scale-95 transition-all"
                title="Lagu Sebelumnya"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </button>

              {/* Stop button */}
              <button
                onClick={stopSong}
                className="p-2 text-zinc-400 hover:text-rose-400 hover:scale-105 active:scale-95 transition-all"
                title="Hentikan Lagu"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>

              {/* UNIFIED PLAY / PAUSE BUTTON - ELEGANT MAIN CIRCLE BUTTON */}
              <button
                onClick={togglePlayPause}
                className="w-14 h-14 bg-cyan-500 text-zinc-950 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all"
                title={isPlaying ? "Jeda" : "Putar"}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-current text-zinc-950" />
                ) : (
                  <Play className="w-6 h-6 fill-current text-zinc-950 translate-x-0.5" />
                )}
              </button>

              {/* Next track button */}
              <button
                onClick={playNext}
                className="p-2 text-zinc-400 hover:text-cyan-500 hover:scale-105 active:scale-95 transition-all"
                title="Lagu Selanjutnya"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>

              {/* Repeat button toggle */}
              <button
                onClick={() => setIsRepeat(!isRepeat)}
                className={`p-2 rounded-full transition-colors ${
                  isRepeat ? "text-cyan-500" : "text-zinc-500 hover:text-zinc-300"
                }`}
                title="Ulangi Lagu"
              >
                <Repeat className="w-4 h-4" />
              </button>

              {/* Mute toggle button */}
              <button
                onClick={toggleMute}
                className={`p-2 rounded-full transition-colors ${
                  isMuted ? "text-rose-400" : "text-zinc-500 hover:text-zinc-300"
                }`}
                title="Mute Toggle"
              >
                <VolumeX className="w-4 h-4" />
              </button>

            </div>

          </div>

          {/* Main Footer branding */}
          <div className="absolute top-6 left-6 text-[10px] text-zinc-600 font-mono tracking-widest uppercase pointer-events-none hidden md:block">
            Vector Playback Core
          </div>

        </main>
      </div>

      {/* Hidden Global HTML5 Audio Tag */}
      <audio
        ref={audioRef}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onAudioEnded}
      />
    </div>
  );
}
