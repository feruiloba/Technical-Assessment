# Video Processing with Face Detection

A full-stack video processing application featuring real-time face detection, person segmentation, and video effects. Built with Python Flask backend and React TypeScript frontend.

## Features

- Real-time face detection using OpenCV Haar Cascade
- Person segmentation using MediaPipe
- Video effects (blur, grayscale, sepia, invert) with timeframe controls
- AI-powered chat interface for applying effects via natural language
- Project management with persistent storage
- Video upload via Cloudinary

## Project Structure

```
├── api/                    # Python Flask Backend
│   ├── main.py            # Entry point (port 8080)
│   ├── models.py          # SQLAlchemy models (Project, Effect)
│   ├── helpers.py         # Utilities and face cascade loader
│   ├── requirements.txt   # Python dependencies
│   └── routes/            # API endpoint blueprints
│       ├── detection.py   # Face detection endpoint
│       ├── projects.py    # Project CRUD
│       ├── effects.py     # Effect management
│       ├── chat.py        # AI command processing
│       └── upload.py      # Video upload
├── src/                    # React TypeScript Frontend
│   ├── index.tsx          # App entry point
│   ├── App.tsx            # Main dashboard component
│   ├── api.ts             # API client
│   ├── types.ts           # TypeScript interfaces
│   ├── context/           # React context (ProjectContext)
│   └── components/        # UI components
├── package.json           # Frontend dependencies
├── vercel.json            # Vercel deployment config
└── CLAUDE.md              # Development guidelines
```

## Prerequisites

- Python 3.8+
- Node.js 16+
- npm

## Getting Started

### Backend Setup

1. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. Install Python dependencies:
   ```bash
   pip install -r api/requirements.txt
   ```

3. Start the backend server:
   ```bash
   python -m api.main
   ```

The backend will run on `http://127.0.0.1:8080`

### Frontend Setup

1. Install Node.js dependencies:
   ```bash
   npm install
   ```

2. Start the React development server:
   ```bash
   npm start
   ```

The frontend will run on `http://localhost:3000`

### Running Both Servers

For local development, run both servers in separate terminals:

**Terminal 1 (Backend):**
```bash
source .venv/bin/activate
python -m api.main
```

**Terminal 2 (Frontend):**
```bash
npm start
```

## Environment Variables

Create a `.env` file in the project root:

```env
# Database (optional - defaults to SQLite)
DATABASE_URL=postgresql://user:password@host:5432/dbname
# Or use Prisma-style variable:
PRISMA_DATABASE_URL=postgresql://user:password@host:5432/dbname

# Cloudinary (for video upload)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Anthropic (for AI chat commands - optional)
ANTHROPIC_API_KEY=your_api_key
```

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

## Testing

```bash
npm test
```

## Production Build

```bash
npm run build
```

## Deployment

This project is configured for Vercel deployment. Push to main to trigger automatic deployment.

## Technologies

- **Backend**: Python, Flask, SQLAlchemy, OpenCV
- **Frontend**: React, TypeScript, MediaPipe
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Storage**: Cloudinary
- **AI**: Anthropic Claude API
