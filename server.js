const path = require('path');
const crypto = require('crypto');
const express = require('express');
const nodemailer = require('nodemailer');

require('dotenv').config({ override: true });

const app = express();
const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

const env = (key, fallback = '') => String(process.env[key] ?? fallback).trim();
const envBool = (key, fallback = false) => {
  const value = env(key, String(fallback));
  return value.toLowerCase() === 'true';
};

const requiredEnv = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'MAIL_TO'];
const missingEnv = requiredEnv.filter((key) => !env(key));

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

const field = (value) => String(value || '').trim();
const escapeHtml = (value) =>
  field(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const smtpConfig = {
  host: env('SMTP_HOST'),
  port: Number(env('SMTP_PORT', '0')),
  secure: envBool('SMTP_SECURE', false),
  requireTLS: envBool('SMTP_REQUIRE_TLS', false),
  user: env('SMTP_USER'),
  pass: env('SMTP_PASS'),
  mailTo: env('MAIL_TO'),
  mailFrom: env('SMTP_FROM', env('SMTP_USER')),
};

let transporter = null;
if (!missingEnv.length) {
  transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    requireTLS: smtpConfig.requireTLS,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.pass,
    },
    connectionTimeout: Number(env('SMTP_CONNECTION_TIMEOUT_MS', '12000')),
    greetingTimeout: Number(env('SMTP_GREETING_TIMEOUT_MS', '12000')),
    socketTimeout: Number(env('SMTP_SOCKET_TIMEOUT_MS', '20000')),
    tls: {
      servername: smtpConfig.host,
      minVersion: 'TLSv1.2',
      rejectUnauthorized: envBool('SMTP_TLS_REJECT_UNAUTHORIZED', true),
    },
  });
}

const diagnoseSmtpError = (error) => {
  const code = error?.code || 'SMTP_UNKNOWN_ERROR';

  if (code === 'ETIMEDOUT' || code === 'ESOCKET') {
    return {
      code: 'SMTP_TIMEOUT',
      message: "Connexion SMTP expir\u00e9e. Port bloqu\u00e9 ou h\u00f4te SMTP inaccessible depuis l'h\u00e9bergeur.",
    };
  }

  if (code === 'ECONNECTION' || code === 'ECONNREFUSED') {
    return {
      code: 'SMTP_CONNECTION_FAILED',
      message: 'Connexion SMTP refus\u00e9e. V\u00e9rifiez SMTP_HOST/SMTP_PORT et restrictions sortantes h\u00e9bergeur.',
    };
  }

  if (code === 'EAUTH') {
    return {
      code: 'SMTP_AUTH_FAILED',
      message: "Authentification SMTP invalide. V\u00e9rifiez SMTP_USER/SMTP_PASS (mot de passe d'application).",
    };
  }

  return {
    code: 'SMTP_SEND_FAILED',
    message: "\u00c9chec d'envoi SMTP. V\u00e9rifiez la configuration DNS (SPF/DKIM/DMARC) et le certificat TLS SMTP.",
  };
};

const buildEmailHtml = (data) => `
  <h2>Nouvelle inscription - Youth Foundation Haiti</h2>
  <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
    <tr><th align="left">Nom complet</th><td>${escapeHtml(data.full_name)}</td></tr>
    <tr><th align="left">Email</th><td>${escapeHtml(data.email)}</td></tr>
    <tr><th align="left">Date de naissance</th><td>${escapeHtml(data.birth_date)}</td></tr>
    <tr><th align="left">Adresse compl\u00e8te</th><td>${escapeHtml(data.full_address)}</td></tr>
    <tr><th align="left">T\u00e9l\u00e9phone / WhatsApp</th><td>${escapeHtml(data.whatsapp_phone)}</td></tr>
    <tr><th align="left">Sexe</th><td>${escapeHtml(data.gender)}</td></tr>
    <tr><th align="left">Niveau d'\u00e9tudes</th><td>${escapeHtml(data.education_level)}</td></tr>
    <tr><th align="left">Profession / Statut</th><td>${escapeHtml(data.profession_status)}</td></tr>
  </table>
`;

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

const verifyTransport = async () => {
  if (!transporter) {
    return {
      ok: false,
      code: 'SMTP_NOT_CONFIGURED',
      message: `Configuration SMTP manquante: ${missingEnv.join(', ')}`,
    };
  }

  try {
    await transporter.verify();
    return { ok: true, code: 'SMTP_READY', message: 'SMTP operationnel.' };
  } catch (error) {
    const diagnostic = diagnoseSmtpError(error);
    return {
      ok: false,
      code: diagnostic.code,
      message: diagnostic.message,
      details: error.message,
    };
  }
};

app.get('/api/healthz', (_req, res) => {
  return res.json({
    ok: true,
    service: 'yfh-mail-backend',
    env: isProduction ? 'production' : 'development',
    smtp_configured: !missingEnv.length,
    missing_env: missingEnv,
    now: nowIso(),
  });
});

app.get('/api/health/email', async (req, res) => {
  const status = await verifyTransport();
  if (!status.ok) {
    log('error', req.requestId, 'SMTP health check failed', status);
    return res.status(500).json({
      ok: false,
      ...status,
      request_id: req.requestId,
    });
  }

  log('info', req.requestId, 'SMTP health check passed');
  return res.json({
    ok: true,
    ...status,
    request_id: req.requestId,
  });
});

app.post('/api/contact', async (req, res) => {
  if (!transporter) {
    return res.status(500).json({
      ok: false,
      code: 'SMTP_NOT_CONFIGURED',
      message: `Configuration SMTP manquante: ${missingEnv.join(', ')}`,
      request_id: req.requestId,
    });
  }

  const fullName = field(req.body.full_name);
  const email = field(req.body.email);
  const birthDate = field(req.body.birth_date);
  const fullAddress = field(req.body.full_address);
  const whatsappPhone = field(req.body.whatsapp_phone);
  const gender = field(req.body.gender);
  const genderOther = field(req.body.gender_other);
  const education = field(req.body.education_level);
  const educationOther = field(req.body.education_other);
  const profession = field(req.body.profession_status);

  const finalGender = gender === 'Autre' ? genderOther : gender;
  const finalEducation = education === 'Autre' ? educationOther : education;

  const required = [
    fullName,
    email,
    birthDate,
    fullAddress,
    whatsappPhone,
    finalGender,
    finalEducation,
    profession,
  ];

  if (required.some((value) => !value)) {
    return res.status(400).json({
      ok: false,
      code: 'VALIDATION_REQUIRED_FIELDS',
      message: 'Veuillez remplir tous les champs obligatoires.',
      request_id: req.requestId,
    });
  }

  const basicEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!basicEmailRegex.test(email)) {
    return res.status(400).json({
      ok: false,
      code: 'VALIDATION_EMAIL_INVALID',
      message: "L'adresse email est invalide.",
      request_id: req.requestId,
    });
  }

  try {
    const info = await transporter.sendMail({
      from: `"YFH Formulaire" <${smtpConfig.mailFrom}>`,
      to: smtpConfig.mailTo,
      replyTo: email,
      subject: 'Nouvelle inscription - Youth Foundation Haiti',
      text: [
        `Nom complet: ${fullName}`,
        `Email: ${email}`,
        `Date de naissance: ${birthDate}`,
        `Adresse compl\u00e8te: ${fullAddress}`,
        `T\u00e9l\u00e9phone / WhatsApp: ${whatsappPhone}`,
        `Sexe: ${finalGender}`,
        `Niveau d'\u00e9tudes: ${finalEducation}`,
        `Profession / Statut: ${profession}`,
      ].join('\n'),
      html: buildEmailHtml({
        full_name: fullName,
        email,
        birth_date: birthDate,
        full_address: fullAddress,
        whatsapp_phone: whatsappPhone,
        gender: finalGender,
        education_level: finalEducation,
        profession_status: profession,
      }),
    });

    log('info', req.requestId, 'Contact form email sent', {
      messageId: info?.messageId || null,
      fromDomain: smtpConfig.mailFrom.split('@')[1] || null,
      toDomain: smtpConfig.mailTo.split('@')[1] || null,
    });

    return res.json({
      ok: true,
      code: 'EMAIL_SENT',
      message: 'Votre inscription a ete envoyee avec succes.',
      request_id: req.requestId,
    });
  } catch (error) {
    const diagnostic = diagnoseSmtpError(error);
    log('error', req.requestId, 'SMTP send failed', {
      code: diagnostic.code,
      errorCode: error?.code || null,
      responseCode: error?.responseCode || null,
      errorMessage: error?.message || null,
    });

    return res.status(500).json({
      ok: false,
      code: diagnostic.code,
      message: diagnostic.message,
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
    console.log(`[SMTP] ${status.message}`);
  } else {
    console.error(`[SMTP] ${status.code}: ${status.message}`);
  }
});
