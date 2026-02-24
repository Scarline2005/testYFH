const crypto = require('crypto');
const nodemailer = require('nodemailer');

const env = (key, fallback = '') => String(process.env[key] ?? fallback).trim();
const envBool = (key, fallback = false) => String(env(key, String(fallback))).toLowerCase() === 'true';

const requiredEnv = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'MAIL_TO'];
const missingEnv = requiredEnv.filter((key) => !env(key));

const smtpConfig = {
  host: env('SMTP_HOST'),
  port: Number(env('SMTP_PORT', '0')),
  secure: envBool('SMTP_SECURE', false),
  requireTLS: envBool('SMTP_REQUIRE_TLS', false),
  user: env('SMTP_USER'),
  pass: env('SMTP_PASS'),
  mailTo: env('MAIL_TO'),
  mailFrom: env('SMTP_FROM', env('SMTP_USER')),
  expectedSenderDomain: env('EXPECTED_SENDER_DOMAIN', ''),
};

const nowIso = () => new Date().toISOString();

const jsonResponse = (statusCode, payload) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  },
  body: JSON.stringify(payload),
});

const generateRequestId = () => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const maskSecret = (value) => {
  const text = String(value || '');
  if (!text) return '';
  if (text.length <= 4) return '****';
  return `${text.slice(0, 2)}****${text.slice(-2)}`;
};

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

const diagnoseSmtpError = (error) => {
  const code = error?.code || 'SMTP_UNKNOWN_ERROR';

  if (code === 'ETIMEDOUT' || code === 'ESOCKET') {
    return {
      code: 'SMTP_TIMEOUT',
      message: "Connexion SMTP expiree. Port bloque ou hote SMTP inaccessible depuis l'hebergeur.",
    };
  }

  if (code === 'ECONNECTION' || code === 'ECONNREFUSED') {
    return {
      code: 'SMTP_CONNECTION_FAILED',
      message: 'Connexion SMTP refusee. Verifiez SMTP_HOST/SMTP_PORT et restrictions sortantes hebergeur.',
    };
  }

  if (code === 'EAUTH') {
    return {
      code: 'SMTP_AUTH_FAILED',
      message: "Authentification SMTP invalide. Verifiez SMTP_USER/SMTP_PASS (mot de passe d'application).",
    };
  }

  return {
    code: 'SMTP_SEND_FAILED',
    message: "Echec d'envoi SMTP. Verifiez DNS (SPF/DKIM/DMARC) et certificat TLS SMTP.",
  };
};

const createTransporter = () => {
  if (missingEnv.length) return null;

  return nodemailer.createTransport({
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
    logger: envBool('SMTP_LOGGER', true),
    debug: envBool('SMTP_DEBUG', true),
    tls: {
      servername: smtpConfig.host,
      minVersion: 'TLSv1.2',
      rejectUnauthorized: envBool('SMTP_TLS_REJECT_UNAUTHORIZED', true),
    },
  });
};

const senderDomain = () => {
  const from = smtpConfig.mailFrom || '';
  const match = from.match(/@([^>\s]+)/);
  return match ? match[1].toLowerCase() : '';
};

const assertSenderDomain = () => {
  if (!smtpConfig.expectedSenderDomain) return null;
  const expected = smtpConfig.expectedSenderDomain.toLowerCase();
  const domain = senderDomain();
  if (!domain || domain !== expected) {
    return {
      code: 'SMTP_FROM_DOMAIN_MISMATCH',
      message: `SMTP_FROM doit utiliser le domaine ${expected}. Valeur actuelle: ${smtpConfig.mailFrom || '(vide)'}`,
    };
  }
  return null;
};

const verifyTransport = async () => {
  if (missingEnv.length) {
    return {
      ok: false,
      code: 'SMTP_NOT_CONFIGURED',
      message: `Configuration SMTP manquante: ${missingEnv.join(', ')}`,
    };
  }

  const senderCheck = assertSenderDomain();
  if (senderCheck) {
    return { ok: false, ...senderCheck };
  }

  const transporter = createTransporter();
  try {
    await transporter.verify();
    return { ok: true, code: 'SMTP_READY', message: 'SMTP operationnel.' };
  } catch (error) {
    const diagnostic = diagnoseSmtpError(error);
    return {
      ok: false,
      code: diagnostic.code,
      message: diagnostic.message,
      details: {
        errorCode: error?.code || null,
        responseCode: error?.responseCode || null,
        command: error?.command || null,
        response: error?.response || null,
        message: error?.message || null,
      },
    };
  }
};

const getEnvSummary = () => ({
  smtp_host: smtpConfig.host || null,
  smtp_port: smtpConfig.port || null,
  smtp_secure: smtpConfig.secure,
  smtp_require_tls: smtpConfig.requireTLS,
  smtp_user: maskSecret(smtpConfig.user),
  smtp_from: smtpConfig.mailFrom || null,
  mail_to: smtpConfig.mailTo || null,
  expected_sender_domain: smtpConfig.expectedSenderDomain || null,
  missing_env: missingEnv,
});

module.exports = {
  env,
  envBool,
  jsonResponse,
  generateRequestId,
  log,
  smtpConfig,
  missingEnv,
  createTransporter,
  diagnoseSmtpError,
  verifyTransport,
  getEnvSummary,
  assertSenderDomain,
};
