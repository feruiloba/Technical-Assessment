import React, { useRef, useEffect, useState } from 'react';
import { ImageSegmenter, FilesetResolver } from '@mediapipe/tasks-vision';
import { FaceDetection } from '../App';
import { Timeframe } from './EffectsPanel';

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
  const lastDetectionTime = useRef<number>(0);
  const lastProcessedTime = useRef<number>(0);
  const [processingTime, setProcessingTime] = useState(0);

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
  }, []);

  // Main rendering loop
  useEffect(() => {
    if (isLoading || !segmenter) return;

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
        const response = await fetch('http://127.0.0.1:8080/detect-faces', {
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

      // Check if effect should be active based on timeframes
      const isTimeframeActive = timeframes.length === 0 || timeframes.some(tf => currentTime >= tf.start && currentTime <= tf.end);
      const shouldApplyEffect = enabled && isTimeframeActive;

      if (shouldApplyEffect) {
        const result = seg.segmentForVideo(v, performance.now());
        mask = result.confidenceMasks?.[0]?.getAsFloat32Array();
      }

      // Draw video frame to canvas
      context.drawImage(v, 0, 0);

      if (mask && shouldApplyEffect) {
        const imageData = context.getImageData(0, 0, c.width, c.height);
        const pixels = imageData.data;

        // Gamma Correction to tighten the mask
        // Raising confidence to a power suppresses low/mid values (aura/noise)
        // while preserving high values (core body).
        // This effectively shrinks the mask slightly and cleans up edges.
        const gamma = 3.0;

        // Soft blending parameters
        const lowThreshold = 0.1;
        const highThreshold = 0.8;

        for (let i = 0; i < mask.length; i++) {
          let confidence = mask[i];
          
          // Apply Gamma Correction
          // 0.5 ^ 3 = 0.125 (becomes background)
          // 0.9 ^ 3 = 0.729 (stays foreground)
          confidence = Math.pow(confidence, gamma);
          
          // Optimization: If confidence is high enough, keep original color (skip calculation)
          if (confidence > highThreshold) continue;

          const pixelIndex = i * 4;
          const r = pixels[pixelIndex];
          const g = pixels[pixelIndex + 1];
          const b = pixels[pixelIndex + 2];
          
          // Calculate grayscale version
          const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

          if (confidence < lowThreshold) {
            // Fully background - apply full grayscale
            pixels[pixelIndex] = gray;
            pixels[pixelIndex + 1] = gray;
            pixels[pixelIndex + 2] = gray;
          } else {
            // Transition zone - blend color and grayscale
            // Normalize confidence between 0 and 1 based on thresholds
            const t = (confidence - lowThreshold) / (highThreshold - lowThreshold);
            
            // Use ease-in-out curve to make the transition smoother
            const alpha = t * t * (3 - 2 * t);
            
            // Blend: 0 = gray, 1 = color
            pixels[pixelIndex] = Math.round(r * alpha + gray * (1 - alpha));
            pixels[pixelIndex + 1] = Math.round(g * alpha + gray * (1 - alpha));
            pixels[pixelIndex + 2] = Math.round(b * alpha + gray * (1 - alpha));
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
  }, [enabled, isLoading, segmenter, videoRef, onDetections]);

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
          visibility: enabled ? 'visible' : 'hidden',
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
