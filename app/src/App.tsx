import React, { useEffect, useRef, useState } from 'react';
import VideoPlayer from './components/VideoPlayer';
import SegmentedVideoCanvas from './components/SegmentedVideoCanvas';
import FaceDetectionOverlay from './components/FaceDetectionOverlay';
import DetectionStats from './components/DetectionStats';
import EffectsPanel, { Timeframe } from './components/EffectsPanel';
import { videoUrl } from './consts';

export interface FaceDetection {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  label?: string;
}

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [segmentationEnabled, setSegmentationEnabled] = useState(true);
  const [faceDetectionEnabled, setFaceDetectionEnabled] = useState(true);
  const [detections, setDetections] = useState<FaceDetection[]>([]);
  const [processingTime, setProcessingTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeframes, setTimeframes] = useState<Timeframe[]>([]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const container = containerRef.current;
      const video = videoRef.current;
      const target = document.fullscreenElement;
      setIsFullscreen(target === container || target === video);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;
    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
      } else if (document.fullscreenElement === container) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen toggle failed', err);
    }
  };

  return (
    <div className="container">
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Video Segmentation Demo</h1>

      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', alignItems: 'flex-start' }}>
        <div style={{ width: '300px', flexShrink: 0 }}>
          {detections.length > 0 && (
            <DetectionStats
              detections={detections}
              processingTime={processingTime}
              isDetecting={false}
              faceDetectionEnabled={faceDetectionEnabled}
              onToggleFaceDetection={() => setFaceDetectionEnabled(!faceDetectionEnabled)}
            />
          )}
          
          <EffectsPanel
            effectEnabled={segmentationEnabled}
            onToggleEffect={() => setSegmentationEnabled(!segmentationEnabled)}
            timeframes={timeframes}
            onAddTimeframe={(tf) => setTimeframes([...timeframes, tf])}
            onRemoveTimeframe={(index) => setTimeframes(timeframes.filter((_, i) => i !== index))}
            getCurrentTime={() => videoRef.current?.currentTime || 0}
          />
        </div>

        <div style={{ flexGrow: 1, maxWidth: '800px' }}>
          <div
            ref={containerRef}
            className={`video-container ${isFullscreen ? 'fullscreen' : ''}`}
            onDoubleClick={toggleFullscreen}
            style={{ cursor: 'pointer', margin: '0 auto 20px' }}
          >
            <VideoPlayer
              ref={videoRef}
              src={videoUrl}
              onLoadedMetadata={() => console.log('Video loaded')}
            />
            <SegmentedVideoCanvas
              videoRef={videoRef}
              enabled={segmentationEnabled}
              timeframes={timeframes}
              onDetections={setDetections}
              onProcessingTime={setProcessingTime}
              isFullscreen={isFullscreen}
            />
            {faceDetectionEnabled && (
              <FaceDetectionOverlay
                detections={detections}
                isFullscreen={isFullscreen}
              />
            )}
            <button
              className="custom-fullscreen-button"
              onClick={(e) => {
                e.stopPropagation(); // Prevent container click
                toggleFullscreen();
              }}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              )}
            </button>
          </div>

          <div className="controls">
            {/* Effect toggle moved to EffectsPanel */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
