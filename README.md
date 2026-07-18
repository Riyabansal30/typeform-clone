# Typeform Clone

A full-stack form builder inspired by Typeform. Create and manage forms, preview them while editing, publish them through shareable links, collect validated submissions, and analyze responses with per-question analytics.

> This project was built as an assignment-focused MVP. Features such as creator authentication, authorization, and production-grade user management were intentionally left out to keep the scope aligned with the assignment.

---

## Demo

- **Repository:** https://github.com/Riyabansal30/typeform-clone
- **Live Demo:** Coming soon

---

## Features

- Dashboard for creating, renaming, duplicating, deleting, and opening forms
- Draft and published forms with unique public URLs
- Responsive form builder with question creation, editing, deletion, and reordering
- Live preview while building forms
- Typeform-style one-question-at-a-time answering experience
- Previous, Next, and Submit navigation
- Required field validation on both frontend and backend
- Configurable thank-you message after submission
- Response table with one column per question
- Bulk response deletion
- Per-question analytics for text, choice, rating, and numeric questions

---

## Supported Question Types

| Type | Validation |
|------|------------|
| Short Text | Single-line text |
| Long Text | Multi-line text |
| Email | Email format validation |
| Number | Numeric validation |
| Multiple Choice | Two or more unique options |
| Dropdown | One or more unique options |
| Yes / No | `Yes` or `No` |
| Rating | Configurable scale (3–10) |

---

## Tech Stack

| Layer | Technology |
|--------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| Database | SQLite |
| Tooling | ESLint, Uvicorn |

---

## Architecture

```text
Browser
    │
    ▼
Next.js Frontend
    │
JSON over HTTP
    │
    ▼
FastAPI Backend
    │
SQLAlchemy ORM
    │
    ▼
SQLite Database
```

Database relationships:

```text
Form
├── Questions
└── Submissions
      └── Answers → Question
```

Deleting a form automatically removes its questions, submissions, and answers.

---

## Project Structure

```text
typeform-clone/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   └── schemas.py
│   ├── .env.example
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── .env.example
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Main API Endpoints

| Method | Endpoint |
|---------|----------|
| GET | `/api/health` |
| GET / POST | `/api/forms` |
| PATCH / DELETE | `/api/forms/{id}` |
| POST | `/api/forms/{id}/duplicate` |
| POST | `/api/forms/{id}/publish` |
| GET | `/api/public/forms/{slug}` |
| POST | `/api/public/forms/{slug}/submissions` |
| GET | `/api/forms/{id}/results` |

Interactive API documentation is available at:

```
http://127.0.0.1:8000/docs
```

---

# Local Setup

## Prerequisites

- Node.js 20+
- Python 3.10+
- npm

---

## Backend

```bash
cd backend

python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt

cp .env.example .env

uvicorn app.main:app --reload
```

Backend runs on:

```
http://127.0.0.1:8000
```

---

## Frontend

```bash
cd frontend

npm install

cp .env.example .env.local

npm run dev
```

Frontend runs on:

```
http://localhost:3000
```

---

## Environment Variables

### Frontend

| Variable | Default |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | `http://127.0.0.1:8000` |

### Backend

| Variable | Default |
|----------|---------|
| `DATABASE_URL` | `sqlite:///./typeform.db` |
| `CORS_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` |

---

## Database

The project uses SQLite by default.

Tables are automatically created when the backend starts.

For production deployments, a persistent SQL database is recommended.

---

## Development Commands

Frontend

```bash
npm run dev
npm run lint
npx tsc --noEmit
```

Backend

```bash
uvicorn app.main:app --reload

curl http://127.0.0.1:8000/api/health
```

Expected response:

```json
{
  "status": "ok"
}
```

---

## Deployment

### Frontend

Deploy to Vercel (or any Next.js hosting platform).

Required environment variable:

```
NEXT_PUBLIC_API_URL
```

### Backend

Deploy to Render, Railway, or another FastAPI-compatible platform.

Required environment variables:

```
DATABASE_URL
CORS_ORIGINS
```

---

## Known Limitations

- No creator authentication or authorization
- Creator APIs are publicly accessible
- SQLite is used as the default database
- No database migration framework
- No automated backend or end-to-end tests
- Question ordering uses up/down controls instead of drag-and-drop
- No response export, filtering, or pagination

---

## Future Improvements

- Creator accounts and authorization
- Drag-and-drop question ordering
- PostgreSQL support with migrations
- Automated testing
- CSV export
- Response pagination and filtering
- Form themes and customization
- Accessibility improvements
- Rate limiting for public submissions

---

## Author

**Riya Bansal**

GitHub: https://github.com/Riyabansal30