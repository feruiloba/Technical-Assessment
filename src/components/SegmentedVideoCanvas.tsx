import React, { useRef, useEffect, useState } from 'react';
import { ImageSegmenter, FilesetResolver } from '@mediapipe/tasks-vision';
import { FaceDetection } from '../App';
import { Timeframe } from '../types';
import { API_BASE } from '../api';

interface Props {
  videoRef: React.RefObject<HTMLVideoElement>;
  enabled: boolean;
  timeframes?: Timeframe[];
  onDetections?: (detections: FaceDetection[]) => void;
  onProcessingTime?: (time: number) => void;
  isFullscreen?: boolean;
}

const SegmentedVideoCanvas: React.FC<Props> = ({ videoRef, enabled, timeframes = [], onDetections, onProcessingTime, isFullscreen }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [segmenter, setSegmenter] = useState<ImageSegmenter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const lastDetectionTime = useRef<number>(0);
  const lastProcessedTime = useRef<number>(0);

  // Track when video is ready to ensure we re-process
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleReady = () => setVideoReady(true);
    const handleLoadStart = () => setVideoReady(false); // Reset when new source loads

    // Check if already ready
    if (video.readyState >= 2) {
      setVideoReady(true);
    } else {
      setVideoReady(false);
    }

    video.addEventListener('loadeddata', handleReady);
    video.addEventListener('loadstart', handleLoadStart);

    return () => {
      video.removeEventListener('loadeddata', handleReady);
      video.removeEventListener('loadstart', handleLoadStart);
    };
  }, [videoRef]);

  // Load the MediaPipe segmentation model once on mount
  useEffect(() => {
    async function loadModel() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        const model = await ImageSegmenter.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          outputCategoryMask: false,
          outputConfidenceMasks: true,
        });

        setSegmenter(model);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load model');
        setIsLoading(false);
      }
    }

    loadModel();

    return () => {
      segmenter?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Main rendering loop
  useEffect(() => {
    // Reset lastProcessedTime to force a redraw when dependencies change (e.g. new effects, enabled toggle)
    lastProcessedTime.current = -1;

    // If model is not loaded yet, we can't do segmentation.
    // But we still need to draw the video to canvas for face detection if enabled.
    // However, face detection relies on the canvas being drawn.
    // If segmenter is null, we can't segment, but we can still draw video.
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const v = video;
    const c = canvas;
    const context = ctx;
    const seg = segmenter;

    let animationId: number;

    async function detectFaces(imageDataUrl: string) {
      try {
        const response = await fetch(`${API_BASE}/detect-faces`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: imageDataUrl }),
        });
        const data = await response.json();
        if (data.detections && onDetections) {
          const scaleX = v.clientWidth / v.videoWidth;
          const scaleY = v.clientHeight / v.videoHeight;
          const scaled = data.detections.map((d: FaceDetection) => ({
            ...d,
            x: d.x * scaleX,
            y: d.y * scaleY,
            width: d.width * scaleX,
            height: d.height * scaleY,
          }));
          onDetections(scaled);
        }
      } catch (err) {
        // Silently fail - backend might not be running
      }
    }

    function processFrame() {
      // Wait for video to have dimensions
      if (v.readyState < 2 || v.videoWidth === 0) {
        animationId = requestAnimationFrame(processFrame);
        return;
      }

      // Set canvas dimensions to match video
      if (c.width !== v.videoWidth || c.height !== v.videoHeight) {
        c.width = v.videoWidth;
        c.height = v.videoHeight;
      }

      // Only process new frames (skip if video is paused and we already processed)
      const currentTime = v.currentTime;
      if (v.paused && lastProcessedTime.current === currentTime) {
        animationId = requestAnimationFrame(processFrame);
        return;
      }
      lastProcessedTime.current = currentTime;

      let mask: Float32Array | undefined;

      // Find all active effects for the current time
      const activeEffects = timeframes.filter(tf => {
        const start = tf.start;
        const end = tf.end < 0 ? Number.MAX_VALUE : tf.end;
        return currentTime >= start && currentTime <= end;
      });

      // Force re-evaluation of shouldApplyEffect
      const shouldApplyEffect = enabled && activeEffects.length > 0;

      // Apply filters for non-segmentation effects
      // We don't apply CSS filters to the context anymore because we want to apply them only to the background
      // Instead, we'll manually apply the effects pixel-by-pixel
      
      if (shouldApplyEffect && seg) {
        const result = seg.segmentForVideo(v, performance.now());
        mask = result.confidenceMasks?.[0]?.getAsFloat32Array();
      }

      // Clear canvas before drawing
      context.clearRect(0, 0, c.width, c.height);

      // Draw video frame to canvas
      // If we have an effect, we'll overwrite this with the processed pixels
      // If we don't have an effect, we just want to draw the video frame for face detection
      // BUT, if we don't have an effect, we don't want to show the canvas over the video player
      // The visibility style handles hiding the canvas when enabled=false, but what about when enabled=true but no active effect?
      // In that case, shouldApplyEffect is false.
      // If shouldApplyEffect is false, we draw the video frame so face detection can grab it.
      // But since the canvas is on top of the video, the user sees the canvas.
      // So we need to make sure the canvas looks exactly like the video.
      context.drawImage(v, 0, 0);

      if (mask && shouldApplyEffect) {
        const imageData = context.getImageData(0, 0, c.width, c.height);
        const pixels = imageData.data;

        // Gamma Correction to tighten the mask
        const gamma = 3.0;
        const lowThreshold = 0.1;
        const highThreshold = 0.8;

        for (let i = 0; i < mask.length; i++) {
          let confidence = mask[i];
          confidence = Math.pow(confidence, gamma);
          
          // If confidence is high (foreground), skip processing to keep original person
          if (confidence > highThreshold) continue;

          const pixelIndex = i * 4;
          const r = pixels[pixelIndex];
          const g = pixels[pixelIndex + 1];
          const b = pixels[pixelIndex + 2];
          
          // Calculate effect color for background
          let effectR = r;
          let effectG = g;
          let effectB = b;

          // Apply active effects to background
          activeEffects.forEach(effect => {
            switch (effect.type) {
              case 'grayscale':
                const gray = Math.round(0.299 * effectR + 0.587 * effectG + 0.114 * effectB);
                effectR = gray;
                effectG = gray;
                effectB = gray;
                break;
              case 'sepia':
                const sepiaR = (effectR * 0.393) + (effectG * 0.769) + (effectB * 0.189);
                const sepiaG = (effectR * 0.349) + (effectG * 0.686) + (effectB * 0.168);
                const sepiaB = (effectR * 0.272) + (effectG * 0.534) + (effectB * 0.131);
                effectR = Math.min(255, sepiaR);
                effectG = Math.min(255, sepiaG);
                effectB = Math.min(255, sepiaB);
                break;
              case 'invert':
                effectR = 255 - effectR;
                effectG = 255 - effectG;
                effectB = 255 - effectB;
                break;
              case 'blur':
                // Simple darkening as placeholder for blur
                effectR = effectR * 0.8;
                effectG = effectG * 0.8;
                effectB = effectB * 0.8;
                break;
            }
          });

          if (confidence < lowThreshold) {
            // Fully background - apply full effect
            pixels[pixelIndex] = effectR;
            pixels[pixelIndex + 1] = effectG;
            pixels[pixelIndex + 2] = effectB;
          } else {
            // Transition zone - blend original and effect
            const t = (confidence - lowThreshold) / (highThreshold - lowThreshold);
            const alpha = t * t * (3 - 2 * t);
            
            pixels[pixelIndex] = Math.round(r * alpha + effectR * (1 - alpha));
            pixels[pixelIndex + 1] = Math.round(g * alpha + effectG * (1 - alpha));
            pixels[pixelIndex + 2] = Math.round(b * alpha + effectB * (1 - alpha));
          }
        }

        context.putImageData(imageData, 0, 0);
      } else if (!shouldApplyEffect) {
        // If effect is disabled, we still need to draw the video to the canvas
        // so we can extract the image for face detection.
        // However, we don't want to show this canvas to the user if the effect is disabled.
        // The canvas visibility is controlled by the style prop below.
      }

      // Send frame to backend for face detection every 500ms
      const now = performance.now();
      if (now - lastDetectionTime.current > 500) {
        const startTime = performance.now();
        lastDetectionTime.current = now;
        const dataUrl = c.toDataURL('image/jpeg', 0.7);
        detectFaces(dataUrl).then(() => {
          const endTime = performance.now();
          const duration = Math.round(endTime - startTime);
          if (onProcessingTime) {
            onProcessingTime(duration);
          }
        });
      }

      animationId = requestAnimationFrame(processFrame);
    }

    animationId = requestAnimationFrame(processFrame);

    return () => cancelAnimationFrame(animationId);
  }, [enabled, isLoading, segmenter, videoRef, onDetections, timeframes, onProcessingTime, videoReady]);

  if (error) {
    return <div className="segmentation-error">Error: {error}</div>;
  }

  return (
    <>
      {isLoading && enabled && (
        <div className="loading-indicator">Loading segmentation model...</div>
      )}
      <canvas
        ref={canvasRef}
        className="segmented-canvas"
        style={{
          display: 'block', // Always render, but control visibility via opacity if needed, or just let it be hidden by z-index if behind video? 
          // Actually, if enabled is false, we want to hide the canvas from view but keep it updating for detection.
          // Setting opacity: 0 or visibility: hidden works. display: none stops rendering in some browsers/contexts or makes dimensions 0.
          // We check timeframes in the loop, but for visibility we can just check enabled state? 
          // No, if we are outside timeframe, we should hide the canvas (show original video).
          // But wait, the canvas draws the original video if mask is null? No, we draw image(v,0,0).
          // If we don't have a mask, we just draw the video. So the canvas looks like the video.
          // BUT, the canvas is overlaid on the video. If we draw the video on the canvas, it looks the same.
          // However, to be safe and efficient, we can hide it when effect is not applied.
          // But since we calculate 'shouldApplyEffect' inside the loop based on time, we can't easily control CSS visibility from here without state.
          // Actually, if we just draw the video frame when effect is off, it's fine. The user sees the video.
          // The only issue is if there's a slight sync delay.
          // Let's keep it simple: always visible if enabled is true, but inside the loop we decide whether to apply the filter.
          // If enabled is true but outside timeframe, we draw video without filter.
          // However, if we draw the video without filter, it might look slightly different or laggy compared to the native video element.
          // Ideally, we should make the canvas transparent when no effect is applied.
          // But we need the canvas content for face detection.
          // Solution: Set opacity to 0 if enabled but no active effects? 
          // We can't easily know "no active effects" here without checking timeframes again.
          // Let's check timeframes here in render.
          visibility: enabled ? 'visible' : 'hidden',
          opacity: (() => {
             if (!enabled) return 0;
             // Check if any effect is currently active based on last known time?
             // We can't do that easily in render.
             // Instead, let's rely on the fact that drawing the video frame is "good enough".
             // If it's not, we can clear the canvas instead of drawing video when !shouldApplyEffect, 
             // but then face detection would fail (it grabs from canvas).
             // So we MUST draw to canvas.
             return 1;
          })(),
          position: isFullscreen ? 'fixed' : undefined,
          top: isFullscreen ? 0 : undefined,
          left: isFullscreen ? 0 : undefined,
          width: isFullscreen ? '100vw' : undefined,
          height: isFullscreen ? '100vh' : undefined,
          objectFit: 'contain',
          clipPath: isFullscreen ? 'inset(0 0 65px 0)' : 'inset(0 0 65px 0)',
        }}
      />
    </>
  );
};

export default SegmentedVideoCanvas;
