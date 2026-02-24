const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');

const env = (key, fallback = '') => String(process.env[key] ?? fallback).trim();

const requiredEnv = ['SENDGRID_API_KEY', 'MAIL_FROM', 'MAIL_TO'];
const missingEnv = requiredEnv.filter((key) => !env(key));

const mailConfig = {
  apiKey: env('SENDGRID_API_KEY'),
  mailTo: env('MAIL_TO'),
  mailFrom: env('MAIL_FROM'),
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
  if (text.length <= 10) return '****';
  return `${text.slice(0, 4)}****${text.slice(-4)}`;
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

const createSendGridClient = () => {
  if (missingEnv.length) return null;
  sgMail.setApiKey(mailConfig.apiKey);
  return sgMail;
};

const senderDomain = () => {
  const from = mailConfig.mailFrom || '';
  const match = from.match(/@([^>\s]+)/);
  return match ? match[1].toLowerCase() : '';
};

const assertSenderDomain = () => {
  if (!mailConfig.expectedSenderDomain) return null;
  const expected = mailConfig.expectedSenderDomain.toLowerCase();
  const domain = senderDomain();
  if (!domain || domain !== expected) {
    return {
      code: 'MAIL_FROM_DOMAIN_MISMATCH',
      message: `MAIL_FROM doit utiliser le domaine ${expected}. Valeur actuelle: ${mailConfig.mailFrom || '(vide)'}`,
    };
  }
  return null;
};

const verifyTransport = async () => {
  if (missingEnv.length) {
    return {
      ok: false,
      code: 'SENDGRID_NOT_CONFIGURED',
      message: `Configuration email manquante: ${missingEnv.join(', ')}`,
    };
  }

  const senderCheck = assertSenderDomain();
  if (senderCheck) {
    return { ok: false, ...senderCheck };
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/scopes', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${mailConfig.apiKey}`,
      },
    });

    const responseText = await response.text();
    if (!response.ok) {
      return {
        ok: false,
        code: 'SENDGRID_API_AUTH_FAILED',
        message: "Echec d'authentification SendGrid. Verifiez SENDGRID_API_KEY.",
        details: {
          status: response.status,
          body: responseText,
        },
      };
    }

    return {
      ok: true,
      code: 'SENDGRID_READY',
      message: 'SendGrid operationnel.',
      details: {
        status: response.status,
      },
    };
  } catch (error) {
    return {
      ok: false,
      code: 'SENDGRID_API_UNREACHABLE',
      message: "Impossible de joindre l'API SendGrid.",
      details: {
        errorCode: error?.code || null,
        message: error?.message || null,
      },
    };
  }
};

const getEnvSummary = () => ({
  provider: 'sendgrid',
  sendgrid_api_key: maskSecret(mailConfig.apiKey),
  mail_from: mailConfig.mailFrom || null,
  mail_to: mailConfig.mailTo || null,
  expected_sender_domain: mailConfig.expectedSenderDomain || null,
  missing_env: missingEnv,
});

module.exports = {
  env,
  jsonResponse,
  generateRequestId,
  log,
  mailConfig,
  missingEnv,
  createSendGridClient,
  verifyTransport,
  getEnvSummary,
  assertSenderDomain,
};
