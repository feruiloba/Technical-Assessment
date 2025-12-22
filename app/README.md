# Face Detection Technical Assessment

A React-based frontend for implementing face detection on video content.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) to view the app in your browser.

## Assessment Requirements

### Current Implementation
- ✅ Video player component with the provided video URL
- ✅ Face detection overlay system for displaying bounding boxes
- ✅ Statistics display for detection results
- ✅ Mock detection simulation (placeholder)

### Your Task
Implement actual face detection functionality in the `startDetection` function in `src/App.tsx`.

### Key Components

#### `src/App.tsx`
- Main application component
- Contains the `startDetection` function where you should implement face detection
- Manages detection state and results

#### `src/components/VideoPlayer.tsx`
- Video player component with controls
- Provides video element reference for processing

#### `src/components/FaceDetectionOverlay.tsx`
- Overlays bounding boxes on detected faces
- Displays confidence scores and labels

#### `src/components/DetectionStats.tsx`
- Shows detection statistics and results
- Displays processing time and confidence metrics

### Expected Output Format

The face detection should return an array of `FaceDetection` objects:

```typescript
interface FaceDetection {
  id: string;           // Unique identifier
  x: number;           // X coordinate of bounding box
  y: number;           // Y coordinate of bounding box
  width: number;       // Width of bounding box
  height: number;      // Height of bounding box
  confidence: number;  // Confidence score (0-1)
  label?: string;      // Optional label for the face
}
```

### Implementation Notes

1. You can use any face detection library (MediaPipe, TensorFlow.js, etc.)
2. The video URL is already imported from `consts.ts`
3. Bounding box coordinates should be relative to the video dimensions
4. Consider performance optimization for real-time detection
5. Handle edge cases (no faces detected, multiple faces, etc.)

### Evaluation Criteria

- Accuracy of face detection
- Performance optimization
- Code quality and organization
- Error handling
- User experience considerations

Good luck! 