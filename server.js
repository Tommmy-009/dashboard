import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import si from 'systeminformation';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --- Env checks ---
const REQUIRED = ['ADMIN_USER', 'ADMIN_PASS', 'SESSION_SECRET'];
for (const k of REQUIRED) {
  if (!process.env[k]) {
    console.error(`❌ Missing ${k} in environment. Create a .env (see .env.example).`);
    process.exit(1);
  }
}
const PORT = parseInt(process.env.PORT || '3000', 10);
const TRUST_PROXY = process.env.TRUST_PROXY === '1';
const PROD = process.env.NODE_ENV === 'production';

if (TRUST_PROXY) app.set('trust proxy', 1);

// --- Hardening ---
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- Sessions (lax on localhost for dev, strict+secure in prod behind proxy) ---
// Forza a trattare localhost come dominio valido per i cookie
app.set('trust proxy', 1);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    // Cookie compatibili sia su localhost (HTTP) che su HTTPS (Cloudflare)
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // rimani su HTTP
      maxAge: 1000 * 60 * 60 * 12,
      domain: 'localhost',
    },
  })
);

// --- Rate limit on login ---
const loginLimiter = rateLimit({
  windowMs: 3 * 60 * 1000,
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: 'Troppi tentativi. Riprova tra qualche minuto.' },
});

// --- Routes ---
app.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/api/login', loginLimiter, (req, res) => {
  const { username, password } = req.body || {};
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    req.session.user = { username };
    return res.json({ ok: true });
  }
  return res.status(401).json({ ok: false, error: 'Credenziali errate' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

app.get('/api/me', (req, res) => {
  if (req.session.user) return res.json({ ok: true, user: req.session.user });
  return res.status(401).json({ ok: false });
});

// --- Stats API (protected) ---
app.get('/api/stats', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ ok: false });
  try {
    const [cpuLoad, mem, temp, disks, osInfo, time] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.cpuTemperature(),
      si.fsSize(),
      si.osInfo(),
      si.time()
    ]);

    // Preferisci il mount "/" (root), altrimenti il primo disco
    let disk = disks.find(d => d.mount === '/') || disks[0] || null;

    const payload = {
      ok: true,
      os: osInfo.distro,
      cpuLoad: Number(cpuLoad.currentLoad.toFixed(1)),
      temp: temp?.main ? Number(temp.main.toFixed(1)) : null,
      memUsedPct: Number(((mem.active / mem.total) * 100).toFixed(1)),
      memTotalGB: Number((mem.total / 1e9).toFixed(1)),
      memActiveGB: Number((mem.active / 1e9).toFixed(1)),
      diskMount: disk ? disk.mount : null,
      diskUsedPct: disk ? Number((disk.use).toFixed(1)) : null,
      diskSizeGB: disk ? Number((disk.size / 1e9).toFixed(1)) : null,
      diskUsedGB: disk ? Number((disk.used / 1e9).toFixed(1)) : null,
      uptimeMin: Number((time.uptime / 60).toFixed(1)),
    };

    res.json(payload);
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// Guard: everything else (except assets) requires session
app.use((req, res, next) => {
  const open = ['/login', '/api/login', '/api/logout', '/api/me', '/favicon.ico'];
  if (open.includes(req.path) || req.path.startsWith('/assets')) return next();
  if (req.session.user) return next();
  return res.redirect('/login');
});

// Static (built app)
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Secure server (stats) on http://localhost:${PORT}`);
});
