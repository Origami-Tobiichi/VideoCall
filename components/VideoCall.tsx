import { useEffect, useRef, useState } from 'react';
import { useVideo } from '../context/VideoContext';

export default function VideoCall() {
  const videoContext = useVideo();
  if (!videoContext) {
    return <div className="text-center mt-10">Memuat video...</div>;
  }

  const {
    localStream,
    remoteStream,
    isCalling,
    toggleMic,
    toggleCam,
    startCall,
    stopCall,
    preference,
    setPreference,
    partnerData,
    isFullScreen,
    toggleFullScreen,
  } = videoContext;

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleToggleMic = () => {
    toggleMic();
    setMicOn((prev) => !prev);
  };

  const handleToggleCam = () => {
    toggleCam();
    setCamOn((prev) => !prev);
  };

  // Get gender icon
  const getGenderIcon = (gender: string) => {
    if (gender === 'Pria') return '👨';
    if (gender === 'Wanita') return '👩';
    return '⚧';
  };

  // Get country flag
  const getCountryFlag = (country: string) => {
    const flags: Record<string, string> = {
      Indonesia: '🇮🇩',
      Malaysia: '🇲🇾',
      Singapore: '🇸🇬',
      Thailand: '🇹🇭',
      Vietnam: '🇻🇳',
      Philippines: '🇵🇭',
      'United States': '🇺🇸',
      'United Kingdom': '🇬🇧',
      Japan: '🇯🇵',
      'South Korea': '🇰🇷',
      China: '🇨🇳',
      India: '🇮🇳',
      Australia: '🇦🇺',
      Germany: '🇩🇪',
      France: '🇫🇷',
      Brazil: '🇧🇷',
      Russia: '🇷🇺',
    };
    return flags[country] || '🌍';
  };

  const containerClass = isFullScreen
    ? 'fixed inset-0 z-50 bg-black'
    : 'flex flex-col items-center p-4 max-w-4xl mx-auto';

  const videoContainerClass = isFullScreen
    ? 'w-full h-full'
    : 'relative w-full max-w-4xl aspect-video bg-gray-800 rounded-lg overflow-hidden';

  const controlsClass = isFullScreen
    ? 'absolute bottom-4 left-0 right-0 flex justify-center gap-4 z-50'
    : 'flex flex-wrap gap-4 mt-4 justify-center';

  return (
    <div className={containerClass}>
      <div className="w-full">
        {/* Preferensi gender (hanya tampil jika tidak full screen) */}
        {!isFullScreen && (
          <div className="mb-4 flex flex-wrap gap-4 items-center justify-center">
            <span className="font-medium">Cari:</span>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="preference"
                value="all"
                checked={preference === 'all'}
                onChange={() => setPreference('all')}
              />
              ⚡ Semua
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="preference"
                value="opposite"
                checked={preference === 'opposite'}
                onChange={() => setPreference('opposite')}
              />
              👫 Lawan Jenis
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="preference"
                value="same"
                checked={preference === 'same'}
                onChange={() => setPreference('same')}
              />
              👯 Sejenis
            </label>
          </div>
        )}

        {/* Video container */}
        <div className={videoContainerClass}>
          {isCalling ? (
            <>
              {/* Remote video (besar) */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {/* Info partner overlay */}
              {partnerData && (
                <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-2 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <span>{getGenderIcon(partnerData.gender)}</span>
                    <span>{partnerData.name || 'Partner'}</span>
                    <span>{getCountryFlag(partnerData.country)} {partnerData.country}</span>
                  </div>
                </div>
              )}
              {/* Local video (kecil di pojok kanan bawah) */}
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute bottom-4 right-4 w-1/4 aspect-video bg-gray-700 rounded-lg border-2 border-white object-cover"
              />
              {/* Full screen toggle button */}
              <button
                onClick={toggleFullScreen}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition"
              >
                {isFullScreen ? '⛶' : '⛶'}
              </button>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-white text-xl">
              {localStream ? 'Tekan Next untuk mulai' : 'Memuat kamera...'}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className={controlsClass}>
        <button
          onClick={handleToggleMic}
          className="bg-gray-200 p-3 rounded-full shadow hover:bg-gray-300 transition"
        >
          🎤 {micOn ? 'On' : 'Off'}
        </button>
        <button
          onClick={handleToggleCam}
          className="bg-gray-200 p-3 rounded-full shadow hover:bg-gray-300 transition"
        >
          📷 {camOn ? 'On' : 'Off'}
        </button>
        <button
          onClick={startCall}
          className="bg-green-500 text-white px-6 py-2 rounded-full shadow hover:bg-green-600 transition"
        >
          Next
        </button>
        <button
          onClick={stopCall}
          className="bg-red-500 text-white px-6 py-2 rounded-full shadow hover:bg-red-600 transition"
        >
          Stop
        </button>
        {!isFullScreen && (
          <button
            onClick={toggleFullScreen}
            className="bg-blue-500 text-white px-4 py-2 rounded-full shadow hover:bg-blue-600 transition"
          >
            ⛶ Fullscreen
          </button>
        )}
      </div>
    </div>
  );
}
