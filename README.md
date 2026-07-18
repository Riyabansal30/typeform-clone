# Typeform Clone

A full-stack form builder inspired by Typeform. Create and organize forms, preview them while editing, publish them through shareable links, collect validated submissions, and review response data with per-question analytics.

> This repository implements the assignment requirements. Authentication, authorization, and other production features were intentionally left out to keep the scope aligned with the assignment.

## Demo

- Repository: https://github.com/Riyabansal30/typeform-clone

## Feature Highlights

- Dashboard for creating, renaming, duplicating, deleting, and opening forms
- Draft and published states with unique public slugs
- Responsive builder with question creation, editing, deletion, and up/down ordering
- Live one-question-at-a-time preview that works before publishing
- Public Typeform-style flow with progress, Previous, Next, and Submit controls
- Required-field checks plus backend type and option validation
- Configurable thank-you message after submission
- Creator-side response table with one column per question
- Multi-response selection and atomic bulk deletion
- Per-question analytics for answered, unanswered, numeric, rating, and choice data

## Supported Question Types

| Type | Configuration and validation |
| --- | --- |
| Short text | Single-line text answer |
| Long text | Multi-line text answer |
| Email | Backend email-format validation |
| Number | Backend finite-number validation |
| Multiple choice | Two or more unique, non-empty options |
| Dropdown | One or more unique, non-empty options |
| Yes / No | Canonical `Yes` or `No` answer |
| Rating | Configurable 3–10 scale, defaulting to 5 |

## Technology Stack

**Frontend:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, ESLint

**Backend:** FastAPI, Pydantic, SQLAlchemy, SQLite, Uvicorn

## Architecture Overview

```text
Browser
  └── Next.js frontend (localhost:3000)
        └── JSON over HTTP
              └── FastAPI backend (127.0.0.1:8000)
                    └── SQLAlchemy
                          └── SQLite database
```

The Next.js application contains the creator dashboard, form builder, public form experience, and results table. FastAPI provides creator-side form, question, submission, and result endpoints alongside separate public-slug endpoints.

```text
Form
├── Questions
└── Submissions
    └── Answers → Question
```

Deleting a form cascades to its questions, submissions, and answers. Bulk response deletion removes selected submissions and their answers in one transaction.

## Project Structure

```text
typeform-clone/
├── backend/
│   ├── app/
│   │   ├── api/             # Form, question, public, result, and health routes
│   │   ├── database.py      # SQLAlchemy engine and sessions
│   │   ├── main.py          # FastAPI application and CORS
│   │   ├── models.py        # Database models
│   │   └── schemas.py       # Request and response schemas
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── app/                 # Dashboard, builder, public form, and results routes
│   ├── components/          # Shared question renderer
│   ├── lib/                 # API client and TypeScript types
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

## API Overview

All endpoints are prefixed with `/api`.

### Forms and Questions

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Health check |
| `GET`, `POST` | `/forms` | List or create forms |
| `GET`, `PATCH`, `DELETE` | `/forms/{form_id}` | Read, update, or delete a form |
| `POST` | `/forms/{form_id}/duplicate` | Duplicate a form and its questions |
| `POST` | `/forms/{form_id}/publish` | Publish and generate a public slug |
| `POST` | `/forms/{form_id}/unpublish` | Remove public access |
| `GET`, `POST` | `/forms/{form_id}/questions` | List or create questions |
| `PATCH`, `DELETE` | `/questions/{question_id}` | Update or delete a question |

### Public Forms

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/public/forms/{slug}` | Load a published form |
| `POST` | `/public/forms/{slug}/submissions` | Validate and save a submission |

### Creator-Side Results

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/forms/{form_id}/results` | Load response table data and analytics |
| `GET` | `/forms/{form_id}/submissions` | List submissions newest first |
| `GET` | `/forms/{form_id}/submissions/{submission_id}` | Load one response |
| `DELETE` | `/forms/{form_id}/submissions` | Atomically delete selected responses |

Interactive API documentation is available at `http://127.0.0.1:8000/docs` while the backend is running.

## Local Setup

### Prerequisites

- Node.js 20 or newer
- npm
- Python 3.10 or newer

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```## Demo

- Repository: `https://github.com/Riyabansal30/typeform-clone`


The API runs at `http://127.0.0.1:8000`.

### Frontend

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

### Frontend

| Variable | Default | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://127.0.0.1:8000` | Public base URL used by browser API requests |

### Backend

| Variable | Default | Description |
| --- | --- | --- |
| `DATABASE_URL` | `sqlite:///./typeform.db` | SQLAlchemy database URL |
| `CORS_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | Comma-separated frontend origins allowed by CORS |

The example files contain development-safe values only. Do not commit real environment files or credentials.

## Database Behavior

SQLite is used by default. Starting FastAPI creates missing tables automatically from SQLAlchemy metadata. When started from `backend/`, the default file is `backend/typeform.db`.

Database and SQLite journal files are ignored by Git, while local data persists between restarts. The project does not currently include a migration framework.

## Development Commands

Frontend checks:

```bash
cd frontend
npm run dev
npm run lint
npx tsc --noEmit
```

Backend development server and health check:

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload
curl http://127.0.0.1:8000/api/health
```

Expected health response:

```json
{"status":"ok"}
```

## Production Commands

Build and serve the frontend:

```bash
cd frontend
npm ci
npm run build
npm run start
```

Run the backend without auto-reload:

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Deployment

Deploy the frontend to a Next.js-compatible platform such as Vercel and set `NEXT_PUBLIC_API_URL` to the public HTTPS URL of the backend before building.

Deploy FastAPI to a Python hosting platform and configure:

- `CORS_ORIGINS` with the exact deployed frontend origin
- `DATABASE_URL` with a persistent database location or hosted database URL

The default SQLite configuration is appropriate for local development and a single persistent server. Serverless or horizontally scaled deployments should use a shared production database and a migration workflow.

## Screenshots

Add real screenshots after capturing the final application:

- Dashboard — `<ADD_SCREENSHOT>`
- Form builder and live preview — `<ADD_SCREENSHOT>`
- Public answering flow — `<ADD_SCREENSHOT>`
- Response table and analytics — `<ADD_SCREENSHOT>`

## Known Limitations

- No creator authentication, authorization, or per-user ownership
- Creator-side API routes are accessible without login
- SQLite and automatic table creation are intended for the MVP
- No database migration workflow
- No automated backend or browser test suite
- Question ordering uses up/down controls instead of drag and drop
- No response pagination, filtering, or export

## Future Improvements

- Creator accounts and ownership authorization
- Database migrations and a production database
- Automated API, component, and end-to-end tests
- Drag-and-drop question ordering
- Response pagination, filtering, and CSV export
- Form themes and additional customization
- Accessibility audit and expanded keyboard interactions
- Rate limiting and abuse protection for public submissions

## Author

Built by **Riyabansal30**.

- GitHub: https://github.com/Riyabansal30
