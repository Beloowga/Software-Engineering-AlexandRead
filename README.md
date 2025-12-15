# Software-Engineering-AlexandRead

## Overview

This project aims at creating an online library system experience called **AlexandRead**.
The goal of the project is to regroup open-source references all in one place.
We aim to make the references easily accessible so that readers can save their favorites and give feedback on them (ratings and comments).
The platform is available on desktop web-browsing.

## Prerequisites

- Node.js 18+ and npm installed locally.

## Project layout

- `backend/`: Express API and authentication.
- `frontend/`: React + Vite single-page app.

## Backend setup

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Start the API (adjust command as needed):
   - Development with reload: `npm run dev`
   - Production mode: `npm start`

## Frontend setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Run the app:
   - Development server: `npm run dev` (defaults to http://localhost:5173)
   - Build for production: `npm run build`
   - Preview built app: `npm run preview`

## Running the full stack

1. Start the backend (`npm run dev` in `backend/`).
2. Start the frontend (`npm run dev` in `frontend/`).
3. Open the frontend URL (typically http://localhost:5173); it will proxy API calls to `VITE_API_BASE_URL`.

## Credits

Kiran Kumar GANESAN, Marie-Lou JODET, Romain LEFEBVRE and Isabella LEWIS - CDOF3
Students of ESILV in Year 4