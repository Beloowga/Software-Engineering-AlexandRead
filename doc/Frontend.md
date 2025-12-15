# AlexandRead Frontend (React + Vite)

This document describes the frontend layer that consumes the AlexandRead API.

## Project Docs
- Overview and setup: [README.md](./README.md)
- API reference: [API.md](./API.md)
- Backend details: [Backend.md](./Backend.md)
- Database schema and storage: [Database.md](./Database.md)
- Screenshots and walkthroughs: [Screenshots.md](./Screenshots.md)

## Dev Notes
- Built with React, Vite, and Axios.
- Uses JWT-based authentication; tokens are sent as `Authorization: Bearer <JWT>`.
- Run locally:
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
- Build and preview:
  ```bash
  npm run build
  npm run preview
  ```
