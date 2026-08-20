# 🚀 Deployment Checklist

## Pre-Deployment Verification

- [ ] Ensure all `.env.example` variables are mapped successfully in your production environment config.
- [ ] For Database: Ensure `.env` contains valid AWS RDS / Google Cloud SQL / PlanetScale config for `DB_HOST`, `DB_USER`, `DB_PASSWORD`.
- [ ] Connect to MySQL server and ensure it is running securely. The migration script will auto-generate all required tables.
- [ ] Run `npm run build` locally to verify production assets compile cleanly.
- [ ] Confirm Firebase Auth is active on your Firebase project and authorized domains include your production URL.
- [ ] Ensure Google Sign-In is enabled as a sign-in provider in the Firebase console.

## Production Checklist

- [ ] Application scales up correctly when processing load via Cloud Run scale rules.
- [ ] Port `3000` is bound securely to the reverse proxy.
- [ ] Application connects to primary MySQL DB without fallback to local JSON.
- [ ] The `/api/health` endpoint verifies the primary `mysql` connection state successfully!
- [ ] `NODE_ENV=production` is populated into the server runtime.
