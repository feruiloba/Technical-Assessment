import React from 'react';
import { FaceDetection } from '../App';

interface FaceDetectionOverlayProps {
  detections: FaceDetection[];
  isFullscreen?: boolean;
}

const FaceDetectionOverlay: React.FC<FaceDetectionOverlayProps> = ({ 
  detections,
  isFullscreen
}) => {
  return (
    <div
      className="detection-overlay"
      style={{
        position: isFullscreen ? 'fixed' : undefined,
        top: isFullscreen ? 0 : undefined,
        left: isFullscreen ? 0 : undefined,
        width: isFullscreen ? '100vw' : undefined,
        height: isFullscreen ? '100vh' : undefined,
      }}
    >
      {detections.map((detection) => (
        <div
          key={detection.id}
          className="face-box"
          style={{
            left: `${detection.x}px`,
            top: `${detection.y}px`,
            width: `${detection.width}px`,
            height: `${detection.height}px`,
          }}
        >
          {detection.label && (
            <div className="face-label">
              {detection.label} ({Math.round(detection.confidence * 100)}%)
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FaceDetectionOverlay; 
