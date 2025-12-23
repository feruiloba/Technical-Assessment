# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack video processing application with face detection and person segmentation. Python Flask backend with React TypeScript frontend. Features AI-powered chat interface for applying effects via natural language.

## Development Commands

### Backend (from project root)
```bash
source .venv/bin/activate
pip install -r api/requirements.txt
python -m api.main                    # Runs on http://127.0.0.1:8080
```

### Frontend (from project root)
```bash
npm install
npm start                             # Dev server on http://localhost:3000
npm test                              # Run tests
npm run build                         # Production build
```

## Architecture

### Backend (`/api`)
- **Entry point**: `api/main.py` - Flask app with CORS, SQLite/PostgreSQL via SQLAlchemy
- **Routes** (`api/routes/`):
  - `detection.py` - Face detection using OpenCV Haar Cascade
  - `projects.py` - Project CRUD operations
  - `effects.py` - Effect management with timeframe overlap validation
  - `chat.py` - Anthropic Claude integration for natural language commands
  - `upload.py` - Cloudinary video upload
- **Models**: `api/models.py` - `Project` and `Effect` with cascade delete
- **Helpers**: `api/helpers.py` - Pre-loaded `face_cascade` classifier

### Frontend (`/src`)
- **Entry**: `src/index.tsx` - React app with Router and ProjectProvider
- **Main**: `src/App.tsx` - Dashboard managing video playback, detection, and effects
- **State**: `src/context/ProjectContext.tsx` - Global state for projects/effects
- **API Client**: `src/api.ts` - All backend API calls
- **Key components**:
  - `SegmentedVideoCanvas.tsx` - MediaPipe person segmentation, sends frames to `/detect-faces` every 500ms
  - `FaceDetectionOverlay.tsx` - Renders bounding boxes scaled to display
  - `EffectsPanel.tsx` - Effect type selection (blur, grayscale, sepia, invert) with timeframe inputs
  - `ChatInterface.tsx` - Natural language effect commands

### Data Flow
1. Video plays in `VideoPlayer`, `SegmentedVideoCanvas` captures frames via canvas
2. MediaPipe processes frames client-side for person segmentation
3. Every 500ms, canvas frame sent as base64 JPEG to backend `/detect-faces`
4. Backend returns face bounding boxes (absolute pixel coordinates)
5. Frontend scales coordinates to display size and renders via `FaceDetectionOverlay`
6. Effects stored in database, applied via canvas rendering based on current video time

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/hello-world` | Health check |
| POST | `/detect-faces` | Face detection (body: `{image: base64}`) |
| GET/POST | `/projects` | List/create projects |
| GET/PUT/DELETE | `/projects/<id>` | Get/update/delete project |
| POST | `/projects/<id>/effects` | Add effect to project |
| PUT | `/projects/<id>/effects` | Replace all effects |
| DELETE | `/projects/<id>/effects` | Remove effects |
| POST | `/upload` | Upload video to Cloudinary |
| POST | `/command` | Process AI command for effects |

## Environment Variables

Required in `.env`:
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` - Video storage
- `ANTHROPIC_API_KEY` - AI chat commands (optional, has mock fallback)
