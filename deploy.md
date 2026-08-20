# Deployment Guide (Production Hardened)

This applet has been checked for secure configurations, UI compactness, and authentication setup.

## Auth Configuration (Firebase)
* **Required Action:** Google login flows are configured. Set environment variables in `.env` file. Look at `.env.example` for required keys.

## Data Structure
* Database stores all core configurations.
* No owner numbers or sensitive API keys are exposed or hardcoded in the frontend.
* In-app fallback defaults to secure, masked variables.

## Scripts
- `npm run dev`: Runs local development server at :3000
- `npm run build && npm run start`: Bundles the application using esbuild into a CJS production executable natively compatible with Cloud Run.
