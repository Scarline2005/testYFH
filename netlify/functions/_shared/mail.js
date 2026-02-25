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

// Initialisation SendGrid si la clé est présente
if (mailConfig.apiKey) {
  sgMail.setApiKey(mailConfig.apiKey);
}

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

// --- Nouvelle logique unifiée d'envoi ---

const field = (value) => String(value || '').trim();
const escapeHtml = (value) =>
  field(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const buildEmailHtml = (data) => `
  <h2>Nouvelle inscription - Youth Foundation Haiti</h2>
  <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; border-color: #ddd; font-family: sans-serif;">
    <tr style="background-color:#f8f9fa;"><th align="left">Nom complet</th><td>${escapeHtml(data.full_name)}</td></tr>
    <tr><th align="left">Email</th><td>${escapeHtml(data.email)}</td></tr>
    <tr style="background-color:#f8f9fa;"><th align="left">Date de naissance</th><td>${escapeHtml(data.birth_date)}</td></tr>
    <tr><th align="left">Adresse compl\u00e8te</th><td>${escapeHtml(data.full_address)}</td></tr>
    <tr style="background-color:#f8f9fa;"><th align="left">T\u00e9l\u00e9phone / WhatsApp</th><td>${escapeHtml(data.whatsapp_phone)}</td></tr>
    <tr><th align="left">Sexe</th><td>${escapeHtml(data.gender)}</td></tr>
    <tr style="background-color:#f8f9fa;"><th align="left">Niveau d'\u00e9tudes</th><td>${escapeHtml(data.education_level)}</td></tr>
    <tr><th align="left">Profession / Statut</th><td>${escapeHtml(data.profession_status)}</td></tr>
  </table>
  <p style="font-size: 12px; color: #666; margin-top: 20px;">Envoyé depuis le formulaire du site web.</p>
`;

const processContactForm = async (body, requestId) => {
  // 1. Vérification configuration
  if (missingEnv.length) {
    throw { code: 'CONFIG_ERROR', message: `Configuration manquante: ${missingEnv.join(', ')}` };
  }

  // 2. Honeypot (Double vérification backend)
  if (body.yfh_bot_check) {
    log('warn', requestId, 'Spam detected via honeypot');
    return { ok: true, message: 'Inscription reçue.' }; // Fake success
  }

  // 3. Extraction et Validation
  const data = {
    full_name: field(body.full_name),
    email: field(body.email),
    birth_date: field(body.birth_date),
    full_address: field(body.full_address),
    whatsapp_phone: field(body.whatsapp_phone),
    gender: body.gender === 'Autre' ? field(body.gender_other) : field(body.gender),
    education_level: body.education_level === 'Autre' ? field(body.education_other) : field(body.education_level),
    profession_status: field(body.profession_status),
  };

  const required = ['full_name', 'email', 'birth_date', 'full_address', 'whatsapp_phone', 'gender', 'education_level', 'profession_status'];
  const missingFields = required.filter(k => !data[k]);

  if (missingFields.length > 0) {
    throw { code: 'VALIDATION_ERROR', message: 'Veuillez remplir tous les champs obligatoires.' };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    throw { code: 'VALIDATION_ERROR', message: 'Adresse email invalide.' };
  }

  // 4. Envoi via SendGrid API
  const msg = {
    to: mailConfig.mailTo,
    from: {
      email: mailConfig.mailFrom,
      name: 'YFH Site Web',
    },
    replyTo: data.email,
    subject: `Nouvelle inscription: ${data.full_name}`,
    text: `Nom: ${data.full_name}\nEmail: ${data.email}\nTél: ${data.whatsapp_phone}\n(Voir version HTML pour détails)`,
    html: buildEmailHtml(data),
  };

  try {
    await sgMail.send(msg);
    log('info', requestId, 'Email sent successfully via SendGrid API');
    return { ok: true, message: 'Votre inscription a été envoyée avec succès.' };
  } catch (error) {
    log('error', requestId, 'SendGrid API Error', {
      message: error.message,
      response: error.response ? error.response.body : null
    });
    throw { code: 'SEND_ERROR', message: "Erreur lors de l'envoi. Veuillez réessayer plus tard." };
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
  verifyTransport,
  getEnvSummary,
  assertSenderDomain,
  processContactForm,
};
