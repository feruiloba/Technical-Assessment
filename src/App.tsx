import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import VideoPlayer from './components/VideoPlayer';
import SegmentedVideoCanvas from './components/SegmentedVideoCanvas';
import FaceDetectionOverlay from './components/FaceDetectionOverlay';
import DetectionStats from './components/DetectionStats';
import EffectsPanel from './components/EffectsPanel';
import ChatInterface from './components/ChatInterface';
import Sidebar from './components/Sidebar';
import { useProject } from './context/ProjectContext';
import { uploadApi } from './api';
import { Timeframe, effectToTimeframe, timeframeToEffectInput } from './types';

export interface FaceDetection {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  label?: string;
}

const Dashboard: React.FC = () => {
  const { projectId } = useParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [segmentationEnabled, setSegmentationEnabled] = useState(true);
  const [faceDetectionEnabled, setFaceDetectionEnabled] = useState(true);
  const [detections, setDetections] = useState<FaceDetection[]>([]);
  const [processingTime, setProcessingTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const { selectedProject, addEffect, removeEffect, updateProject, selectProject } = useProject();

  // Sync URL -> Context
  useEffect(() => {
    if (projectId && projectId !== selectedProject?.id) {
      selectProject(projectId);
    } else if (!projectId && selectedProject) {
      selectProject(null);
    }
  }, [projectId, selectProject, selectedProject?.id]);

  // Check if project has a video
  const hasVideo = selectedProject?.video_url;

  // Derive timeframes from selected project effects
  const timeframes = useMemo(() => {
    if (!selectedProject?.effects) return [];
    return selectedProject.effects.map(effectToTimeframe);
  }, [selectedProject?.effects]);

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

  const handleAddTimeframe = async (tf: Timeframe) => {
    if (selectedProject) {
      await addEffect(timeframeToEffectInput(tf));
    }
  };

  const handleRemoveTimeframe = async (index: number) => {
    if (selectedProject?.effects && selectedProject.effects[index]) {
      await removeEffect(selectedProject.effects[index].id);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProject) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setUploadError('Please select a video file');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress('Uploading video...');

    try {
      const result = await uploadApi.uploadVideo(file);
      setUploadProgress('Updating project...');
      await updateProject(selectedProject.id, { video_url: result.url });
      setUploadProgress(null);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <Sidebar onCollapseChange={setSidebarCollapsed} />

      <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="container">
          {selectedProject ? (
            <>
              <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>{selectedProject.name}</h1>

              {hasVideo ? (
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', alignItems: 'flex-start' }}>
                  <div style={{ width: '250px', flexShrink: 0 }}>
                    <DetectionStats
                      detections={detections}
                      processingTime={processingTime}
                      isDetecting={false}
                      faceDetectionEnabled={faceDetectionEnabled}
                      onToggleFaceDetection={() => setFaceDetectionEnabled(!faceDetectionEnabled)}
                    />
                  </div>

                  <div style={{ flexGrow: 1, maxWidth: '1200px' }}>
                    <div
                      ref={containerRef}
                      className={`video-container ${isFullscreen ? 'fullscreen' : ''}`}
                      onDoubleClick={toggleFullscreen}
                      style={{ cursor: 'pointer', margin: '0 auto 20px' }}
                    >
                      <VideoPlayer
                        ref={videoRef}
                        src={selectedProject.video_url!}
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
                          e.stopPropagation();
                          toggleFullscreen();
                        }}
                        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
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
                    
                    <ChatInterface
                      onAddEffect={addEffect}
                      onRemoveEffect={removeEffect}
                      effects={selectedProject.effects}
                      videoDuration={videoRef.current?.duration || 0}
                      getCurrentTime={() => videoRef.current?.currentTime || 0}
                    />
                  </div>

                  <div style={{ width: '300px', flexShrink: 0 }}>
                      <EffectsPanel
                      effectEnabled={segmentationEnabled}
                      onToggleEffect={() => setSegmentationEnabled(!segmentationEnabled)}
                      timeframes={timeframes}
                      onAddTimeframe={handleAddTimeframe}
                      onRemoveTimeframe={handleRemoveTimeframe}
                      getCurrentTime={() => videoRef.current?.currentTime || 0}
                      videoDuration={videoRef.current?.duration || 0}
                      projectId={selectedProject.id}
                      effects={selectedProject.effects}
                      onAddEffect={addEffect}
                      onRemoveEffect={removeEffect}
                    />
                  </div>
                </div>
              ) : (
                /* Upload Video UI */
                <div className="no-project-selected" style={{ maxWidth: '500px', margin: '0 auto' }}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <h2>Upload a Video</h2>
                  <p style={{ marginBottom: '20px' }}>
                    This project doesn't have a video yet. Upload one to get started with face detection and effects.
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />

                  <button
                    className="btn btn-primary"
                    onClick={handleUploadClick}
                    disabled={isUploading}
                    style={{ padding: '12px 32px', fontSize: '16px' }}
                  >
                    {isUploading ? (
                      <>
                        <span className="status-dot" style={{
                          display: 'inline-block',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: 'currentColor',
                          marginRight: '8px',
                          animation: 'pulse 1s infinite'
                        }} />
                        {uploadProgress || 'Uploading...'}
                      </>
                    ) : (
                      'Choose Video File'
                    )}
                  </button>

                  {uploadError && (
                    <p style={{
                      color: 'var(--color-danger)',
                      marginTop: '16px',
                      fontSize: '14px'
                    }}>
                      {uploadError}
                    </p>
                  )}

                  <p style={{
                    marginTop: '16px',
                    fontSize: '12px',
                    color: 'var(--color-text-muted)'
                  }}>
                    Supported formats: MP4, WebM, MOV
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="no-project-selected">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              <h2>No Project Selected</h2>
              <p>Select a project from the sidebar or create a new one to get started.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/project/:projectId" element={<Dashboard />} />
      <Route path="/" element={<Dashboard />} />
    </Routes>
  );
};

export default App;
