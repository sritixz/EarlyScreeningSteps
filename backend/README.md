# Early Steps Screening — Backend API

Human-in-the-loop developmental screening platform for children aged 2–3.
Node.js + Express + MongoDB/Mongoose, ES modules.

## Setup

```bash
npm install
cp .env.example .env   # then fill in real values
npm run dev             # or: npm start
```

Requires a running MongoDB instance reachable at `MONGO_URI`.

## Architecture

```
config/         Mongo connection
models/         User, Child, Screening, Message (Mongoose schemas)
middleware/     protect, requireRole, handleVideoUpload, errorHandler
controllers/    business logic per resource
routes/         Express routers, mounted in app.js
utils/          asyncHandler, generateToken, assignReviewer
uploads/videos/ local disk storage for screening videos (MVP; swap for
                S3/GCS behind the same handleVideoUpload interface later)
app.js          Express app wiring (middleware + routes + error handling)
server.js       entry point: loads env, connects DB, starts the server
```

## Roles

- **parent** — manages their children, submits screenings, messages the
  assigned reviewer.
- **reviewer** — applies with a license number (verified offline by admin),
  works a worklist of assigned screenings, submits an immutable structured
  review, can flag a case urgent.
- **admin** — approves/rejects reviewer applications, reassigns cases,
  monitors the urgent dashboard, views platform stats, deactivates reviewers.

## Key business rules

- New screenings are **auto-assigned** to the available, approved reviewer
  with the fewest open (`assigned`/`in_review`) cases. Admins can override
  via `PATCH /api/admin/screenings/:id/reassign`.
- Messaging is **polling-based** — no WebSockets. Clients call
  `GET /api/messages/:screeningId?since=<ISO timestamp>` on an interval.
- Reviewer credentials (`licenseNumber`) are **text-only for now**,
  verified offline by an admin before approval.
- Urgent flags trigger **in-app admin notification only** — surfaced via
  `GET /api/admin/urgent`. No email integration yet.
- Single region launch: `jurisdiction` is stored on `User` and `Screening`
  but not yet enforced across borders.
- **Reviews are immutable** once submitted — `POST /api/reviews/:screeningId`
  can only succeed once per screening.

## API surface

| Base path        | Purpose                                                    |
|-------------------|-------------------------------------------------------------|
| `/api/auth`       | signup, login, profile                                     |
| `/api/children`   | parent CRUD for their own children                          |
| `/api/screenings` | parent submission (questionnaire + video), worklists, history |
| `/api/reviews`    | reviewer submits structured findings, flags urgent          |
| `/api/messages`   | per-screening thread, polling-based                         |
| `/api/admin`      | reviewer approvals, reassignment, urgent dashboard, stats    |

See inline JSDoc comments above each controller function for the exact
route, method, required role, and expected payload.
