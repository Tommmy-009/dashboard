# Home Server Control Hub — Secure + Stats (Liquid Glass)

Tutto-in-uno: **Express + sessioni + login**, **React + Tailwind**, **/api/stats** con `systeminformation`.

## Setup
```bash
cp .env.example .env
# imposta ADMIN_USER, ADMIN_PASS, SESSION_SECRET
npm install
npm run build
npm start
# → http://localhost:3000
```

## API
- `POST /api/login` → effettua login (limite 5 tentativi/3m)
- `POST /api/logout` → esci
- `GET /api/stats` → CPU, temperatura, RAM, disco, uptime (protetta da sessione)

## Note
- In sviluppo locale, i cookie sono `sameSite=lax`, `secure=false` per evitare problemi su HTTP.
- In produzione con proxy/HTTPS imposta `TRUST_PROXY=1` e lascia `NODE_ENV=production` nel `.env`.
# dashboard
