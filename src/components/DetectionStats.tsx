import React from 'react';
import { FaceDetection } from '../App';

interface DetectionStatsProps {
  detections: FaceDetection[];
  processingTime: number;
  isDetecting: boolean;
  faceDetectionEnabled: boolean;
  onToggleFaceDetection: () => void;
}

const DetectionStats: React.FC<DetectionStatsProps> = ({ 
  detections, 
  processingTime, 
  isDetecting,
  faceDetectionEnabled,
  onToggleFaceDetection
}) => {
  const averageConfidence = detections.length > 0 
    ? detections.reduce((sum, det) => sum + det.confidence, 0) / detections.length
    : 0;

  return (
    <div className="stats">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0 }}>Detection Results</h3>
        <button
          onClick={onToggleFaceDetection}
          className="btn btn-secondary"
          style={{ padding: '5px 10px', fontSize: '12px' }}
        >
          {faceDetectionEnabled ? 'Hide' : 'Show'} Face Boxes
        </button>
      </div>
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-value">
            {isDetecting ? '...' : detections.length}
          </div>
          <div className="stat-label">Faces Detected</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">
            {isDetecting ? '...' : `${Math.round(averageConfidence * 100)}%`}
          </div>
          <div className="stat-label">Avg Confidence</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">
            {isDetecting ? '...' : `${processingTime}ms`}
          </div>
          <div className="stat-label">Processing Time</div>
        </div>
      </div>
    </div>
  );
};

export default DetectionStats; 