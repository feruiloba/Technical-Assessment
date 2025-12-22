# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack face detection technical assessment application with a Python Flask backend and React TypeScript frontend. The task is to implement face detection on video content.

## Development Commands

### Backend (from project root)
```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start backend server (runs on http://127.0.0.1:8080)
python app/main.py
```

### Frontend (from /frontend directory)
```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:3000)
npm start

# Run tests
npm test

# Production build
npm build
```

## Architecture

### Backend
- Flask app with CORS enabled at `app/main.py`
- OpenCV with pre-loaded Haar Cascade classifier for face detection in `helpers.py`
- FFmpeg Python bindings available for video processing
- Current endpoint: `GET /hello-world` (test endpoint)

### Frontend
- React 18 with TypeScript (strict mode)
- Component structure:
  - `App.tsx` - Main component, contains `startDetection` function to implement
  - `VideoPlayer.tsx` - HTML5 video player with controls
  - `FaceDetectionOverlay.tsx` - Renders bounding boxes on detected faces
  - `DetectionStats.tsx` - Displays detection metrics
- Video URL configured in `src/consts.ts`

### Data Flow
Frontend sends requests to backend at `http://127.0.0.1:8080`. Face detections use this interface:

```typescript
interface FaceDetection {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  label?: string;
}
```

Bounding box coordinates are relative to video dimensions.

## Implementation Task

The main task is implementing face detection in `frontend/src/App.tsx`'s `startDetection` function, with backend processing endpoints in `app/main.py`. Suggested libraries: MediaPipe, TensorFlow.js, or OpenCV (backend).