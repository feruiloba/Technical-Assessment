# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack video processing application with face detection and person segmentation. Python Flask backend with React TypeScript frontend.

## Development Commands

### Backend (from project root)
```bash
# Activate virtual environment
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server (runs on http://127.0.0.1:8080)
python -m api.main
```

### Frontend (from /app directory)
```bash
cd app

# Install dependencies
npm install

# Start development server (runs on http://localhost:3000)
npm start

# Run tests
npm test

# Production build
npm run build
```

## Architecture

### Backend (`/api`)
- **Entry point**: `api/main.py` - Flask app with CORS, SQLite/Postgres database via SQLAlchemy
- **Routes**: Blueprints in `api/routes/`
  - `detection.py` - POST `/detect-faces` accepts base64 image, returns bounding boxes using Haar Cascade
  - `projects.py` - CRUD for projects at `/projects`
  - `effects.py` - Manage video effects per project at `/projects/<id>/effects`
- **Models**: `api/models.py` - `Project` and `Effect` SQLAlchemy models
- **Helpers**: `api/helpers.py` - Pre-loaded `face_cascade` classifier, temp file utilities

### Frontend (`/app`)
- **Entry point**: `app/src/App.tsx` - Main component managing video playback, segmentation, and face detection state
- **Key components**:
  - `SegmentedVideoCanvas.tsx` - Uses MediaPipe ImageSegmenter for real-time person segmentation (grayscale background effect). Sends frames to `/detect-faces` every 500ms
  - `FaceDetectionOverlay.tsx` - Renders bounding boxes scaled to video display size
  - `EffectsPanel.tsx` - UI for toggling effects and managing timeframes
  - `VideoPlayer.tsx` - HTML5 video wrapper
- **Config**: `app/src/consts.ts` - Video URL

### Data Flow
1. Video plays in `VideoPlayer`, `SegmentedVideoCanvas` captures frames via canvas
2. MediaPipe processes frames client-side for person segmentation (colored person, grayscale background)
3. Every 500ms, canvas frame sent as base64 JPEG to backend `/detect-faces`
4. Backend returns face bounding boxes (absolute pixel coordinates)
5. Frontend scales coordinates to display size and renders via `FaceDetectionOverlay`

### FaceDetection Interface
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

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/hello-world` | Health check |
| POST | `/detect-faces` | Face detection (body: `{image: base64}`) |
| GET/POST | `/projects` | List/create projects |
| GET/PUT | `/projects/<id>` | Get/update project |
| POST | `/projects/<id>/effects` | Add effect to project |
| PUT | `/projects/<id>/effects` | Replace all effects for project |
