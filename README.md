# Switchkrr

Switchkrr is a mentor-led job switching platform. Candidates request mentors, approved requests create Hustles, mentors share leads, and candidates track progress.

## Stack

- Next.js
- TypeScript
- PostgreSQL
- Prisma
- Custom signed-session foundation, Auth.js-ready

## Local Setup

```bash
npm install
copy .env.example .env
docker compose up -d
npm run db:push
npm run dev
```

Open `http://localhost:3000`.

## First Implemented Slice

- Clean Next.js app structure.
- Prisma schema for users, mentor profiles, candidate profiles, mentor requests, Hustles, leads, progress updates, and sessions.
- Candidate and mentor signup.
- Login/logout with signed HTTP-only session cookie.
- Role-aware dashboard shell.
- Server-side password hashing.

## Development Phases

Planning documents live in `docs/`.
