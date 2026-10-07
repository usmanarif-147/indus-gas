# Indus Gas MVP

One Dockerized Next.js application containing:

- public company website: `/`
- installable employee PWA flow: `/field`
- partner dashboard: `/admin`
- PostgreSQL-backed employee activity log

## Start locally

1. Copy `.env.example` to `.env` and replace the database password.
2. Run `docker compose up --build`.
3. Visit `http://localhost:3000`.

`docker-compose.yml` runs the application with your host `UID:GID`. Source files are bind-mounted, while `node_modules` and PostgreSQL data use named Docker volumes. This avoids root-owned project files and lets you edit the current folder normally.

## Important MVP note

Role selection is deliberately open for the prototype. Before genuine expense, payment, or inventory data is recorded, add employee login and assign each employee a fixed role.
