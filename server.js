const path = require('path');
const crypto = require('crypto');
const express = require('express');

require('dotenv').config({ override: true });

// Import de la logique partagée (garantit la parité Dev/Prod)
const { processContactForm, verifyTransport, missingEnv } = require('./netlify/functions/_shared/mail');

const app = express();
const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

const env = (key, fallback = '') => String(process.env[key] ?? fallback).trim();

const allowedOrigins = env('CLIENT_ORIGINS')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const nowIso = () => new Date().toISOString();

const log = (level, requestId, message, details = {}) => {
  const payload = {
    ts: nowIso(),
    level,
    requestId,
    message,
    ...details,
  };
  const serialized = JSON.stringify(payload);
  if (level === 'error') {
    console.error(serialized);
    return;
  }
  console.log(serialized);
};

const generateRequestId = () => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

app.set('trust proxy', 1);
app.use(express.json({ limit: '128kb' }));
app.use(express.urlencoded({ extended: true, limit: '128kb' }));
app.use(express.static(path.join(__dirname)));

app.use((req, _res, next) => {
  req.requestId = generateRequestId();
  next();
});

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (!origin) {
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    return next();
  }

  const originAllowed = allowedOrigins.length === 0 || allowedOrigins.includes(origin);
  if (!originAllowed) {
    log('error', req.requestId, 'Origin rejected by CORS policy', { origin });
    return res.status(403).json({
      ok: false,
      code: 'CORS_ORIGIN_BLOCKED',
      message: 'Origine non autorisee pour ce service.',
      request_id: req.requestId,
    });
  }

  res.header('Access-Control-Allow-Origin', origin);
  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});

app.get('/api/healthz', (_req, res) => {
  return res.json({
    ok: true,
    service: 'yfh-mail-backend',
    env: isProduction ? 'production' : 'development',
    email_configured: !missingEnv.length,
    missing_env: missingEnv,
    now: nowIso(),
  });
});

app.get('/api/health/email', async (req, res) => {
  const status = await verifyTransport();
  if (!status.ok) {
    log('error', req.requestId, 'Email health check failed', status);
    return res.status(500).json({
      ok: false,
      ...status,
      request_id: req.requestId,
    });
  }

  log('info', req.requestId, 'Email health check passed');
  return res.json({
    ok: true,
    ...status,
    request_id: req.requestId,
  });
});

app.post('/api/contact', async (req, res) => {
  try {
    const result = await processContactForm(req.body, req.requestId);
    return res.json({
      ...result,
      request_id: req.requestId,
    });
  } catch (error) {
    const code = error.code === 'VALIDATION_ERROR' ? 400 : 500;
    return res.status(code).json({
      ok: false,
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || "Une erreur interne est survenue.",
      request_id: req.requestId,
    });
  }
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, async () => {
  console.log(`YFH server running on http://localhost:${port}`);
  const status = await verifyTransport();
  if (status.ok) {
    console.log(`[EMAIL] ${status.message}`);
  } else {
    console.error(`[EMAIL] ${status.code}: ${status.message}`);
  }
});
