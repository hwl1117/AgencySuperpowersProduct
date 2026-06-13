# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VideoBrain (短视频智能知识库) — paste a video URL from Douyin/Bilibili/YouTube/Kuaishou/TikTok/Xiaohongshu, the system downloads it, transcribes speech via Whisper, analyzes key frames with GPT-4 Vision, generates structured knowledge, and stores it in a ChromaDB vector database for semantic search.

## Common Commands

### Backend (Python/FastAPI)
```bash
cd backend
python -m venv venv && venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000       # dev server

# Run all tests
cd tests && python -m pytest -v

# Run a single test file
python -m pytest test_api.py -v

# Run tests with markers
python -m pytest -v -m unit        # unit only
python -m pytest -v -m integration # integration only
python -m pytest -v --cov=../backend/services --cov-report=html  # with coverage
```

### Frontend (Next.js 14)
```bash
cd frontend
npm install
npm run dev     # dev server on :3000
npm run build   # production build
npm start       # production server
npm run lint    # ESLint
```

### Docker (full stack)
```bash
make init       # copy .env.example → .env
make start      # docker-compose up -d
make stop       # docker-compose down
make logs       # follow logs
make test       # run backend tests
make clean      # wipe downloads/, audio/, knowledge_base_db/, *.db
```

### Alternative: local dev without Docker
```bash
# from project root — starts both backend and frontend
bash scripts/dev.sh
```

## Architecture

### Processing Pipeline (sequential, each stage updates progress in DB)
```
URL → VideoDownloader (yt-dlp) → AudioExtractor (FFmpeg → 16kHz mono WAV)
    → SpeechToText (Whisper API, auto-chunks files >25MB)
    → VisualAnalyzer (GPT-4V on up to 5 key frames)
    → AISummarizer (GPT-4 → structured JSON + Markdown knowledge doc)
    → KnowledgeBaseManager (ChromaDB + sentence-transformers all-MiniLM-L6-v2)
```

Progress values: 10 → 30 → 50 → 70 → 85 → 100. Status state machine: `pending → downloading → processing → completed` (or `failed` at any stage).

### Backend (`backend/`)
- **`api/main.py`** — Monolithic FastAPI app, all 10 routes + 1 retry endpoint in one file. Background tasks via `BackgroundTasks`. Services are module-level singletons (loaded at import time, including the SentenceTransformer model).
- **`services/`** — Six service classes: `video_downloader`, `audio_extractor`, `speech_to_text`, `visual_analyzer`, `ai_summarizer`, `knowledge_base`. Each manages its own cleanup.
- **`models/database.py`** — SQLAlchemy models: `Video` (stores everything: metadata + processing state + transcript + AI output), `KnowledgeEntry` (loose-coupled to Video via `video_id`, no FK).
- **`config.py`** — Pydantic BaseSettings singleton, but **most services read `os.getenv()` directly** rather than using `settings`.
- **`middleware/`** — `ErrorHandlerMiddleware` and `RequestLoggerMiddleware` — **wired into the app** for centralized error handling and request logging.
- **`utils/`** — `exceptions.py` (12 custom exception types), `validators.py`, `file_utils.py`, `cache.py`, `logger.py` — all **unused** by services (dead code).
- **`migrations/`** — Alembic setup exists but startup uses `create_all()` instead, bypassing migrations entirely.

### Frontend (`frontend/`)
- **Dual architecture pattern**: Root `page.tsx` is a 1277-line monolith with direct `fetch()` calls and its own CSS-variable theme system. Route-based pages (`/library`, `/search`, `/videos/[id]`) use the cleaner `apiClient` singleton + reusable components + custom hooks.
- **`src/lib/api.ts`** — `ApiClient` singleton with all endpoint methods. Base URL from `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'`.
- **`src/hooks/`** — `useVideoProcessor` (polls every 3s), `useSearch`, `useStats`.
- **`src/components/`** — 12 reusable components exported from `index.ts`. Uses `lucide-react` for icons.
- **Theme**: CSS custom properties (`[data-theme="dark"]`) in `globals.css` (~4943 lines, includes a full custom CSS framework that duplicates much of Tailwind). Route-based pages use hardcoded Tailwind colors and **don't respond to theme toggle**.
- **No global state management** — all state is local `useState`. Toast uses module-level pub/sub.

### backend-node/
Standalone Node.js/Express alternative backend (not part of Docker/CI). Has 4 server variants (`server.js` → `server-mimo.js` → `server-full.js` → `server-v2.js`). The active one is `server-v2.js` with MiMo AI integration and Puppeteer for Douyin scraping. **Not connected to the Python backend or Docker Compose.** API keys must be provided via environment variables (`MIMO_API_KEY`).

## Key Gotchas

1. **Dead code is pervasive.** `utils/` directory (exceptions, validators, file_utils, cache, logger) is defined but never imported/used by the actual pipeline or routes.
2. **Config is disconnected.** `config.py` has proper Pydantic settings but services use raw `os.getenv()`. The Alembic `env.py` is the only consumer of `settings.DATABASE_URL`.
3. **Retry endpoint exists.** `POST /api/videos/{video_id}/retry` resets failed/completed/stuck-processing videos and resubmits them to the pipeline.
4. **Platform detection is duplicated** in `VideoDownloader.detect_platform()` (substring match) and `validators.detect_platform()` (regex) with different implementations.
5. **Dual schema init.** Startup does `create_all()` while Alembic migrations also exist — these conflict.
6. **Frontend API inconsistency.** Root page and route pages both use `NEXT_PUBLIC_API_URL` env var, but root page uses raw `fetch()` while route pages use `apiClient`.
7. **Hardcoded API key removed.** `backend-node/` files now read `MIMO_API_KEY` from environment variables. The key was previously hardcoded in source.
8. **Bilibili anti-hotlink.** The downloader injects a custom `Referer` header for Bilibili — this is intentional.
9. **Whisper large-file handling.** Audio >25MB is auto-chunked into 10-min segments (`chunk_duration=600`), transcribed separately, then reassembled with adjusted timestamps. Uses unique temp directories to avoid race conditions.
10. **Model load at import.** `SentenceTransformer("all-MiniLM-L6-v2")` loads at module import time, blocking startup.

## Environment Variables

Copy `.env.example` to `.env`. Required: `OPENAI_API_KEY`. See `.env.example` for the full list:

| Variable | Required | Purpose |
|----------|----------|---------|
| `OPENAI_API_KEY` | Yes | OpenAI API for Whisper + GPT-4 |
| `MIMO_API_KEY` | backend-node only | MiMo AI API key |
| `NEXT_PUBLIC_API_URL` | No | Frontend API base URL (default: `http://localhost:8000`) |
| `DATABASE_URL` | No | SQLite database path |
| `REDIS_URL` | No | Redis connection (unused currently) |

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) triggers on push/PR to `main`/`develop`:
1. Backend tests (pytest + coverage → Codecov)
2. Frontend tests (lint + test + build)
3. Docker build smoke test
4. Trivy security scan (fails on CRITICAL/HIGH)

## CODEOWNERS

- `/backend/` → `@backend-team` (sub-teams: `@api-team`, `@services-team`, `@database-team`)
- `/frontend/` → `@frontend-team`
- `/docs/` + `*.md` → `@docs-team`
- Docker/infra → `@devops-team`
- `/tests/` → `@qa-team`
