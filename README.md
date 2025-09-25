# Blog collaboratif multi-auteurs (MEAN)

## Branching strategy
- `main`: stable, tagged milestones only
- `develop`: integration branch
- `feature/<phase-or-task>`: day-to-day work merged via PR into `develop`

## Roadmap (phases)
1. Repo & workflow standards (this branch)
2. Data modeling (User/Article/Comment schemas, indexes)
3. Auth (JWT + refresh), security baseline (CORS, Helmet, rate limiting)
4. RBAC and permission guards
5. Articles CRUD with ownership and query optimization
6. Nested comments + realtime notifications (Socket.io)
7. Angular 18 scaffold (standalone APIs, routing, env)
8. Frontend auth UI + interceptors/guards
9. Frontend articles UI
10. Frontend comments (realtime)
11. Admin role management UI
12. Tests & hardening; Docs

## Tech choices
- Backend: Node.js, Express, Mongoose, Socket.io
- Frontend: Angular 18 (standalone components), Angular Material or Tailwind
- Auth: JWT access + refresh tokens (rotation), bcrypt hashing
- Security: Helmet, CORS, rate limiting

## Setup (to be completed as phases land)
- Backend and Frontend will each include `.env.example`, scripts, and Docker support.
